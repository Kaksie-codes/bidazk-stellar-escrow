import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../site-header";
import styles from "./how.module.css";

export const metadata: Metadata = {
  title: "How Bidazk escrow works | Bidazk",
  description:
    "Buyers ask, shops bid, escrow holds the money. Neither side has to trust the other, or us.",
};

const flow = [
  {
    n: "01",
    title: "Buyer posts what they want",
    body: "“iPhone 13, 128GB, clean, under ₦520,000, delivered in Uyo within 3 days.” No browsing, no haggling in DMs.",
  },
  {
    n: "02",
    title: "Shops bid to supply it",
    body: "Nearby merchants, or their automated agents, compete on price, delivery time and rating. Bidding costs them nothing.",
  },
  {
    n: "03",
    title: "Buyer accepts a bid and pays into escrow",
    body: "The money leaves the buyer's wallet but does not reach the seller. A smart contract holds it, visible on a public ledger.",
  },
  {
    n: "04",
    title: "Delivery, then release",
    body: "The seller delivers and marks it. The buyer inspects. Confirm, and the seller is paid instantly. The clock covers anyone who goes quiet.",
  },
];

const protections = [
  {
    who: "Seller never delivers",
    what: "After the delivery deadline, the buyer gets a full refund. Anyone can trigger it, so it never depends on the seller cooperating.",
    side: "Buyer protected",
  },
  {
    who: "Seller runs out of stock",
    what: "The seller cancels and the buyer is refunded on the spot. No waiting, no support ticket.",
    side: "Buyer protected",
  },
  {
    who: "Wrong or damaged item",
    what: "The buyer disputes during inspection. The money freezes until the Bidazk referee splits it fairly, say 70% back for a cracked screen.",
    side: "Buyer protected",
  },
  {
    who: "Buyer receives it and goes silent",
    what: "When the inspection window closes with no dispute, the seller is paid automatically. A silent buyer cannot hold a seller's money hostage.",
    side: "Seller protected",
  },
  {
    who: "Buyer cancels while the rider is on the way",
    what: "Not possible. Before the deadline, only the seller can trigger a refund, so a delivery in progress is never pulled out from under them.",
    side: "Seller protected",
  },
  {
    who: "Buyer says “never delivered” after delivery",
    what: "Once the seller marks delivery, the refund path closes. The only route left is a dispute, which a human referee judges.",
    side: "Seller protected",
  },
];

const states = [
  { name: "Payment held", note: "Buyer paid. Seller must deliver before the deadline." },
  { name: "Buyer inspecting", note: "Seller marked delivery. Buyer confirms, disputes, or stays silent." },
  { name: "Disputed", note: "Money frozen. Only the referee can settle it." },
  { name: "Settled", note: "Seller paid, buyer refunded, or split. Final. Nothing can reopen it." },
];

