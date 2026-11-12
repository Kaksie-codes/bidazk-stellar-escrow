/* The Stellar adapter for the escrow port.

   Every escrow rule is enforced by the Soroban contract. Nothing here decides
   who may do what; it only builds, signs and submits calls, and translates the
   contract's answers into the port's types. */

import { Asset, Keypair, contract, rpc } from "@stellar/stellar-sdk";
import {
  ESCROW_CONTRACT_ID,
  EXPLORER_URL,
  NETWORK_PASSPHRASE,
  RPC_URL,
} from "./config";
import {
  EscrowRuleError,
  type CreateDealInput,
  type Deal,
  type DealStatus,
  type EscrowService,
  type Receipt,
} from "./types";

/* Mirrors `enum Error` in the contract. The contract is the authority; these
   only turn its numeric codes into sentences. */
const RULES: Record<number, string> = {
  1: "The amount must be more than zero.",
  2: "Buyer and seller cannot be the same wallet.",
  3: "The referee cannot be a buyer or seller.",
  4: "Delivery window must be between 1 minute and 30 days.",
  5: "Inspection window must be between 1 minute and 14 days.",
  6: "That deal does not exist.",
  7: "That action is not allowed in the deal's current state.",
  8: "The delivery deadline has passed. Delivery can no longer be marked.",
  9: "The delivery deadline has not passed yet. The seller may still deliver.",
  10: "The inspection window has closed. Disputes are no longer accepted.",
  11: "The inspection window is still open. The buyer may still dispute.",
  12: "The buyer's share must be between zero and the deal amount.",
};

const PAGE = 50;

type RawDeal = {
  buyer: string;
  seller: string;
  item: number;
  amount: bigint;
  status: { tag: DealStatus };
  created_at: bigint;
  delivery_deadline: bigint;
  inspection_period: bigint;
  delivered_at: bigint;
  buyer_refund: bigint;
};

type ContractResult<T> = { isErr(): boolean; unwrap(): T; unwrapErr(): { message: string } };

/* Methods are generated from the contract's on-chain spec at runtime, so the
   SDK cannot type them. This is the subset the adapter calls. */
type EscrowMethods = {
  create(args: {
    buyer: string;
    seller: string;
    item: number;
    amount: bigint;
    delivery_window: bigint;
    inspection_period: bigint;
  }): Promise<contract.AssembledTransaction<ContractResult<bigint>>>;
  mark_delivered(args: { deal_id: bigint }): Promise<contract.AssembledTransaction<ContractResult<void>>>;
  confirm(args: { deal_id: bigint }): Promise<contract.AssembledTransaction<ContractResult<void>>>;
  dispute(args: { deal_id: bigint }): Promise<contract.AssembledTransaction<ContractResult<void>>>;
  cancel(args: { deal_id: bigint }): Promise<contract.AssembledTransaction<ContractResult<void>>>;
  claim_release(args: { deal_id: bigint }): Promise<contract.AssembledTransaction<ContractResult<void>>>;
  claim_refund(args: { deal_id: bigint }): Promise<contract.AssembledTransaction<ContractResult<void>>>;
  resolve(args: { deal_id: bigint; buyer_share: bigint }): Promise<contract.AssembledTransaction<ContractResult<void>>>;
  deal_count(): Promise<contract.AssembledTransaction<bigint>>;
  get_deals(args: { start: bigint; limit: number }): Promise<contract.AssembledTransaction<[bigint, RawDeal][]>>;
};

type EscrowClient = contract.Client & EscrowMethods;

function toDeal(id: bigint, raw: RawDeal): Deal {
  return {
    id,
    buyer: raw.buyer,
    seller: raw.seller,
    itemId: Number(raw.item),
    amount: BigInt(raw.amount),
    status: raw.status.tag,
    createdAt: Number(raw.created_at),
    deliveryDeadline: Number(raw.delivery_deadline),
    inspectionPeriod: Number(raw.inspection_period),
    deliveredAt: Number(raw.delivered_at),
    buyerRefund: BigInt(raw.buyer_refund),
  };
}

/* The contract rejects a broken rule during simulation, before anything is
   signed, with "Error(Contract, #<code>)" in the host error. Surface that as
   the rule rather than as a failed transaction. */
