import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../site-header";
import styles from "./pitch.module.css";

export const metadata: Metadata = {
  title: "Pitch | Bidazk",
  description:
    "Bidazk is a reverse marketplace for physical goods with free merchant tools and escrow on Stellar. Buyers ask, shops bid, escrow holds the money.",
};

/* Long-form pitch: what Bidazk is, why it matters, and how naira settles
   over Stellar escrow. Every on-chain claim here is enforced by the contract
   in ../contract and can be checked in the live demo. */

const NGNC_LEDGER =
  "https://stellar.expert/explorer/public/asset/NGNC-GASBV6W7GGED66MXEVC7YZHTWWYMSVYEY35USF2HJZBLABLYIFQGXZY6";
const NGNC_TOML = "https://ngnc.online/.well-known/stellar.toml";
const NGNC_SITE = "https://www.linkio.world/ngnc";

const layers = [
  {
    tag: "Free",
    title: "Merchant tools",
    body: "Stock list, receipts, a till that works offline, a free shop website, a customer list. Free permanently.",
    why: "Brings merchants in, and turns their stock into data we can match against.",
  },
  {
    tag: "Transactions",
    title: "Reverse marketplace",
    body: "Buyers post what they want, shops bid to supply it, escrow holds the money until it arrives.",
    why: "The engine: where buyers and shops actually trade, with the money held in escrow.",
  },
  {
    tag: "Data",
    title: "Market intelligence",
    body: "Anonymous, aggregated data on what people asked for, at what price, where, and whether anyone had it.",
    why: "Manufacturers and wholesalers have no view of unmet demand. We do.",
  },
];

const problems = [
  {
    who: "Buyers",
    points: [
      "Finding one specific phone means messaging ten vendors and comparing prices that change with who is asking.",
      "Paying first is a gamble. Wrong item, fake, or nothing at all.",
      "Nobody competes for you. You go to the shop; the shop never comes to you.",
    ],
  },
  {
    who: "Merchants",
    points: [
      "Their stock is invisible. A buyer two streets away will never know they have it.",
      "They miss sales while closed. A buyer asks at 11 pm and has bought elsewhere by 9 am.",
      "Delivering first is also a gamble: fake transfer alerts, buyers who vanish after delivery.",
      "Inventory apps, POS terminals and website builders are monthly bills a small shop cannot justify.",
    ],
  },
  {
    who: "Manufacturers",
    points: [
      "They know what sold. They do not know what people asked for and could not find, which is exactly what tells them what to make next.",
    ],
  },
];

const unique = [
  {
    title: "Demand-first in a market built supply-first",
    body: "Every competitor makes the buyer search. Bidazk makes shops compete for the buyer, so the buyer sees the real market price, not the “how much can you pay” price.",
  },
  {
    title: "Free tools build a stock map nobody can buy",
    body: "Small shops publish their stock nowhere. Bidazk gets it by giving away the tools they use every day. Every sale on the till updates a live, location-tagged map of what is in stock, where. That map is the moat.",
  },
  {
    title: "The shop does not need to be online",
    body: "A Sales Agent bids on matching requests inside the merchant's floor price, at 2 am with the shop locked, and records why it bid. Other marketplaces only sell while the merchant is on their phone.",
  },
  {
    title: "Escrow on every order",
    body: "Trust is the default, not an add-on. Paid into escrow, released on confirmation, refunded if the shop does not deliver, referred to a referee if they disagree.",
  },
  {
    title: "Unmet demand is a dataset nobody else has",
    body: "“31 people near Ajah asked for a 3.5KVA generator last week; 4 shops had one.” Shared only anonymised and aggregated, never traceable to a person, with the people who decide what to stock.",
  },
  {
    title: "Built for how Nigeria trades",
    body: "The till works offline through network cuts. Matching stays inside the buyer's radius. In-person handover is supported. The shop website goes straight into a WhatsApp status.",
  },
];

const compare = [
  { name: "Listing marketplaces", ex: "Jumia, Jiji", has: "Buyers", lacks: "No reason for shops to keep stock accurate; you still search" },
  { name: "Merchant tools", ex: "Bumpa and similar", has: "Software for shops", lacks: "No buyers come with it" },
  { name: "Social commerce", ex: "Instagram, WhatsApp vendors", has: "Reach", lacks: "No trust, no escrow, no price competition" },
  { name: "Bidazk", ex: "", has: "The tool a shop needs to run is the same thing that brings it buyers", lacks: "", us: true },
];

