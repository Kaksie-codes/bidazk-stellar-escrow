/* Throwaway testnet wallets for the public demo.

   Judges and visitors should not need a wallet extension to try escrow, so
   each browser gets its own buyer and seller keypair, funded from the testnet
   faucet and kept in localStorage. In production people sign with their own
   wallet and no secret key ever touches page storage. */

import { Keypair, StrKey } from "@stellar/stellar-sdk";
import { DEMO_ARBITER_SECRET, FRIENDBOT_URL } from "./config";
import { createStellarEscrow } from "./stellar";
import type { EscrowService } from "./types";

export type DemoWallets = {
  buyer: string;
  seller: string;
  arbiter: string;
  escrow: EscrowService;
};

const STORAGE_KEY = "bidazk-demo-wallets-v1";

function readSecrets(): { buyer: string; seller: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSecrets(secrets: { buyer: string; seller: string }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(secrets));
  } catch {
    /* Private mode: the wallets last for this visit only. */
  }
}

/* Browser only: call from an effect, never during render. */
export function loadDemoWallets(fresh = false): DemoWallets {
  let secrets = fresh ? null : readSecrets();
  if (!secrets) {
    secrets = { buyer: Keypair.random().secret(), seller: Keypair.random().secret() };
    writeSecrets(secrets);
  }
  const buyer = Keypair.fromSecret(secrets.buyer);
  const seller = Keypair.fromSecret(secrets.seller);
  const arbiter = Keypair.fromSecret(DEMO_ARBITER_SECRET);
  return {
    buyer: buyer.publicKey(),
    seller: seller.publicKey(),
    arbiter: arbiter.publicKey(),
    escrow: createStellarEscrow([buyer, seller, arbiter]),
  };
}

/* A shop link carries the seller's public address; reject anything else
   before it reaches a transaction. */
export function isValidShopAddress(value: string): boolean {
  return StrKey.isValidEd25519PublicKey(value);
}

/* The faucet answers 400 for an account it already funded, which is fine. */
export async function fundFromFaucet(address: string): Promise<void> {
  const res = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`);
  if (!res.ok && res.status !== 400) {
    throw new Error(`Testnet faucet failed (${res.status}). Try again in a moment.`);
  }
}
