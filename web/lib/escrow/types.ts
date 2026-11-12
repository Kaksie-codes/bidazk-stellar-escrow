/* The escrow port.

   Pages talk to this interface and nothing else. stellar.ts implements it
   against the Soroban contract today; a later implementation can call
   api.bidazk.com instead, and no page changes. Keep Stellar types (Keypair,
   XDR, stroops) out of this file so that swap stays a one-import change. */

export type DealStatus =
  | "Funded"
  | "Delivered"
  | "Disputed"
  | "Released"
  | "Refunded"
  | "Cancelled"
  | "Resolved";

export const TERMINAL_STATUSES: readonly DealStatus[] = [
  "Released",
  "Refunded",
  "Cancelled",
  "Resolved",
];

export type Deal = {
  id: bigint;
  buyer: string;
  seller: string;
  /* Catalog reference, stored on-chain so buyer and seller see the same item. */
  itemId: number;
  /* Minor units of the settlement asset. Pages format, never compute. */
  amount: bigint;
  status: DealStatus;
  /* Unix seconds, from the settlement layer's clock rather than the browser's. */
  createdAt: number;
  deliveryDeadline: number;
  inspectionPeriod: number;
  /* Zero until the seller marks delivery. */
  deliveredAt: number;
  buyerRefund: bigint;
};

export type CreateDealInput = {
  buyer: string;
  seller: string;
  itemId: number;
  amount: bigint;
  deliveryWindowSecs: number;
  inspectionSecs: number;
};

/* A link a judge or user can open to verify the action independently. */
export type Receipt = { id: string; url: string };

/* `as` names the party acting. A session-based backend would ignore it and
   use the logged-in user; a wallet-based one uses it to pick the signer. */
export interface EscrowService {
  create(input: CreateDealInput): Promise<{ dealId: bigint; receipt: Receipt }>;
  markDelivered(dealId: bigint, as: string): Promise<Receipt>;
  confirm(dealId: bigint, as: string): Promise<Receipt>;
  dispute(dealId: bigint, as: string): Promise<Receipt>;
  cancel(dealId: bigint, as: string): Promise<Receipt>;
  claimRelease(dealId: bigint, as: string): Promise<Receipt>;
  claimRefund(dealId: bigint, as: string): Promise<Receipt>;
  resolve(dealId: bigint, buyerShare: bigint, as: string): Promise<Receipt>;
  listDeals(): Promise<Deal[]>;
  balanceOf(address: string): Promise<bigint>;
  /* Where the escrowed funds sit, so a page can show them being held. */
  escrowAddress(): string;
}

/* Thrown for rule violations the escrow rejected, as opposed to network or
   wallet failures, so a page can show the rule rather than a stack trace. */
export class EscrowRuleError extends Error {
  readonly code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = "EscrowRuleError";
    this.code = code;
  }
}