function throwIfRuleBroken(text: string | undefined) {
  const code = Number(/Error\(Contract, #(\d+)\)/.exec(text ?? "")?.[1] ?? 0);
  if (code) {
    throw new EscrowRuleError(code, RULES[code] ?? "The escrow rejected that action.");
  }
}

function simulationError(tx: contract.AssembledTransaction<unknown>): string | undefined {
  const sim = tx.simulation;
  return sim && rpc.Api.isSimulationError(sim) ? sim.error : undefined;
}

export function createStellarEscrow(signers: Keypair[]): EscrowService {
  const server = new rpc.Server(RPC_URL);
  const byAddress = new Map(signers.map((k) => [k.publicKey(), k]));

  let specPromise: Promise<contract.Spec> | null = null;
  const spec = () => {
    specPromise ??= contract.Client.from({
      contractId: ESCROW_CONTRACT_ID,
      networkPassphrase: NETWORK_PASSPHRASE,
      rpcUrl: RPC_URL,
    }).then((c) => c.spec);
    specPromise.catch(() => (specPromise = null));
    return specPromise;
  };

  /* One client per acting party: the party is the transaction source, so its
     signature also satisfies the contract's require_auth for that address. */
  async function clientFor(as?: string): Promise<EscrowClient> {
    const keypair = as ? byAddress.get(as) : undefined;
    if (as && !keypair) throw new Error(`No wallet available for ${as}`);
    const options: contract.ClientOptions = {
      contractId: ESCROW_CONTRACT_ID,
      networkPassphrase: NETWORK_PASSPHRASE,
      rpcUrl: RPC_URL,
      ...(keypair && {
        publicKey: keypair.publicKey(),
        ...contract.basicNodeSigner(keypair, NETWORK_PASSPHRASE),
      }),
    };
    return new contract.Client(await spec(), options) as EscrowClient;
  }

  async function send<T>(tx: contract.AssembledTransaction<T>): Promise<{ receipt: Receipt; result: T }> {
    throwIfRuleBroken(simulationError(tx));
    let sent: contract.SentTransaction<T>;
    try {
      sent = await tx.signAndSend();
    } catch (err) {
      /* The ledger can move between simulation and submission, e.g. a
         deadline passing, so a rule can still fail at submission. */
      throwIfRuleBroken(String(err));
      throw err;
    }
    const hash = sent.sendTransactionResponse?.hash ?? "";
    return { receipt: { id: hash, url: `${EXPLORER_URL}/tx/${hash}` }, result: sent.result };
  }

  async function act(
    as: string,
    call: (c: EscrowClient) => Promise<contract.AssembledTransaction<ContractResult<void>>>,
  ): Promise<Receipt> {
    const client = await clientFor(as);
    return (await send(await call(client))).receipt;
  }

  return {
    async create(input: CreateDealInput) {
      const client = await clientFor(input.buyer);
      const tx = await client.create({
        buyer: input.buyer,
        seller: input.seller,
        item: input.itemId,
        amount: input.amount,
        delivery_window: BigInt(input.deliveryWindowSecs),
        inspection_period: BigInt(input.inspectionSecs),
      });
      const { receipt, result } = await send(tx);
      return { dealId: BigInt(result.unwrap()), receipt };
    },

    markDelivered: (id, as) => act(as, (c) => c.mark_delivered({ deal_id: id })),
    confirm: (id, as) => act(as, (c) => c.confirm({ deal_id: id })),
    dispute: (id, as) => act(as, (c) => c.dispute({ deal_id: id })),
    cancel: (id, as) => act(as, (c) => c.cancel({ deal_id: id })),
    claimRelease: (id, as) => act(as, (c) => c.claim_release({ deal_id: id })),
    claimRefund: (id, as) => act(as, (c) => c.claim_refund({ deal_id: id })),
    resolve: (id, share, as) => act(as, (c) => c.resolve({ deal_id: id, buyer_share: share })),

    /* The newest page only. The demo contract is shared by every visitor, and
       nobody needs deals from before the last fifty. */
    async listDeals() {
      const client = await clientFor();
      const count = BigInt((await client.deal_count()).result);
      const start = count > BigInt(PAGE) ? count - BigInt(PAGE) : BigInt(0);
      const page = (await client.get_deals({ start, limit: PAGE })).result;
      return page.map(([id, raw]) => toDeal(BigInt(id), raw));
    },

    /* Wallets (G...) hold native XLM on their account entry; contracts (C...)
       hold it as an asset-contract balance. The SDK's one-call helper treats
       native XLM on a wallet as a trustline and fails, so read each directly. */
    async balanceOf(address: string) {
      if (address.startsWith("G")) {
        try {
          const entry = await server.getAccountEntry(address);
          /* A plain field in SDK 17, a method in older XDR builds. */
          const balance: unknown = entry.balance;
          const raw = typeof balance === "function" ? balance.call(entry) : balance;
          return BigInt(String(raw));
        } catch {
          return BigInt(0); // not created yet, i.e. not funded
        }
      }
      const res = await server.getAssetBalance(address, Asset.native(), NETWORK_PASSPHRASE);
      return BigInt(res.balanceEntry?.amount ?? 0);
    },

    escrowAddress: () => ESCROW_CONTRACT_ID,
  };
}
