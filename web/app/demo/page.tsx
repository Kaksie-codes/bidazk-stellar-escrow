import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../site-header";
import EscrowDemo from "./escrow-demo";
import styles from "./demo.module.css";
import { ESCROW_CONTRACT_ID, EXPLORER_URL } from "@/lib/escrow/config";

export const metadata: Metadata = {
  title: "Live escrow demo | Bidazk",
  description:
    "Lock a payment, deliver, confirm, dispute. Bidazk escrow running live on the Stellar testnet.",
};

export default function DemoPage() {
  return (
    <>
      <SiteHeader current="demo" />
      <main className={`${styles.inner} ${styles.main}`}>
        <section className={styles.intro}>
          <span className={styles.tag}>
            <span className={styles.liveDot} /> Live on Stellar testnet
          </span>
          <h1 className={styles.h1}>
            Pay first without <em>trusting</em> first.
          </h1>
          <p className={styles.lede}>
            Grab a friend. One of you opens <strong>I&apos;m selling</strong> and
            shows their shop code; the other scans it and pays for a gadget.
            The money waits in a smart contract, not with the shop, until the
            item arrives. Every button is a real transaction on the public
            ledger.{" "}
            <Link className={styles.inlineLink} href="/how-it-works">
              How the rules work
            </Link>
          </p>
          <p className={styles.contractLine}>
            Contract{" "}
            <a
              className={styles.mono}
              href={`${EXPLORER_URL}/contract/${ESCROW_CONTRACT_ID}`}
              target="_blank"
              rel="noreferrer"
            >
              {ESCROW_CONTRACT_ID.slice(0, 6)}…{ESCROW_CONTRACT_ID.slice(-6)}
            </a>
          </p>
        </section>
        <EscrowDemo />
      </main>
    </>
  );
}