const guarantees = [
  "Money can only ever go to that deal's buyer or that deal's seller. There is no function that sends it anywhere else.",
  "Every deal pays out exactly once. A settled deal rejects every action, so double payments are impossible.",
  "Money can never be stuck forever. Whichever side goes silent, the clock settles the deal.",
  "Only the buyer can confirm. Only the seller can mark delivery or cancel. Signatures are checked on the ledger, not in our app.",
  "The referee can only touch disputed deals, and can only split between that buyer and that seller. Even a stolen referee key cannot pay itself.",
  "Bidazk cannot withdraw, freeze or redirect escrowed money. The rules are code on a public ledger, and the contract cannot be quietly upgraded.",
];

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader current="how" />
      <main>
        <section className={`${styles.inner} ${styles.hero}`}>
          <span className={styles.tag}>How Bidazk works</span>
          <h1 className={styles.h1}>
            Buyers fear paying first. Sellers fear delivering first.{" "}
            <em>Escrow ends the standoff.</em>
          </h1>
          <p className={styles.lede}>
            Bidazk is a reverse marketplace: buyers say what they want and shops
            bid to supply it. When a bid is accepted, the payment goes into an
            escrow contract on Stellar. The seller knows the money is real. The
            buyer knows it only moves when the item arrives.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.btnPrimary} href="/demo">
              Try the live escrow
            </Link>
            <a className={styles.btnGhost} href="#rules">
              See the rules
            </a>
          </div>
        </section>

        <section className={`${styles.inner} ${styles.section}`}>
          <h2 className={styles.h2}>From request to paid, in four steps</h2>
          <ol className={styles.flow}>
            {flow.map((f) => (
              <li key={f.n} className={styles.flowItem}>
                <span className={styles.flowN}>{f.n}</span>
                <h3 className={styles.h3}>{f.title}</h3>
                <p className={styles.body}>{f.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.band}>
          <div className={`${styles.inner} ${styles.section}`}>
            <h2 className={styles.h2}>The life of one payment</h2>
            <p className={`${styles.body} ${styles.sectionLede}`}>
              Every deal is in exactly one of these states. Each arrow is a
              rule the contract enforces, not a promise we make.
            </p>
            <ol className={styles.states}>
              {states.map((s, i) => (
                <li key={s.name} className={styles.stateItem}>
                  <span className={styles.stateIndex}>{i + 1}</span>
                  <strong>{s.name}</strong>
                  <span>{s.note}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="rules" className={`${styles.inner} ${styles.section}`}>
          <h2 className={styles.h2}>What happens when something goes wrong</h2>
          <p className={`${styles.body} ${styles.sectionLede}`}>
            Escrow is only as good as its edge cases. These are the ones that
            break trust in Nigerian online trade, and how each one ends.
          </p>
          <div className={styles.cases}>
            {protections.map((p) => (
              <article key={p.who} className={styles.case}>
                <span
                  className={`${styles.side} ${p.side.startsWith("Buyer") ? styles.sideBuyer : styles.sideSeller}`}
                >
                  {p.side}
                </span>
                <h3 className={styles.h3}>{p.who}</h3>
                <p className={styles.body}>{p.what}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.inverse}>
          <div className={`${styles.inner} ${styles.section}`}>
            <h2 className={styles.h2}>Why it runs on Stellar, not in our database</h2>
            <p className={`${styles.bodyInverse} ${styles.sectionLede}`}>
              If Bidazk held the money in a company account, you would have to
              trust Bidazk. On Stellar, you only have to trust the rules, and
              anyone can read them.
            </p>
            <ul className={styles.guarantees}>
              {guarantees.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className={`${styles.inner} ${styles.section}`}>
          <h2 className={styles.h2}>Built today, and next</h2>
          <div className={styles.roadmap}>
            <div className={styles.road}>
              <span className={styles.roadTag}>Live on testnet</span>
              <ul>
                <li>Escrow contract: hold, deliver, confirm, dispute, refund, cancel, referee split</li>
                <li>Automatic release and refund on timers</li>
                <li>34 automated tests covering every rule above</li>
                <li>This website and the live demo</li>
              </ul>
            </div>
            <div className={styles.road}>
              <span className={styles.roadTag}>Next</span>
              <ul>
                <li>Settlement in naira through NGNC, a naira token on Stellar, with USDC for diaspora buyers</li>
                <li>Delivery PIN: the rider collects a code at handover as proof of delivery</li>
                <li>Buyer requests and seller bids feeding straight into escrow</li>
                <li>Wallet sign-in so people use their own keys</li>
              </ul>
            </div>
          </div>
        </section>

        <section className={`${styles.inner} ${styles.closer}`}>
          <h2 className={styles.h2}>See it hold real money</h2>
          <p className={styles.body}>
            Lock a payment, deliver, dispute, try to cheat. Every step is a
            transaction you can check on the public ledger.
          </p>
          <Link className={styles.btnPrimary} href="/demo">
            Open the live demo
          </Link>
        </section>
      </main>
    </>
  );
}