const scale = [
  {
    title: "Software, not logistics",
    body: "Bidazk never owns vans or warehouses. Each new user costs almost nothing to serve.",
  },
  {
    title: "The agent removes the human bottleneck",
    body: "A merchant can answer hundreds of requests a day without typing a reply.",
  },
  {
    title: "City by city",
    body: "Matching is local, so each city is its own network. Win one, copy the playbook to the next.",
  },
];

const holders = [
  {
    who: "Bidazk's bank account",
    how: "We hold everyone's money",
    catch: "Everyone must trust Bidazk, we need a Central Bank licence to hold it, and nobody can see what happens to it.",
  },
  {
    who: "A payment company's escrow",
    how: "Held funds on a private ledger",
    catch: "Rules live in a private database and can change. A dispute is a support ticket.",
  },
  {
    who: "A Stellar smart contract",
    how: "The money sits in public code nobody controls",
    catch: "No catch on custody. The limits are below, said plainly.",
    us: true,
  },
];

const rules = [
  "The money can only go to that deal's buyer or that deal's seller. Not even Bidazk can take it.",
  "If the shop misses the delivery deadline, the buyer is refunded without asking anyone.",
  "If the buyer receives the item and goes silent, the shop is paid when the inspection window closes.",
  "The referee can only split a disputed payment between those two people, never send it elsewhere.",
  "Every payment is on a public ledger. Anyone can check it.",
];

const flow = [
  { who: "Buyer", text: "Pays ₦520,000 by bank transfer or card, inside the Bidazk app." },
  { who: "Anchor (licensed)", text: "Receives the naira and issues 520,000 NGNC, a naira token, on Stellar." },
  { who: "Escrow contract", text: "Holds the 520,000 NGNC under public rules nobody can bend." },
  { who: "On delivery", text: "Buyer confirms, and the NGNC goes to the shop. Missed deadline: back to the buyer. Dispute: the referee splits it." },
  { who: "Anchor (licensed)", text: "Takes the NGNC back and pays ₦520,000 into the shop's bank account." },
];

const versus = [
  { what: "Who can move the money", bank: "Whoever controls the account", stellar: "Only the contract's rules" },
  { what: "Can the rules change quietly", bank: "Yes", stellar: "No. Public code, no upgrade switch" },
  { what: "Can a user check the money is there", bank: "They trust a statement", stellar: "They look it up on the public ledger" },
  { what: "Refund or release on a deadline", bank: "A person or a scheduled job", stellar: "Built into the contract" },
  { what: "Cost per transaction", bank: "Bank and gateway fees", stellar: "A fraction of a kobo in network fees" },
  { what: "Settlement time", bank: "Minutes to days", stellar: "About 5 seconds" },
];

const beyond = [
  {
    title: "Diaspora buyers",
    body: "Someone in London buys a generator for their mother in Uyo, paying in dollar stablecoin (USDC). Stellar converts it to naira tokens in the same transaction, and the shop in Uyo is paid in naira.",
  },
  {
    title: "Dollar protection, if a shop wants it",
    body: "A merchant worried about inflation can choose to be paid in USDC instead. Same contract, different token.",
  },
  {
    title: "A sales record nobody can fake",
    body: "A merchant's completed escrow payments are public and verifiable: a track record a market trader cannot otherwise show.",
  },
];

const limits = [
  {
    title: "Regulation still applies",
    body: "Holding money for others is regulated in Nigeria. Stellar does not remove that; it changes the licensed partner's job from holding the money to converting naira in and out, while the contract holds it.",
  },
  {
    title: "Wallets must be invisible",
    body: "Shoppers will not manage keys. Production uses wallets created and secured behind an email login. The demo uses throwaway testnet wallets so anyone can try it in ten seconds.",
  },
  {
    title: "Delivery has to be proven",
    body: "A contract cannot see a phone change hands. An inspection window, disputes and a referee cover it today; courier proof of delivery and a handover PIN are next.",
  },
];

