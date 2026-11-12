import Link from "next/link";
import styles from "./page.module.css";
import HeroSwitch from "./hero-switch";
import {
  Intro,
  Reveal,
  Stagger,
  StaggerItem,
  StaggerCard,
  SlideInRow,
} from "./motion";

/* PLACEHOLDER CONTENT.
   Copy is written to be plausible, not final. Testimonials are illustrative
   and must be replaced with real, permissioned quotes before this page is
   published. */

const ticker = [
  { what: "Nike Air Force 1, size 43, white", price: "₦85,000", where: "Yaba · 4 bids" },
  { what: "HP EliteBook 840 G8, 16GB", price: "₦480,000", where: "Ikeja · 7 bids" },
  { what: "12.5kg gas cylinder, refilled", price: "₦52,000", where: "Surulere · 2 bids" },
  { what: "Ankara wax print, 12 yards", price: "₦28,000", where: "Balogun · 11 bids" },
  { what: "iPhone 13 Pro, 256GB, clean", price: "₦640,000", where: "Lekki · 9 bids" },
  { what: "Rechargeable standing fan", price: "₦45,000", where: "Ojota · 3 bids" },
  { what: "Baby cot with mattress", price: "₦95,000", where: "Ikorodu · 5 bids" },
  { what: "Generator 3.5KVA, fairly used", price: "₦310,000", where: "Ajah · 6 bids" },
];

const requests = [
  { cat: "Footwear", title: "Nike Air Force 1, size 43, white. Deadstock preferred", budget: "₦85,000", bids: 4, area: "Yaba", left: "6h left", agent: true },
  { cat: "Computing", title: "HP EliteBook 840 G8, 16GB RAM, 512 SSD", budget: "₦480,000", bids: 7, area: "Ikeja", left: "2d left", agent: true },
  { cat: "Home", title: "12.5kg gas cylinder, refilled, delivered today", budget: "₦52,000", bids: 2, area: "Surulere", left: "3h left", agent: false },
  { cat: "Fabric", title: "Ankara wax print, 12 yards, Hollandais", budget: "₦28,000", bids: 11, area: "Balogun", left: "1d left", agent: true },
  { cat: "Phones", title: "iPhone 13 Pro, 256GB, battery above 90%", budget: "₦640,000", bids: 9, area: "Lekki", left: "5h left", agent: true },
  { cat: "Appliances", title: "Rechargeable standing fan, 18 inch", budget: "₦45,000", bids: 3, area: "Ojota", left: "1d left", agent: false },
  { cat: "Baby", title: "Baby cot with mattress, wooden frame", budget: "₦95,000", bids: 5, area: "Ikorodu", left: "4h left", agent: false },
  { cat: "Power", title: "Generator 3.5KVA, fairly used, tested", budget: "₦310,000", bids: 6, area: "Ajah", left: "12h left", agent: true },
];

const bids = [
  { merchant: "Kunle Sports", initials: "KS", meta: "3.1 km · Yaba · 4.8★", price: "₦82,000", chip: styles.chipAgent, label: "Your agent", why: "Cost ₦65,000, your 20% floor respected. Two rivals at ₦84k to ₦86k, so it anchored at ₦82,000.", agent: true },
  { merchant: "Ade Kicks", initials: "AK", meta: "5.4 km · Surulere · 4.6★", price: "₦84,500", chip: styles.chipNew, label: "New bid", why: "Deadstock, receipt included. Delivery same day.", agent: false },
  { merchant: "Bimbo Stores", initials: "BS", meta: "8.2 km · Ikeja · 4.9★", price: "₦86,000", chip: styles.chipCounter, label: "Countered", why: "Countered your ₦80,000 offer.", agent: false },
  { merchant: "Tunde & Sons", initials: "TS", meta: "11.7 km · Ojota · 4.4★", price: "₦91,000", chip: styles.chipOutbid, label: "Outbid", why: "", agent: false },
];

const categories = ["All requests", "Phones", "Computing", "Fabric", "Appliances", "Power", "Home", "Footwear"];

