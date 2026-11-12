"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { NAIRA_PER_TEST_XLM, searchCatalog, type CatalogItem } from "./catalog";
import { bidsFor, DEMO_SHOP_COUNT, LIVE_SHOP_NAME, type Bid } from "./shops";
import styles from "./demo.module.css";

/* The buyer's side of a reverse marketplace: say what you want and what you
   will pay, watch the request go out to shops, see who bid. Matching itself
   is instant; the scan is paced with timers so a room watching a projected
   screen can follow what is happening. */

const STEP_MS = 420;
const CHIPS = ["iPhone", "Drone", "Laptop", "AirPods", "Speaker", "Smartwatch", "Android"];

/* A buyer's request. The budget keeps out bids above the buyer's ceiling
   (or below their floor), the way a real request's price range does. */
export type SearchRequest = { q: string; min: number | null; max: number | null };

export function requestKey(r: SearchRequest): string {
  return `${r.q.toLowerCase()}|${r.min ?? ""}|${r.max ?? ""}`;
}

function nairaText(n: number): string {
  return `₦${n.toLocaleString("en-NG")}`;
}

function parseNaira(text: string): number | null {
  const digits = text.replace(/[^0-9]/g, "");
  return digits ? Number(digits) : null;
}

function inBudget(n: number, r: SearchRequest): boolean {
  return (r.min === null || n >= r.min) && (r.max === null || n <= r.max);
}

function budgetText(r: SearchRequest): string {
  if (r.min !== null && r.max !== null) return `${nairaText(r.min)} – ${nairaText(r.max)}`;
  if (r.max !== null) return `up to ${nairaText(r.max)}`;
  if (r.min !== null) return `from ${nairaText(r.min)}`;
  return "";
}

type Found = { item: CatalogItem; bids: Bid[] };

/* Keyword matches, then budget. An item stays only if the live shop's bid
   fits; other shops' bids outside the range are dropped. */
function find(r: SearchRequest): { found: Found[]; keywordHits: CatalogItem[] } {
  const keywordHits = searchCatalog(r.q);
  const found = keywordHits
    .map((item) => ({ item, bids: bidsFor(item).filter((b) => inBudget(b.naira, r)) }))
    .filter((f) => f.bids.length > 0 && f.bids[0].live);
  return { found, keywordHits };
}

function scanScript(r: SearchRequest): string[] {
  const { found, keywordHits } = find(r);
  const budget = budgetText(r);
  const lines = [
    `$ bidazk match --request "${r.q}"${budget ? ` --budget "${budget}"` : ""} --radius 10km --city uyo`,
    "> Broadcasting your request to shops within 10 km…",
    `> ${DEMO_SHOP_COUNT} shops reached. Scanning live inventories…`,
    "> Checking stock, price floors and delivery range…",
  ];
  if (keywordHits.length === 0) {
    lines.push(`> 0 matches for "${r.q}" in any inventory.`);
  } else {
    if (budget) lines.push(`> Filtering bids outside your budget (${budget})…`);
    if (found.length === 0) {
      lines.push(`> ${keywordHits.length} item${keywordHits.length === 1 ? "" : "s"} found, but no bid fits your budget.`);
    }
    for (const f of found) {
      lines.push(
        `> MATCH  ${f.item.name}  ·  ${f.bids.length} bid${f.bids.length === 1 ? "" : "s"}  ·  best ${nairaText(f.bids[0].naira)}`,
      );
    }
    if (found.length > 0) lines.push("> Ranking bids by price, distance and rating…");
  }
  lines.push(`> Done. ${found.length} result${found.length === 1 ? "" : "s"}.`);
  return lines;
}