const status = [
  { what: "Full platform design: five services, data model, money rules, security, roadmap", state: "Written" },
  { what: "Marketing site", state: "Live" },
  { what: "Escrow smart contract on Stellar, 34 automated tests covering every rule", state: "Live on testnet", live: true },
  { what: "Two-phone escrow demo", state: "Live", live: true },
  { what: "Marketplace, merchant tools, Sales Agent, mobile app", state: "Designed, next to build" },
];

const faqs = [
  {
    q: "Why not just use Paystack or a bank for escrow?",
    a: "Then everyone has to trust Bidazk with their money, and the rules live in a private database. On Stellar the money sits in public code that not even Bidazk can take from, and anyone can verify it.",
  },
  {
    q: "Is naira really on Stellar?",
    a: "Yes. NGNC, a naira token pegged 1:1 and issued by LINK.IO, is on Stellar's main network with thousands of holders. The ledger entry and the issuer's own configuration are linked above, so you can check it yourself.",
  },
  {
    q: "So you are converting naira to crypto?",
    a: "No. Naira is represented on Stellar one-for-one, the way a bank balance represents naira. Value stays in naira from the buyer's card to the shop's bank account. Stellar is the rail and the rulebook.",
  },
  {
    q: "Do users need a crypto wallet or XLM?",
    a: "No. Wallets are created behind a normal login, and Bidazk pays the tiny network fee on the user's behalf. Users only ever see naira.",
  },
  {
    q: "What if the naira moves while money is in escrow?",
    a: "It is held as a naira token pegged 1:1, so ₦520,000 in is ₦520,000 out. A merchant who wants dollar protection can choose USDC instead.",
  },
  {
    q: "What stops a buyer lying that it never arrived?",
    a: "Once the shop marks it delivered, the refund path closes. The buyer can only dispute, inside a time limit, and a referee decides. Courier proof of delivery and a handover PIN come next.",
  },
  {
    q: "What stops the referee taking the money?",
    a: "The contract only lets the referee split a payment between that buyer and that seller. Even a stolen referee key cannot pay itself. You can try it in the demo.",
  },
  {
    q: "How is this different from Jiji or Jumia?",
    a: "They make you search. Bidazk makes shops compete for you, and holds the money until the item arrives.",
  },
  {
    q: "Why would merchants join before there are buyers?",
    a: "Because the tools are free and useful on day one: stock, till, receipts, a shop website. The marketplace is what they get on top.",
  },
];