const faqs = [
  { q: "Is Bidazk a marketplace like Jumia or Jiji?", a: "The other way round. There, shops list what they have and you go searching. On Bidazk you post what you want, and shops come to you with prices. You never scroll through things you did not ask for." },
  { q: "How is my money protected?", a: "Payment sits in escrow from the moment you accept a bid. The merchant is only paid after you confirm you received the item. If something goes wrong, you open a dispute and we hold the funds until it is resolved." },
  { q: "What is automated bidding, exactly?", a: "A merchant sets their minimum profit once. After that, when a request matches something in their stock, their agent places a bid inside those limits, even at 2am with the shop closed. It can never bid below the floor they set, and they can switch it off at any time." },
  { q: "Do I have to accept the cheapest bid?", a: "No. You see price, distance, delivery time and the merchant's rating, and you pick whichever suits you. Cheapest is not always closest or fastest." },
  { q: "Which areas do you cover?", a: "Lagos at launch, with more states following. Your request only goes to shops inside the radius you set, so you are never matched with someone who cannot reach you." },
];

/* Illustrated avatars, not photographs. These quotes are placeholders, and
   putting a real person's face on words they never said is not something to
   ship. Replace with real merchant photos, with permission, before launch. */
type Face = { skin: string; hair: string; cloth: string; bg: string };

function Avatar({ face }: { face: Face }) {
  return (
    <span className={styles.avatarWrap} style={{ background: face.bg }}>
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <ellipse cx="22" cy="43" rx="15.5" ry="13" fill={face.cloth} />
        <circle cx="22" cy="17" r="9.2" fill={face.skin} />
        <path
          d="M12.8 17.4c0-5.6 4.1-9.4 9.2-9.4s9.2 3.8 9.2 9.4c-1.6-3.1-4.1-4.6-9.2-4.6s-7.6 1.5-9.2 4.6z"
          fill={face.hair}
        />
      </svg>
    </span>
  );
}

