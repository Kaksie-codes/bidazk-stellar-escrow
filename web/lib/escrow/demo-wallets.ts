/* Wallets for the public demo.

   Buyers: visitors should not need a wallet extension, so each browser gets
   its own throwaway buyer keypair, funded from the testnet faucet and kept
   in localStorage.

   The shop: every purchase goes to one fixed shop, Stellar Shop, so the
   presenter's screen sees every order in the room. Only its public address
   ships in the bundle. The presenter imports the secret once by opening a
   private link (#shopkey=…); the fragment never reaches the server, and the
   page removes it from the address bar straight away.

   In production people sign with their own wallet and no secret key ever
   touches page storage. */

import { Keypair, StrKey } from "@stellar/stellar-sdk";
import { DEMO_ARBITER_SECRET, FRIENDBOT_URL, STELLAR_SHOP_ADDRESS } from "./config";
import { createStellarEscrow } from "./stellar";
import type { EscrowService } from "./types";

export type DemoWallets = {
  buyer: string;
  /* Always Stellar Shop's address. */
  seller: string;
  /* True only in the presenter's browser, which holds the shop's key. */
  isShop: boolean;
  arbiter: string;
  escrow: EscrowService;
};

const BUYER_KEY = "bidazk-demo-buyer-v2";
const SHOP_KEY = "bidazk-stellar-shop-key-v1";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Private mode: this lasts for this visit only. */
  }
}

/* Valid only if it is the secret for Stellar Shop's address. */
function shopKeypair(secret: string | null): Keypair | null {
  if (!secret || !StrKey.isValidEd25519SecretSeed(secret)) return null;
  const kp = Keypair.fromSecret(secret);
  return kp.publicKey() === STELLAR_SHOP_ADDRESS ? kp : null;
}

/* Reads #shopkey=… from the address bar, stores it if it is the real shop
   key, and strips it from the URL either way. Returns whether a key was
   accepted, so the page can say so. */
export function importShopKeyFromUrl(): "imported" | "rejected" | "none" {
  const match = /(?:^#|&)shopkey=([^&]+)/.exec(window.location.hash);
  if (!match) return "none";
  const secret = decodeURIComponent(match[1]);
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  if (!shopKeypair(secret)) return "rejected";
  write(SHOP_KEY, secret);
  return "imported";
}

/* Browser only: call from an effect, never during render. */
export function loadDemoWallets(freshBuyer = false): DemoWallets {
  let buyerSecret = freshBuyer ? null : read(BUYER_KEY);
  if (!buyerSecret || !StrKey.isValidEd25519SecretSeed(buyerSecret)) {
    buyerSecret = Keypair.random().secret();
    write(BUYER_KEY, buyerSecret);
  }
  const buyer = Keypair.fromSecret(buyerSecret);
  const shop = shopKeypair(read(SHOP_KEY));
  const arbiter = Keypair.fromSecret(DEMO_ARBITER_SECRET);
  return {
    buyer: buyer.publicKey(),
    seller: STELLAR_SHOP_ADDRESS,
    isShop: shop !== null,
    arbiter: arbiter.publicKey(),
    escrow: createStellarEscrow(shop ? [buyer, shop, arbiter] : [buyer, arbiter]),
  };
}

/* The faucet answers 400 for an account it already funded, which is fine. */
export async function fundFromFaucet(address: string): Promise<void> {
  const res = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`);
  if (!res.ok && res.status !== 400) {
    throw new Error(`Testnet faucet failed (${res.status}). Try again in a moment.`);
  }
}