export default function PitchPage() {
  return (
    <>
      <SiteHeader current="pitch" />
      <main>
        {/* Hero */}
        <section className={`${styles.inner} ${styles.hero}`}>
          <span className={styles.tag}>The Bidazk pitch</span>
          <h1 className={styles.h1}>
            Buyers ask. Shops bid. <em>Escrow holds the money.</em>
          </h1>
          <p className={styles.lede}>
            Bidazk is a reverse marketplace for physical goods. Buyers say what
            they want, nearby shops bid to supply it, and the payment waits in
            escrow on Stellar until the item arrives. Merchants get free
            software that runs their shop, and that software is what lets them
            sell while they sleep.
          </p>
          <nav className={styles.toc} aria-label="On this page">
            <a href="#what">What it is</a>
            <a href="#problem">The problem</a>
            <a href="#how">How it works</a>
            <a href="#unique">Why it is unique</a>
            <a href="#scale">Why it scales</a>
            <a href="#stellar">Where Stellar comes in</a>
            <a href="#naira">The naira question</a>
            <a href="#status">What is built</a>
          </nav>
        </section>

        {/* What it is */}
        <section id="what" className={`${styles.inner} ${styles.section}`}>
          <span className={styles.kicker}>01 · What Bidazk is</span>
          <h2 className={styles.h2}>A marketplace turned the other way round</h2>
          <div className={styles.split}>
            <div>
              <p className={styles.body}>
                Every marketplace you know is supply-first. Shops list what
                they have and you go searching: Jumia, Jiji, Instagram vendors,
                Computer Village. You do the walking, the scrolling and the
                haggling.
              </p>
              <p className={styles.body}>
                Bidazk is demand-first. You post a <strong>Wanted Post</strong>,
                and it goes to every shop whose stock matches and who can reach
                you. They send offers with price, delivery time, distance and
                rating. You pick one. You never scroll past things you did not
                ask for.
              </p>
            </div>
            <figure className={styles.wanted}>
              <span className={styles.wantedLabel}>Wanted</span>
              <blockquote>
                iPhone 13, 128GB, battery above 85%, under ₦520,000, delivered
                in Uyo within 3 days.
              </blockquote>
              <ul className={styles.offers}>
                <li>
                  <span>Shop A · 2.1 km · 4.8★</span>
                  <strong className={styles.money}>₦498,000</strong>
                </li>
                <li>
                  <span>Shop B · 5.4 km · 4.6★</span>
                  <strong className={styles.money}>₦505,000</strong>
                </li>
                <li>
                  <span>Shop C · 8.0 km · 4.9★</span>
                  <strong className={styles.money}>₦512,000</strong>
                </li>
              </ul>
            </figure>
          </div>

          <h3 className={`${styles.h3} ${styles.subhead}`}>Three businesses that feed each other</h3>
          <div className={styles.grid3}>
            {layers.map((l) => (
              <article key={l.title} className={styles.card}>
                <span className={styles.pill}>{l.tag}</span>
                <h3 className={styles.h3}>{l.title}</h3>
                <p className={styles.body}>{l.body}</p>
                <p className={styles.why}>{l.why}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Problem */}
        <section id="problem" className={styles.band}>
          <div className={`${styles.inner} ${styles.section}`}>
            <span className={styles.kicker}>02 · The problem</span>
            <h2 className={styles.h2}>Nobody trusts anybody, and nobody can see demand</h2>
            <div className={styles.grid3}>
              {problems.map((p) => (
                <article key={p.who} className={styles.card}>
                  <h3 className={styles.h3}>{p.who}</h3>
                  <ul className={styles.list}>
                    {p.points.map((pt) => (
                      <li key={pt}>{pt}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <p className={styles.callout}>
              Buyers do not trust sellers with money first. Sellers do not trust
              buyers to pay after. And nobody can see demand until it has
              already gone somewhere else.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className={`${styles.inner} ${styles.section}`}>
          <span className={styles.kicker}>03 · How it works</span>
          <h2 className={styles.h2}>Two sides, one escrow</h2>
          <div className={styles.grid2}>
            <article className={styles.card}>
              <h3 className={styles.h3}>The buyer</h3>
              <ol className={styles.steps}>
                <li>Posts what they want, a budget, a location and a radius.</li>
                <li>Receives offers from shops that have it and can reach them.</li>
                <li>Compares price, distance, delivery time and rating, and accepts one.</li>
                <li>Pays into escrow. The money leaves the buyer but does not reach the shop.</li>
                <li>Inspects the item and confirms, and the shop is paid. If it is wrong, they dispute and a referee decides.</li>
              </ol>
            </article>
            <article className={styles.card}>
              <h3 className={styles.h3}>The merchant</h3>
              <ol className={styles.steps}>
                <li>Runs the shop on the free tools: stock list, till, receipts, website.</li>
                <li>Because stock is already recorded, matching requests arrive by themselves.</li>
                <li>Sets a floor price once: “never sell this below ₦480,000.”</li>
                <li>Turns on the Sales Agent, which bids on matching requests automatically, inside that floor.</li>
                <li>Delivers and gets paid from escrow. No chasing, no fake alerts.</li>
              </ol>
            </article>
          </div>
          <div className={styles.agent}>
            <span className={styles.agentTag}>The Sales Agent</span>
            <p>
              The seller bids and the buyer accepts. The agent works on the
              seller&apos;s side: it places bids and answers counter-offers{" "}
              <strong>automatically, with no approval from the merchant</strong>,
              so a request at 2 am gets a bid at 2 am. The platform checks every
              bid in milliseconds: above the floor, and actually in stock. The
              agent can never go below the floor, accept for the buyer, or move
              money, and every bid records why it was made.
            </p>
          </div>
        </section>

        {/* Unique */}
        <section id="unique" className={styles.band}>
          <div className={`${styles.inner} ${styles.section}`}>
            <span className={styles.kicker}>04 · Why it is unique</span>
            <h2 className={styles.h2}>The tool a shop needs is the thing that brings it buyers</h2>
            <div className={styles.grid3}>
              {unique.map((u) => (
                <article key={u.title} className={styles.card}>
                  <h3 className={styles.h3}>{u.title}</h3>
                  <p className={styles.body}>{u.body}</p>
                </article>
              ))}
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Has</th>
                    <th>Missing</th>
                  </tr>
                </thead>
                <tbody>
                  {compare.map((c) => (
                    <tr key={c.name} className={c.us ? styles.rowUs : undefined}>
                      <td>
                        <strong>{c.name}</strong>
                        {c.ex && <span className={styles.ex}>{c.ex}</span>}
                      </td>
                      <td>{c.has}</td>
                      <td>{c.lacks || "Nothing on this list"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Scale */}
        <section id="scale" className={`${styles.inner} ${styles.section}`}>
          <span className={styles.kicker}>05 · Why it scales</span>
          <h2 className={styles.h2}>Every turn of the wheel makes the next one cheaper</h2>
          <ol className={styles.flywheel} aria-label="The Bidazk flywheel">
            <li><span className={styles.flyItem}>Free tools</span></li>
            <li><span className={styles.flyItem}>More merchants</span></li>
            <li><span className={styles.flyItem}>More stock on the map</span></li>
            <li><span className={styles.flyItem}>More requests filled</span></li>
            <li><span className={styles.flyItem}>More buyers</span></li>
            <li><span className={styles.flyItem}>More demand data</span></li>
          </ol>
          <p className={`${styles.body} ${styles.center}`}>
            …which makes the free tools and the agent more valuable to the next
            merchant, and the wheel turns again.
          </p>
          <div className={styles.grid3}>
            {scale.map((s) => (
              <article key={s.title} className={styles.card}>
                <h3 className={styles.h3}>{s.title}</h3>
                <p className={styles.body}>{s.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Stellar */}
        <section id="stellar" className={styles.inverse}>
          <div className={`${styles.inner} ${styles.section}`}>
            <span className={styles.kickerInverse}>06 · Where Stellar comes in</span>
            <h2 className={styles.h2}>Escrow forces one question: who holds the money?</h2>
            <div className={styles.grid3}>
              {holders.map((h) => (
                <article key={h.who} className={h.us ? styles.cardInverseUs : styles.cardInverse}>
                  <h3 className={styles.h3}>{h.who}</h3>
                  <p className={styles.howInverse}>{h.how}</p>
                  <p className={styles.bodyInverse}>{h.catch}</p>
                </article>
              ))}
            </div>
            <h3 className={`${styles.h3} ${styles.subhead}`}>On Stellar, the rules are a public program</h3>
            <ul className={styles.ticks}>
              {rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <Link className={styles.btnOnInverse} href="/demo">
              Watch it hold money in the live demo
            </Link>
          </div>
        </section>

        {/* Naira */}
        <section id="naira" className={`${styles.inner} ${styles.section}`}>
          <span className={styles.kicker}>07 · The naira question</span>
          <h2 className={styles.h2}>
            “People pay in naira. So where does Stellar come in?”
          </h2>
          <p className={`${styles.lede} ${styles.answer}`}>
            Users pay in naira and get paid in naira. <strong>Stellar is the
            rail the naira travels on, not the currency they see.</strong> Like
            Visa behind a naira debit card: you pay in naira, the payment
            travels over a network you never think about.
          </p>

          <div className={styles.split}>
            <div>
              <h3 className={styles.h3}>The bridge is called an anchor</h3>
              <p className={styles.body}>
                An anchor is a licensed company that takes in naira and issues
                the same amount as a naira token on Stellar, and does the
                reverse on the way out. Stellar defines one standard way for
                apps to talk to every anchor, so Bidazk integrates once.
              </p>
              <h3 className={`${styles.h3} ${styles.subheadSm}`}>Naira, not crypto</h3>
              <ul className={styles.list}>
                <li>
                  <strong>We are not converting naira into XLM.</strong> Naira
                  is represented on Stellar one-for-one, the way a bank balance
                  represents naira. The value is naira the whole time.
                </li>
                <li>
                  <strong>Naira stays legal tender.</strong> Nobody is asked to
                  price, pay or be paid in another currency.
                </li>
                <li>
                  <strong>Users never touch XLM.</strong> XLM only pays the
                  network fee, a fraction of a kobo, and Bidazk pays it on the
                  user&apos;s behalf.
                </li>
                <li>
                  <strong>No exchange-rate risk in escrow.</strong> The token is
                  pegged 1:1, so ₦520,000 in is ₦520,000 out.
                </li>
              </ul>
            </div>
            <ol className={styles.flow} aria-label="How a naira payment moves through Stellar escrow">
              {flow.map((f, i) => (
                <li key={i}>
                  <span className={styles.flowWho}>{f.who}</span>
                  <span>{f.text}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className={styles.proof}>
            <span className={styles.proofTag}>Check it yourself</span>
            <h3 className={styles.h3}>Naira is already on Stellar</h3>
            <p className={styles.body}>
              NGNC is a naira token pegged 1:1, issued by LINK.IO and run as a
              Stellar anchor on the standard deposit and withdrawal protocol.
              Thousands of accounts hold it on Stellar&apos;s main network today.
              The issuer&apos;s configuration file, which only the real issuer
              can publish, describes it as an “asset backed token pegged 1:1 to
              Nigerian Naira”.
            </p>
            <ul className={styles.proofLinks}>
              <li>
                <a href={NGNC_LEDGER} target="_blank" rel="noreferrer">
                  NGNC on the public Stellar ledger ↗
                </a>
              </li>
              <li>
                <a href={NGNC_TOML} target="_blank" rel="noreferrer">
                  The issuer&apos;s Stellar configuration file ↗
                </a>
              </li>
              <li>
                <a href={NGNC_SITE} target="_blank" rel="noreferrer">
                  LINK.IO&apos;s NGNC page ↗
                </a>
              </li>
            </ul>
          </div>

          <h3 className={`${styles.h3} ${styles.subhead}`}>Bank-account escrow against Stellar escrow</h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th></th>
                  <th>Bank account</th>
                  <th>Stellar contract</th>
                </tr>
              </thead>
              <tbody>
                {versus.map((v) => (
                  <tr key={v.what}>
                    <td>
                      <strong>{v.what}</strong>
                    </td>
                    <td>{v.bank}</td>
                    <td className={styles.good}>{v.stellar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className={`${styles.h3} ${styles.subhead}`}>What Stellar unlocks beyond escrow</h3>
          <div className={styles.grid3}>
            {beyond.map((b) => (
              <article key={b.title} className={styles.card}>
                <h3 className={styles.h3}>{b.title}</h3>
                <p className={styles.body}>{b.body}</p>
              </article>
            ))}
          </div>

          <h3 className={`${styles.h3} ${styles.subhead}`}>The honest limits</h3>
          <div className={styles.grid3}>
            {limits.map((l) => (
              <article key={l.title} className={`${styles.card} ${styles.cardLimit}`}>
                <h3 className={styles.h3}>{l.title}</h3>
                <p className={styles.body}>{l.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Status */}
        <section id="status" className={styles.band}>
          <div className={`${styles.inner} ${styles.section}`}>
            <span className={styles.kicker}>08 · Where we are</span>
            <h2 className={styles.h2}>What is built, and what is next</h2>
            <ul className={styles.status}>
              {status.map((s) => (
                <li key={s.what}>
                  <span>{s.what}</span>
                  <span className={s.live ? styles.stateLive : styles.state}>{s.state}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className={`${styles.inner} ${styles.section}`}>
          <span className={styles.kicker}>Questions</span>
          <h2 className={styles.h2}>What people usually ask</h2>
          <div className={styles.faqs}>
            {faqs.map((f) => (
              <details key={f.q} className={styles.faq}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={`${styles.inner} ${styles.closer}`}>
          <h2 className={styles.h2}>Pay first without trusting first.</h2>
          <p className={styles.body}>
            Grab a friend and two phones. One sells, one buys, and the money
            waits in a contract nobody controls.
          </p>
          <div className={styles.closerRow}>
            <Link className={styles.btnPrimary} href="/demo">
              Open the live demo
            </Link>
            <Link className={styles.btnGhost} href="/how-it-works">
              How the escrow rules work
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