const StoreIcon = () => (
  <svg className={styles.quoteLinkIcon} viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M2.5 6.5h11v6a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-6Zm0 0L4 2.5h8l1.5 4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const quotes = [
  {
    name: "Tchetty Gadgets",
    store: "tchetty-gadgets.bidazk.com",
    meta: "Electronics · Ojota",
    text: "It bid ₦82,000 at midnight while my shop was locked, and in the morning it told me exactly why. I would have slept through that sale.",
    face: { skin: "#8d5524", hair: "#2b1a10", cloth: "#14a800", bg: "#f0fbe9" },
  },
  {
    name: "Mama Ify Provisions",
    store: "mama-ify.bidazk.com",
    meta: "Provisions · Ikeja",
    text: "Network cuts here nearly every day. I keep selling anyway, and when it comes back everything is already in the app. That is the part that convinced me.",
    face: { skin: "#6b4226", hair: "#1a1008", cloth: "#106c77", bg: "#ecfafb" },
  },
  {
    name: "Kunle Sports",
    store: "kunle-sports.bidazk.com",
    meta: "Footwear · Yaba",
    text: "Before, people would message asking if I have size 43 and I would go and check. Now the request comes with the size, the colour and the budget on it. I just say yes or no.",
    face: { skin: "#a0673a", hair: "#33200f", cloth: "#b45309", bg: "#fef3c7" },
  },
  {
    name: "Adaeze Fabrics",
    store: "adaeze-fabrics.bidazk.com",
    meta: "Fabric · Balogun",
    text: "I put my store link in my WhatsApp status and customers just browse it themselves. No more sending forty pictures one by one.",
    face: { skin: "#7a4a28", hair: "#241408", cloth: "#5b2fc9", bg: "#f3eefe" },
  },
  {
    name: "Bright Power Systems",
    store: "bright-power.bidazk.com",
    meta: "Generators · Ajah",
    text: "It showed me thirty-one people near me asked for a 3.5KVA last week and only four shops had one. I stocked six the next day and they went.",
    face: { skin: "#5f3a20", hair: "#160d06", cloth: "#0c7a00", bg: "#f0fbe9" },
  },
  {
    name: "Zainab Phone Hub",
    store: "zainab-phones.bidazk.com",
    meta: "Phones · Computer Village",
    text: "The money sits in escrow, so nobody is arguing about who pays first. That alone removed the part of this job I hated.",
    face: { skin: "#8d5524", hair: "#1f1209", cloth: "#128692", bg: "#ecfafb" },
  },
  {
    name: "Little Steps Baby Store",
    store: "little-steps.bidazk.com",
    meta: "Baby · Ikorodu",
    text: "I was paying monthly for another app and barely using half of it. Here I pay nothing until something actually sells.",
    face: { skin: "#9a6238", hair: "#2b1a10", cloth: "#cc2f1c", bg: "#fef4f2" },
  },
  {
    name: "Emeka Cool Breeze",
    store: "emeka-cool-breeze.bidazk.com",
    meta: "Appliances · Surulere",
    text: "Every customer gets a receipt on WhatsApp before they leave the shop. People take you seriously when they see that.",
    face: { skin: "#6b4226", hair: "#180f07", cloth: "#0f8a00", bg: "#f0fbe9" },
  },
];

export default function Home() {
  return (
    <div className={styles.page}>
      {/* Fixed header: announce bar and nav both stay put */}
      <header className={styles.header}>
        <div className={styles.announce}>
          <div className={`${styles.inner} ${styles.announceInner}`}>
            <span className={styles.liveDot} />
            <span>
              <strong className={styles.announceStrong}>2,847</strong> requests
              open right now
            </span>
            <span className={styles.spacer} />
            <span className={styles.hideSmall}>
              Merchant tools are free. No monthly fee, no card required
            </span>
          </div>
        </div>

        <nav className={styles.nav}>
          <div className={`${styles.inner} ${styles.navInner}`}>
            <span className={styles.brand}>
              Bidazk<span className={styles.brandDot}>.</span>
            </span>
            <div className={styles.navLinks}>
              <a className={styles.navLink} href="#board">Open requests</a>
              <a className={styles.navLink} href="#agent">How bidding works</a>
              <a className={styles.navLink} href="#merchants">For merchants</a>
              <Link className={styles.navLink} href="/pitch">Pitch</Link>
              <Link className={styles.navLink} href="/how-it-works">How escrow works</Link>
              <Link className={styles.navLink} href="/demo">Live demo</Link>
            </div>
            <span className={styles.spacer} />
            <div className={styles.navActions}>
              <Link className={styles.btnPrimary} href="/demo">Try the live demo</Link>
            </div>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className={`${styles.inner} ${styles.hero}`}>
          <Intro>
            <h1 className={styles.h1}>
              Buyers ask. <em>Shops bid.</em>
            </h1>
          </Intro>
          <Intro delay={0.12}>
            <p className={`${styles.lede} ${styles.heroLede}`}>
              Post what you want and let shops near you compete on price. Sell
              on Bidazk and get free tools that keep bidding for you after you
              have closed for the day.
            </p>
          </Intro>
          <Intro delay={0.24}>
            <HeroSwitch />
          </Intro>
        </section>

        {/* Trust band */}
        <div className={styles.inner}>
          <Reveal className={styles.trustBand}>
            <span className={styles.trustItem}>
              <span className={styles.trustMark}>₦</span>
              Escrow on every order
            </span>
            <span className={styles.trustItem}>
              <span className={styles.trustMark}>✓</span>
              Verified merchants only
            </span>
            <span className={styles.trustItem}>
              <span className={styles.trustMark}>0</span>
              Free to post, free to sell
            </span>
            <span className={styles.trustItem}>
              <span className={styles.trustMark}>km</span>
              Matched inside your radius
            </span>
          </Reveal>
        </div>

        {/* Ticker */}
        <div className={styles.ticker}>
          <div className={styles.inner}>
            <div className={styles.tickerHead}>
              <span className={styles.liveDot} />
              <span className={styles.tag}>Wanted right now</span>
            </div>
          </div>
          <div className={styles.tickerTrack}>
            {[...ticker, ...ticker].map((t, i) => (
              <span className={styles.tickerItem} key={i}>
                <span>{t.what}</span>
                <span className={`${styles.tickerPrice} figure`}>{t.price}</span>
                <span className={styles.tickerMeta}>{t.where}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Tinted feature panels */}
        <section className={`${styles.inner} ${styles.section}`}>
          <Reveal className={styles.narrow}>
            <span className={`${styles.tag} ${styles.headLabel}`}>
              What you get
            </span>
            <h2 className={styles.h2}>Two sides, one platform</h2>
            <p className={`${styles.lede} ${styles.headSub}`} style={{ marginInline: "auto" }}>
              Buyers get prices without searching. Shops get demand without
              advertising.
            </p>
          </Reveal>

          <Stagger className={styles.panelGrid}>
            <StaggerItem className={`${styles.panel} ${styles.panelWide} ${styles.tintGreen}`}>
              <div>
                <h3 className={styles.h3}>Say it once, get real prices back</h3>
                <p className={styles.body}>
                  Describe the item, set a budget, choose how far you will
                  travel. Shops that actually have it in stock bid against each
                  other, and you pick on price, distance or rating.
                </p>
                <a className={styles.panelLink} href="#board">Browse open requests →</a>
              </div>
              <div className={styles.mock}>
                <div className={styles.mockBar}>
                  <span>Your request</span>
                  <span className={styles.tag}>4 bids</span>
                </div>
                <div className={styles.mockBody}>
                  <div className={`${styles.mockRow} ${styles.mockRowStrong}`}>
                    <span>Nike Air Force 1, size 43</span>
                    <span className="figure">₦85,000</span>
                  </div>
                  <div className={styles.mockDivider} />
                  <div className={styles.mockRow}><span>Kunle Sports · 3.1 km</span><span className="figure">₦82,000</span></div>
                  <div className={styles.mockRow}><span>Ade Kicks · 5.4 km</span><span className="figure">₦84,500</span></div>
                  <div className={styles.mockRow}><span>Bimbo Stores · 8.2 km</span><span className="figure">₦86,000</span></div>
                </div>
              </div>
            </StaggerItem>

            <div className={`${styles.panelGrid} ${styles.panelGrid2}`}>
              <StaggerItem className={`${styles.panel} ${styles.tintSky}`}>
                <div>
                  <h3 className={styles.h3}>Sell from the counter, not the laptop</h3>
                  <p className={styles.body}>
                    Scan a barcode, take the money, send the receipt. It keeps
                    working when the network drops and syncs the moment your
                    data comes back.
                  </p>
                </div>
                <div className={styles.mock}>
                  <div className={styles.mockBar}>
                    <span>Point of sale</span>
                    <span className={styles.tag}>Offline</span>
                  </div>
                  <div className={styles.mockBody}>
                    <div className={styles.mockRow}><span>Ankara wax print · 6 yd</span><span className="figure">₦9,000</span></div>
                    <div className={styles.mockRow}><span>Phone case · clear</span><span className="figure">₦3,400</span></div>
                    <div className={styles.mockDivider} />
                    <div className={`${styles.mockRow} ${styles.mockRowStrong}`}>
                      <span>Total due</span><span className="money">₦12,400</span>
                    </div>
                  </div>
                </div>
                <a className={styles.panelLink} href="#merchants">See the POS →</a>
              </StaggerItem>

              <StaggerItem className={`${styles.panel} ${styles.tintBlush}`}>
                <div>
                  <h3 className={styles.h3}>Your own store link, free</h3>
                  <p className={styles.body}>
                    Every item you add shows up on your own web store at
                    store.bidazk.com. Share it on WhatsApp, put it in your bio,
                    print it on your signage.
                  </p>
                </div>
                <div className={styles.mock}>
                  <div className={styles.mockBar}>
                    <span>store.bidazk.com/kunle-sports</span>
                  </div>
                  <div className={styles.mockBody}>
                    <div className={styles.storeGrid}>
                      {[
                        ["Air Force 1", "₦82,000"],
                        ["Yeezy 350", "₦145,000"],
                        ["Air Max 90", "₦96,000"],
                        ["Jordan 1 Mid", "₦120,000"],
                        ["Dunk Low", "₦88,000"],
                        ["Blazer Mid", "₦74,000"],
                      ].map(([n, p]) => (
                        <div className={styles.storeTile} key={n}>
                          <div className={styles.storeSwatch} />
                          <span className={styles.storeName}>{n}</span>
                          <span className={`${styles.storePrice} figure`}>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <a className={styles.panelLink} href="#merchants">Set up a store →</a>
              </StaggerItem>
            </div>

            <StaggerItem className={`${styles.panel} ${styles.panelWide} ${styles.tintSand}`}>
              <div>
                <h3 className={styles.h3}>Know what to stock before you buy it</h3>
                <p className={styles.body}>
                  We can see what people asked for and nobody could supply.
                  That gap becomes a straight answer: this many buyers near you
                  wanted this last week, and it was not on any shelf.
                </p>
                <a className={styles.panelLink} href="#agent">How matching works →</a>
              </div>
              <div className={styles.mock}>
                <div className={styles.mockBar}>
                  <span>Demand near Yaba</span>
                  <span className={styles.tag}>Last 7 days</span>
                </div>
                <div className={styles.mockBody}>
                  <div className={styles.mockRow}><span>Air Force 1 · size 43</span><span className="figure">17 asked · 0 supplied</span></div>
                  <div className={styles.mockRow}><span>Gas cylinder · 12.5kg</span><span className="figure">31 asked · 4 supplied</span></div>
                  <div className={styles.mockRow}><span>Standing fan · 18&quot;</span><span className="figure">22 asked · 9 supplied</span></div>
                </div>
              </div>
            </StaggerItem>
          </Stagger>
        </section>

        {/* Request board */}
        <section className={`${styles.inner} ${styles.section}`} id="board">
          <Reveal className={styles.sectionHead}>
            <div>
              <span className={`${styles.tag} ${styles.headLabel}`}>Live board</span>
              <h2 className={styles.h2}>What Lagos is asking for</h2>
              <p className={styles.headSub}>
                Every card is a buyer with money ready. If you stock it, bid on it.
              </p>
            </div>
            <button className={styles.btnGhost} type="button">See all 2,847</button>
          </Reveal>

          <div className={styles.chips}>
            {categories.map((c, i) => (
              <button key={c} type="button" className={`${styles.chipFilter} ${i === 0 ? styles.chipActive : ""}`}>
                {c}
              </button>
            ))}
          </div>

          <Stagger className={styles.board}>
            {requests.map((r) => (
              <StaggerCard className={styles.request} key={r.title}>
                <div className={styles.requestTop}>
                  <span className={`${styles.tag} ${styles.cat}`}>{r.cat}</span>
                  <span className={`${styles.tag} ${styles.countdown}`}>{r.left}</span>
                </div>
                <h3 className={styles.requestTitle}>{r.title}</h3>
                <div className={styles.requestBudget}>
                  <span className={`${styles.budgetAmt} money`}>{r.budget}</span>
                  <span className={styles.budgetLbl}>budget</span>
                </div>
                <div className={styles.requestFoot}>
                  <span className={`${styles.bidCount} ${r.bids >= 5 ? styles.bidCountHot : ""}`}>
                    <span className={styles.dot} />
                    {r.bids} bids
                  </span>
                  {r.agent ? (
                    <span className={styles.agentFlag}>Agent bidding</span>
                  ) : (
                    <span className={styles.dist}>{r.area}</span>
                  )}
                </div>
              </StaggerCard>
            ))}
          </Stagger>
        </section>

        {/* Agent, on inverse ground */}
        <section className={styles.inverse} id="agent">
          <div className={styles.inner}>
            <div className={styles.splitWide}>
              <Reveal>
                <span className={`${styles.tag} ${styles.headLabel}`}>Automated bidding</span>
                <h2 className={styles.h2}>
                  Shops bid while they are <em>closed.</em>
                </h2>
                <p className={styles.headSub}>
                  A merchant sets their minimum profit once. After that their
                  agent watches every matching request, bids inside those
                  limits, and tells them exactly why it landed on that number.
                </p>
                <div className={styles.steps}>
                  <div className={styles.step}>
                    <span className={styles.stepNum}>1</span>
                    <div>
                      <div className={styles.stepTitle}>You post</div>
                      <p className={styles.body}>What you want, your budget, how far you will travel.</p>
                    </div>
                  </div>
                  <div className={styles.step}>
                    <span className={styles.stepNum}>2</span>
                    <div>
                      <div className={styles.stepTitle}>Shops are matched</div>
                      <p className={styles.body}>We check stock in every shop inside your radius, not the whole country.</p>
                    </div>
                  </div>
                  <div className={styles.step}>
                    <span className={styles.stepNum}>3</span>
                    <div>
                      <div className={styles.stepTitle}>Bids come to you</div>
                      <p className={styles.body}>Compare and accept. Money moves out of escrow only when you confirm you got the item.</p>
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <div className={styles.feedCard}>
                  <div className={styles.feedHead}>
                    <div className={styles.feedRequest}>Nike Air Force 1, size 43, white</div>
                    <div className={styles.feedMeta}>
                      <span>Budget ₦85,000</span>
                      <span>Within 10 km</span>
                      <span className={styles.feedLive}><span className={styles.dot} />4 bids</span>
                    </div>
                  </div>
                  {bids.map((b, i) => (
                    <SlideInRow
                      key={b.merchant}
                      index={i}
                      className={`${styles.bid} ${b.agent ? styles.bidAgent : ""}`}
                    >
                      <span className={styles.avatar}>{b.initials}</span>
                      <div className={styles.bidBody}>
                        <div className={styles.bidTop}>
                          <span className={styles.merchant}>{b.merchant}</span>
                          <span className={styles.dist}>{b.meta}</span>
                        </div>
                        {b.why ? (
                          <p className={b.agent ? styles.bidWhy : styles.bidNote}>{b.why}</p>
                        ) : null}
                      </div>
                      <div className={styles.bidRight}>
                        <span className={`${styles.price} money`}>{b.price}</span>
                        <span className={`${styles.chip} ${b.chip}`}>{b.label}</span>
                      </div>
                    </SlideInRow>
                  ))}
                </div>

                {/* Scale runs ₦20,000 to ₦150,000. Percentages below are
                    positions on that scale, not arbitrary values. */}
                <div style={{ marginTop: "1.75rem" }}>
                  <span className={`${styles.tag} ${styles.headLabel}`}>
                    Your budget sets the range
                  </span>

                  <div className={styles.range}>
                    <div className={styles.rangeBidRow}>
                      <div className={styles.rangeBid} style={{ left: "47.7%" }}>
                        <span className={styles.rangeBidLabel}>Best bid</span>
                        <span className={styles.rangeBidAmt}>₦82,000</span>
                        <div className={styles.rangeBidStem} />
                      </div>
                    </div>

                    <div className={styles.rangeTrack}>
                      <div className={styles.rangeOut} style={{ left: 0, width: "17.3%" }} />
                      <div className={styles.rangeZone} style={{ left: "17.3%", width: "65.4%" }} />
                      <div className={styles.rangeOut} style={{ left: "82.7%", right: 0 }} />
                      <div className={styles.rangeDot} style={{ left: "47.7%" }} />
                    </div>

                    <div className={styles.rangeMarks}>
                      <div className={styles.rangeMark} style={{ left: "17.3%" }}>
                        <div className={styles.rangeTick} />
                        <div className={styles.rangeAmt}>₦42,500</div>
                        <div className={styles.rangeLbl}>Lowest a shop may bid</div>
                      </div>
                      <div className={styles.rangeMark} style={{ left: "50%" }}>
                        <div className={styles.rangeTick} />
                        <div className={styles.rangeAmt}>₦85,000</div>
                        <div className={styles.rangeLbl}>Your budget</div>
                      </div>
                      <div className={styles.rangeMark} style={{ left: "82.7%" }}>
                        <div className={styles.rangeTick} />
                        <div className={styles.rangeAmt}>₦127,500</div>
                        <div className={styles.rangeLbl}>Highest a shop may bid</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Merchants */}
        <section className={`${styles.inner} ${styles.section}`} id="merchants">
          <Reveal className={`${styles.panel} ${styles.panelWide} ${styles.tintSky}`}>
            <div>
              <span className={`${styles.tag} ${styles.headLabel}`}>For merchants</span>
              <h2 className={styles.h2}>Run the shop from your phone</h2>
              <p className={styles.headSub}>
                Everything a small shop actually needs, free. The only thing we
                ask is that your stock stays up to date, because that is what lets your
                agent bid for you.
              </p>
              <div className={styles.steps}>
                <div className={styles.step}>
                  <span className={styles.stepNum}>1</span>
                  <div>
                    <div className={styles.stepTitle}>Scan to sell</div>
                    <p className={styles.body}>Barcode, payment, receipt. Works offline and syncs later.</p>
                  </div>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNum}>2</span>
                  <div>
                    <div className={styles.stepTitle}>Stock that counts itself</div>
                    <p className={styles.body}>Every sale updates your inventory, so you always know what is left.</p>
                  </div>
                </div>
                <div className={styles.step}>
                  <span className={styles.stepNum}>3</span>
                  <div>
                    <div className={styles.stepTitle}>Bids on autopilot</div>
                    <p className={styles.body}>Set your minimum profit once. Your agent never goes below it.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.posWrap}>
              <div className={styles.pos}>
                <div className={styles.posBar}>
                  <span>Kunle Sports · Yaba</span>
                  <span className={styles.posModeChip}>Seller</span>
                </div>
                <div className={styles.posBody}>
                  <div className={styles.posLine}><span>Ankara wax print · 6 yd</span><span className="figure">₦9,000</span></div>
                  <div className={styles.posLine}><span>Phone case · clear</span><span className="figure">₦3,400</span></div>
                  <div className={styles.posTotalLbl}>Total due</div>
                  <div className={`${styles.posTotal} money`}>₦12,400</div>
                  <button className={styles.posBtn} type="button">Charge ₦12,400</button>
                  <div className={styles.outbox}>
                    <span>Sales waiting to sync</span>
                    <span className={styles.outboxCount}>3</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Testimonials */}
        <section className={styles.brandBlock}>
          <div className={`${styles.inner} ${styles.narrow}`}>
            <h2 className={styles.h2}>From behind the counter</h2>
            <p style={{ marginTop: "0.75rem", opacity: 0.92 }}>
              Placeholder quotes and illustrated avatars. Real merchants, with
              their permission, before launch.
            </p>
          </div>
          <div className={styles.quoteMarquee}>
            <div className={styles.quoteTrack}>
              {[...quotes, ...quotes].map((q, i) => (
                <div className={styles.quote} key={`${q.name}-${i}`}>
                  <div className={styles.quoteWho}>
                    <Avatar face={q.face} />
                    <span>
                      <span className={styles.quoteName}>{q.name}</span>
                      <br />
                      <a
                        className={styles.quoteLink}
                        href={`https://${q.store}`}
                      >
                        <StoreIcon />
                        {q.store}
                      </a>
                    </span>
                  </div>
                  <p className={styles.quoteText}>&ldquo;{q.text}&rdquo;</p>
                  <div className={styles.quoteMeta}>{q.meta}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className={`${styles.inner} ${styles.section}`}>
          <div className={styles.narrow} style={{ marginBottom: "2.25rem" }}>
            <span className={`${styles.tag} ${styles.headLabel}`}>Questions</span>
            <h2 className={styles.h2}>The things people ask first</h2>
          </div>
          <Stagger className={styles.faqList}>
            {faqs.map((f) => (
              <details className={styles.faqItem} key={f.q}>
                <summary className={styles.faqQ}>{f.q}</summary>
                <p className={styles.faqA}>{f.a}</p>
              </details>
            ))}
          </Stagger>
        </section>

        {/* Closer */}
        <section className={styles.inner}>
          <Reveal className={styles.closer}>
            <h2 className={styles.h2}>Tell us what you want</h2>
            <p className={styles.headSub} style={{ marginInline: "auto" }}>
              Try it now: one phone sells, another buys, and the payment waits in escrow on Stellar testnet.
            </p>
            <div className={styles.closerRow}>
              <Link className={`${styles.btnOnBrand} ${styles.btnLarge}`} href="/demo">Open the live demo</Link>
              <Link className={`${styles.btnGhost} ${styles.btnLarge}`} href="/how-it-works">How escrow works</Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className={`${styles.inner} ${styles.footer}`}>
        <div className={styles.footerGrid}>
          <div className={styles.footerCol}>
            <span className={styles.brand}>
              Bidazk<span className={styles.brandDot}>.</span>
            </span>
            <p className={styles.footerBlurb}>
              The reverse marketplace for physical goods. Buyers ask, shops bid,
              escrow holds the money until it is delivered.
            </p>
          </div>
          <div className={styles.footerCol}>
            <h4>Buy</h4>
            <ul>
              <li><a href="#board">Open requests</a></li>
              <li><a href="#agent">How bidding works</a></li>
              <li><Link href="/how-it-works">Escrow and disputes</Link></li>
              <li><Link href="/demo">Live escrow demo</Link></li>
              <li><a href="#">Delivery</a></li>
            </ul>
          </div>
          <div className={styles.footerCol}>
            <h4>Sell</h4>
            <ul>
              <li><a href="#merchants">Merchant tools</a></li>
              <li><a href="#merchants">Scan-to-Pay POS</a></li>
              <li><a href="#">Store links</a></li>
            </ul>
          </div>
          <div className={styles.footerCol}>
            <h4>Company</h4>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className={styles.footerBase}>
          <span>© 2026 Bidazk</span>
          <span className={styles.spacer} />
          <span>Design preview. Copy and imagery not final.</span>
        </div>
      </footer>
    </div>
  );
}