export default function SearchPanel(props: {
  initial: SearchRequest | null;
  instant: boolean;
  liveShopAddress: string;
  orderForItem: (itemId: number) => string | null;
  onSearch: (request: SearchRequest) => void;
  onComplete: (request: SearchRequest) => void;
  onOpenItem: (itemId: number) => void;
  onOpenOrder: (orderId: string) => void;
}) {
  const [input, setInput] = useState(props.initial?.q ?? "");
  const [minInput, setMinInput] = useState(props.initial?.min?.toLocaleString("en-NG") ?? "");
  const [maxInput, setMaxInput] = useState(props.initial?.max?.toLocaleString("en-NG") ?? "");
  const [request, setRequest] = useState<SearchRequest | null>(props.initial);
  const [shown, setShown] = useState(props.instant ? Number.MAX_SAFE_INTEGER : 0);
  const timers = useRef<number[]>([]);

  const { found, keywordHits } = request ? find(request) : { found: [] as Found[], keywordHits: [] as CatalogItem[] };
  const script = request ? scanScript(request) : [];
  const done = request !== null && shown >= script.length;
  const scanning = request !== null && !done;
  const reqKey = request ? requestKey(request) : "";

  /* Each request restarts the scan; leaving the page cancels it. Lines are
     revealed on timers so the scan reads like a live process. */
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (!request || props.instant) return;
    const r = request;
    const total = scanScript(r).length;
    for (let i = 1; i <= total; i++) {
      timers.current.push(window.setTimeout(() => setShown(i), i * STEP_MS));
    }
    timers.current.push(window.setTimeout(() => props.onComplete(r), total * STEP_MS));
    return () => timers.current.forEach(clearTimeout);
    // Restart only when the request itself changes; instant and onComplete
    // are read once per request on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reqKey]);

  function run(text: string) {
    const q = text.trim();
    if (!q) return;
    let min = parseNaira(minInput);
    let max = parseNaira(maxInput);
    if (min !== null && max !== null && min > max) [min, max] = [max, min];
    const next: SearchRequest = { q, min, max };
    setInput(q);
    setMinInput(min?.toLocaleString("en-NG") ?? "");
    setMaxInput(max?.toLocaleString("en-NG") ?? "");
    setShown(0);
    setRequest(next);
    props.onSearch(next);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    run(input);
  }

  const progress = script.length
    ? Math.min(100, Math.round((Math.min(shown, script.length) / script.length) * 100))
    : 0;

  const chips = (
    <div className={styles.chips}>
      {CHIPS.map((c) => (
        <button key={c} type="button" className={styles.chipBtn} onClick={() => run(c)} disabled={scanning}>
          {c}
        </button>
      ))}
    </div>
  );

  return (
    <section className={styles.search} aria-label="Search">
      <form className={styles.searchForm} onSubmit={submit} role="search">
        <label className={styles.searchLabel} htmlFor="want">
          What do you want to buy?
        </label>
        <div className={styles.searchRow}>
          <input
            id="want"
            className={styles.searchInput}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. iPhone, drone, laptop"
            autoComplete="off"
            enterKeyHint="search"
          />
          <button className={styles.btnPrimary} type="submit" disabled={!input.trim() || scanning}>
            {scanning ? "Searching…" : "Find shops"}
          </button>
        </div>
        <div className={styles.budgetRow}>
          <span className={styles.budgetLabel}>Budget (optional)</span>
          <label className={styles.budgetField}>
            <span>₦</span>
            <input
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              placeholder="From"
              inputMode="numeric"
              aria-label="Minimum budget in naira"
            />
          </label>
          <span className={styles.budgetDash}>–</span>
          <label className={styles.budgetField}>
            <span>₦</span>
            <input
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              placeholder="To"
              inputMode="numeric"
              aria-label="Maximum budget in naira"
            />
          </label>
        </div>
        {chips}
      </form>

      {scanning && (
        <>
          <div className={styles.terminal} role="status" aria-live="polite">
            <div className={styles.termBar}>
              <span className={styles.termDots} aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span>bidazk-matcher</span>
              <span className={styles.termPct}>{progress}%</span>
            </div>
            <div className={styles.termBody}>
              {script.slice(0, shown + 1).map((line, i) => (
                <p
                  key={i}
                  className={line.startsWith("> MATCH") ? styles.termMatch : line.startsWith("$") ? styles.termCmd : undefined}
                >
                  {line}
                  {i === Math.min(shown, script.length - 1) && <span className={styles.caret} aria-hidden="true" />}
                </p>
              ))}
            </div>
            <div className={styles.termProgress}>
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className={styles.skeletons} aria-hidden="true">
            {[0, 1].map((i) => (
              <div key={i} className={styles.skeleton}>
                <span className={styles.skelImg} />
                <span className={styles.skelLines}>
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {done && request && found.length === 0 && (
        <div className={styles.noMatch}>
          {keywordHits.length === 0 ? (
            <>
              <h3 className={styles.h3}>No shop on Bidazk has &ldquo;{request.q}&rdquo; yet</h3>
              <p className={styles.small}>
                In the full product your request stays open, and shops near you
                are alerted the moment one of them stocks it. For this demo, try
                one of these:
              </p>
            </>
          ) : (
            <>
              <h3 className={styles.h3}>No bid fits your budget</h3>
              <p className={styles.small}>
                {`Shops have ${keywordHits.map((i) => i.name).join(", ")}, but the best bid ${
                  keywordHits.length === 1 ? "is" : "starts at"
                } ${nairaText(Math.min(...keywordHits.map((i) => i.naira)))}, outside your budget (${budgetText(
                  request,
                )}). Widen your budget, or try another item:`}
              </p>
            </>
          )}
          {chips}
        </div>
      )}

      {done && request && found.length > 0 && (
        <div className={styles.results}>
          <p className={styles.resultsHead}>
            <strong>{found.length}</strong> match{found.length === 1 ? "" : "es"} for &ldquo;{request.q}&rdquo;
            {budgetText(request) ? <> within {budgetText(request)}</> : null}. Shops bid; the best bid is first.
          </p>
          {found.map(({ item, bids }) => {
            const existing = props.orderForItem(item.id);
            return (
              <article key={item.id} className={styles.result}>
                <div className={styles.resultTop}>
                  <Image className={styles.resultImg} src={item.image} alt={item.name} width={360} height={270} sizes="160px" />
                  <div className={styles.resultInfo}>
                    <span className={styles.resultCat}>{item.category}</span>
                    <h3 className={styles.resultName}>{item.name}</h3>
                    <p className={styles.small}>{item.bidNote}</p>
                  </div>
                </div>
                <ol className={styles.bids}>
                  {bids.map((b) => (
                    <li key={b.shop} className={b.live ? styles.bidLive : styles.bidOther}>
                      <span className={styles.bidShop}>
                        <span>
                          <strong>{b.shop}</strong>
                          {b.live && <span className={styles.bestTag}>Best price</span>}
                        </span>
                        <span className={styles.bidMeta}>
                          {b.area} · {b.km} km · {b.rating}★{b.live && <> · {props.liveShopAddress}</>}
                        </span>
                      </span>
                      <span className={styles.bidAmount}>
                        {nairaText(b.naira)}
                        {b.live ? (
                          <span className={styles.xlm}>({(b.naira / NAIRA_PER_TEST_XLM).toLocaleString("en-NG")} XLM)</span>
                        ) : (
                          <span className={styles.demoListing}>Demo listing</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
                {existing ? (
                  <button className={styles.btnGhost} onClick={() => props.onOpenOrder(existing)}>
                    You already ordered this · Open order #{existing}
                  </button>
                ) : (
                  <button className={styles.btnPrimary} onClick={() => props.onOpenItem(item.id)}>
                    View {LIVE_SHOP_NAME}&apos;s bid &amp; pay
                  </button>
                )}
              </article>
            );
          })}
          <p className={styles.tiny}>
            Only {LIVE_SHOP_NAME} is a live shop in this demo. The other bids are
            display-only listings and cannot be paid.
          </p>
        </div>
      )}
    </section>
  );
}
