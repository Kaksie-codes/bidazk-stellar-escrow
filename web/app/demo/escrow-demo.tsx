"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import {
  fundFromFaucet,
  isValidShopAddress,
  loadDemoWallets,
  type DemoWallets,
} from "@/lib/escrow/demo-wallets";
import { EXPLORER_URL, TOKEN_DECIMALS, TOKEN_SYMBOL } from "@/lib/escrow/config";
import {
  EscrowRuleError,
  TERMINAL_STATUSES,
  type Deal,
  type DealStatus,
  type Receipt,
} from "@/lib/escrow/types";
import { NAIRA_PER_TEST_XLM, catalogItem, type CatalogItem } from "./catalog";
import SearchPanel, { requestKey, type SearchRequest } from "./search";
import { bidsFor, LIVE_SHOP_NAME } from "./shops";
import styles from "./demo.module.css";

/* Ledger time trails the wall clock by a few seconds. Countdowns show the
   real deadline; buttons that depend on it unlock this much later, so the
   page never offers an action the ledger will still refuse. */
const LEDGER_SLACK = 6;
const POLL_MS = 5000;
const ROLE_KEY = "bidazk-demo-role-v1";
const SHOP_KEY = "bidazk-demo-shop-v1";

const TIMERS = {
  fast: { label: "Fast demo: deliver in 3 min, inspect for 2", delivery: 180, inspection: 120 },
  relaxed: { label: "Relaxed: deliver in 10 min, inspect for 5", delivery: 600, inspection: 300 },
} as const;
type TimerKey = keyof typeof TIMERS;

type Role = "buying" | "selling";
type Phase = "loading" | "unfunded" | "funding" | "ready";
type Side = "buyer" | "seller";
type View = { kind: "list" } | { kind: "item"; id: number } | { kind: "order"; id: string };
type Balances = { buyer: bigint; seller: bigint; escrow: bigint };
type Snapshot = { balances: Balances; deals: Deal[] };
type LogEntry = {
  id: number;
  at: number;
  text: string;
  tone: "ok" | "blocked" | "error" | "news";
  receipt?: Receipt;
};
type Runner = (key: string, success: string, action: () => Promise<Receipt>) => Promise<void>;

/* A wanted post is filled once a purchase is open or completed. A refund or
   cancel means the buyer still needs the item, so it returns to the feed. */
const FILLED: readonly DealStatus[] = ["Funded", "Delivered", "Disputed", "Released", "Resolved"];

// ---------------------------------------------------------------- formatting

const UNIT = BigInt(10) ** BigInt(TOKEN_DECIMALS);

function formatAmount(minor: bigint): string {
  const whole = minor / UNIT;
  const cents = ((minor % UNIT) * BigInt(100)) / UNIT;
  return `${whole.toLocaleString("en-NG")}${cents ? `.${cents.toString().padStart(2, "0")}` : ""}`;
}

/* Naira first, test XLM in brackets. On testnet the XLM is what actually
   moves; the naira figure is it at the catalog's demo rate. */
function naira(minor: bigint): string {
  return `₦${((minor * BigInt(NAIRA_PER_TEST_XLM)) / UNIT).toLocaleString("en-NG")}`;
}

function money(minor: bigint): string {
  return `${naira(minor)} (${formatAmount(minor)} ${TOKEN_SYMBOL})`;
}

function formatClock(secs: number): string {
  const s = Math.max(0, Math.ceil(secs));
  if (s >= 3600) return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m`;
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function formatTime(unixSecs: number): string {
  return new Date(unixSecs * 1000).toLocaleTimeString("en-NG", { hour12: false });
}

function short(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

const STATUS: Record<DealStatus, { label: string; icon: string; tone: string }> = {
  Funded: { label: "Waiting for delivery", icon: "◆", tone: styles.chipHeld },
  Delivered: { label: "Buyer inspecting", icon: "◷", tone: styles.chipInspect },
  Disputed: { label: "Disputed, frozen", icon: "!", tone: styles.chipDispute },
  Released: { label: "Shop paid", icon: "✓", tone: styles.chipDone },
  Refunded: { label: "Buyer refunded", icon: "↩", tone: styles.chipDone },
  Cancelled: { label: "Cancelled, refunded", icon: "↩", tone: styles.chipNeutral },
  Resolved: { label: "Settled by referee", icon: "⚖", tone: styles.chipDone },
};

function describeFailure(err: unknown): string {
  if (err instanceof EscrowRuleError) return err.message;
  const text = err instanceof Error ? `${err.name} ${err.message}` : String(err);
  if (/requires signatures|NeedsMoreSignatures/i.test(text)) {
    return "It needs the other party's signature, which this phone does not have.";
  }
  return "The network did not accept that. Wait a few seconds and try again.";
}

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Private mode: the choice lasts for this visit only. */
  }
}

/* Accepts a full shop link or a bare address. */
function parseShop(input: string): string | null {
  const text = input.trim();
  let candidate = text;
  try {
    candidate = new URL(text).searchParams.get("shop") ?? text;
  } catch {
    /* Not a URL: treat it as an address. */
  }
  return isValidShopAddress(candidate) ? candidate : null;
}

/* Screens live in the query string so the phone's back button works and a
   shop link (?shop=…) survives moving between them. */
function readView(): View {
  const q = new URLSearchParams(window.location.search);
  const order = q.get("order");
  if (order && /^\d+$/.test(order)) return { kind: "order", id: order };
  const item = Number(q.get("item"));
  if (catalogItem(item)) return { kind: "item", id: item };
  return { kind: "list" };
}

/* The buyer's last request also lives in the query string, so Back from a
   product or order lands on the same results. */
function readSearch(): SearchRequest | null {
  const q = new URLSearchParams(window.location.search);
  const text = q.get("q")?.trim();
  if (!text) return null;
  const num = (k: string) => (/^\d+$/.test(q.get(k) ?? "") ? Number(q.get(k)) : null);
  return { q: text, min: num("min"), max: num("max") };
}

function urlFor(view: View, shop?: string | null, search?: SearchRequest | null): string {
  const q = new URLSearchParams(window.location.search);
  q.delete("item");
  q.delete("order");
  if (shop !== undefined) {
    if (shop) q.set("shop", shop);
    else q.delete("shop");
  }
  if (search !== undefined) {
    q.delete("q");
    q.delete("min");
    q.delete("max");
    if (search) {
      q.set("q", search.q);
      if (search.min !== null) q.set("min", String(search.min));
      if (search.max !== null) q.set("max", String(search.max));
    }
  }
  if (view.kind === "item") q.set("item", String(view.id));
  if (view.kind === "order") q.set("order", view.id);
  const s = q.toString();
  return `${window.location.pathname}${s ? `?${s}` : ""}`;
}

/* Reads only. Kept outside the component so effects can call it without
   setting state synchronously. */
async function fetchSnapshot(w: DemoWallets): Promise<Snapshot> {
  const [buyer, seller, escrow, all] = await Promise.all([
    w.escrow.balanceOf(w.buyer),
    w.escrow.balanceOf(w.seller),
    w.escrow.balanceOf(w.escrow.escrowAddress()),
    w.escrow.listDeals(),
  ]);
  return {
    balances: { buyer, seller, escrow },
    deals: all.filter((d) => d.buyer === w.buyer || d.seller === w.seller).reverse(),
  };
}

// ---------------------------------------------------------------- component

export default function EscrowDemo() {
  const [wallets, setWallets] = useState<DemoWallets | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [role, setRole] = useState<Role>("buying");
  const [view, setView] = useState<View>({ kind: "list" });
  const [search, setSearch] = useState<SearchRequest | null>(null);
  /* The request whose scan already ran, so Back shows its results instantly. */
  const [scanned, setScanned] = useState<string | null>(null);
  const [shop, setShop] = useState<string | null>(null);
  const [shopFromLink, setShopFromLink] = useState(false);
  const [balances, setBalances] = useState<Balances | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [problem, setProblem] = useState<string | null>(null);
  const [timers, setTimers] = useState<TimerKey>("fast");

  /* Seller-side deal ids already seen, so a new order can be announced. */
  const seenOrders = useRef<Set<string> | null>(null);

  const addLog = useCallback((entry: Omit<LogEntry, "id" | "at">) => {
    setLog((prev) => [{ ...entry, id: Date.now() + Math.random(), at: Date.now() }, ...prev].slice(0, 30));
  }, []);

  const apply = useCallback(
    (s: Snapshot, w: DemoWallets) => {
      const incoming = s.deals.filter((d) => d.seller === w.seller && d.buyer !== w.buyer);
      if (seenOrders.current) {
        for (const d of incoming) {
          if (!seenOrders.current.has(d.id.toString())) {
            const item = catalogItem(d.itemId);
            addLog({
              text: `New order #${d.id}: ${item?.name ?? `item #${d.itemId}`} for ${money(d.amount)}, paid into escrow by buyer ${short(d.buyer)}.`,
              tone: "news",
            });
          }
        }
      }
      seenOrders.current = new Set(incoming.map((d) => d.id.toString()));
      setBalances(s.balances);
      setDeals(s.deals);
      setProblem(null);
    },
    [addLog],
  );

  const refresh = useCallback(
    async (w: DemoWallets) => {
      try {
        apply(await fetchSnapshot(w), w);
      } catch {
        setProblem("Cannot reach the Stellar testnet right now. Retrying…");
      }
    },
    [apply],
  );

  /* Wallets, role, shop and screen live in the browser, so they load after
     mount and never on the server. A shop link means "buy from this shop". */
  useEffect(() => {
    let alive = true;
    const w = loadDemoWallets();
    const linked = parseShop(new URLSearchParams(window.location.search).get("shop") ?? "");
    const stored = parseShop(readLocal(SHOP_KEY) ?? "");
    const storedRole = readLocal(ROLE_KEY) === "selling" ? "selling" : "buying";

    fetchSnapshot(w)
      .then((s) => {
        if (!alive) return;
        apply(s, w);
        setPhase(s.balances.buyer > BigInt(0) ? "ready" : "unfunded");
      })
      .catch(() => {
        if (!alive) return;
        setProblem("Cannot reach the Stellar testnet right now. Try again in a moment.");
        setPhase("unfunded");
      })
      .finally(() => {
        if (!alive) return;
        setWallets(w);
        setView(readView());
        setSearch(readSearch());
        if (linked && linked !== w.seller) {
          setShop(linked);
          setShopFromLink(true);
          setRole("buying");
          writeLocal(SHOP_KEY, linked);
        } else {
          setShop(stored && stored !== w.seller ? stored : null);
          setRole(storedRole);
        }
      });
    return () => {
      alive = false;
    };
  }, [apply]);

  useEffect(() => {
    const onPop = () => {
      setView(readView());
      setSearch(readSearch());
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!wallets || phase !== "ready") return;
    const t = setInterval(() => refresh(wallets), POLL_MS);
    return () => clearInterval(t);
  }, [wallets, phase, refresh]);

  /* replace: swap the current history entry instead of adding one, so Back
     from a just-created order skips the product page that created it. */
  function go(next: View, replace = false) {
    if (replace) window.history.replaceState(null, "", urlFor(next));
    else window.history.pushState(null, "", urlFor(next));
    setView(next);
    window.scrollTo({ top: 0 });
  }

  function chooseRole(next: Role) {
    setRole(next);
    writeLocal(ROLE_KEY, next);
    if (view.kind !== "list") go({ kind: "list" });
  }

  function chooseShop(next: string | null) {
    setShop(next);
    setShopFromLink(false);
    writeLocal(SHOP_KEY, next ?? "");
    /* Keep the address bar honest, or a reload would restore the old shop. */
    window.history.replaceState(null, "", urlFor(view, next));
  }

  async function fund() {
    if (!wallets) return;
    setPhase("funding");
    try {
      await Promise.all([fundFromFaucet(wallets.buyer), fundFromFaucet(wallets.seller)]);
      await refresh(wallets);
      addLog({ text: "Created your buyer wallet and your shop wallet, each funded with test XLM.", tone: "ok" });
      setPhase("ready");
    } catch (err) {
      setProblem(err instanceof Error ? err.message : String(err));
      setPhase("unfunded");
    }
  }

  function resetWallets() {
    const w = loadDemoWallets(true);
    seenOrders.current = null;
    setWallets(w);
    setDeals([]);
    setBalances(null);
    setLog([]);
    setPhase("unfunded");
    go({ kind: "list" });
  }

  /* Every action goes through here: one at a time, logged with its receipt,
     then a refresh so balances visibly move. */
  const run: Runner = async (key, success, action) => {
    if (!wallets || busy) return;
    setBusy(key);
    try {
      const receipt = await action();
      addLog({ text: success, tone: "ok", receipt });
    } catch (err) {
      addLog({ text: `Failed: ${describeFailure(err)}`, tone: "error" });
    } finally {
      await refresh(wallets);
      setBusy(null);
    }
  };

  /* The "try to cheat" buttons expect rejection. Success here would be a bug. */
  const attempt: Runner = async (key, what, action) => {
    if (!wallets || busy) return;
    setBusy(key);
    try {
      const receipt = await action();
      addLog({ text: `${what}: it went through. That should not happen.`, tone: "error", receipt });
    } catch (err) {
      addLog({ text: `${what}: blocked. ${describeFailure(err)}`, tone: "blocked" });
    } finally {
      await refresh(wallets);
      setBusy(null);
    }
  };

  /* Paying lands the buyer on the new order's page, where the clock starts. */
  async function acceptBid(item: CatalogItem) {
    if (!wallets || busy) return;
    const seller = shop ?? wallets.seller;
    const t = TIMERS[timers];
    setBusy(`buy:${item.id}`);
    try {
      const { dealId, receipt } = await wallets.escrow.create({
        buyer: wallets.buyer,
        seller,
        itemId: item.id,
        amount: BigInt(item.price) * UNIT,
        deliveryWindowSecs: t.delivery,
        inspectionSecs: t.inspection,
      });
      addLog({
        text: `You accepted ${LIVE_SHOP_NAME}'s bid and locked ${money(BigInt(item.price) * UNIT)} in escrow for "${item.name}" (order #${dealId}).`,
        tone: "ok",
        receipt,
      });
      await refresh(wallets);
      go({ kind: "order", id: dealId.toString() }, true);
    } catch (err) {
      addLog({ text: `Failed: ${describeFailure(err)}`, tone: "error" });
      await refresh(wallets);
    } finally {
      setBusy(null);
    }
  }

  if (!wallets || phase === "loading") {
    return <div className={styles.loading}>Connecting to the Stellar testnet…</div>;
  }

  if (phase !== "ready") {
    return (
      <div className={styles.demo}>
        {problem && <p className={styles.problem}>{problem}</p>}
        <section className={styles.onboard}>
          {shop && shopFromLink && <span className={styles.tag}>You scanned shop {short(shop)}</span>}
          <h2 className={styles.h2}>Get your test wallets</h2>
          <p className={styles.body}>
            One tap gives this phone a buyer wallet and a shop wallet, each
            funded with free testnet XLM. No app, no sign-up, no real money.
          </p>
          <button className={styles.btnPrimary} onClick={fund} disabled={phase === "funding"}>
            {phase === "funding" ? "Funding wallets…" : "Create test wallets"}
          </button>
        </section>
      </div>
    );
  }

  const { escrow } = wallets;
  const myOrders = deals.filter((d) => d.buyer === wallets.buyer);
  const myShopOrders = deals.filter((d) => d.seller === wallets.seller);
  const activeShop = shop ?? wallets.seller;
  const shopLink = `${window.location.origin}/demo?shop=${wallets.seller}`;
  /* An item with an open or completed order is already bought; search
     results link to that order instead of offering to pay again. */
  const orderForItem = (itemId: number): string | null => {
    const d = myOrders.find((o) => o.itemId === itemId && FILLED.includes(o.status));
    return d ? d.id.toString() : null;
  };

  const isOpen = (d: Deal) => !TERMINAL_STATUSES.includes(d.status);
  const order = view.kind === "order" ? deals.find((d) => d.id.toString() === view.id) : undefined;
  const item = view.kind === "item" ? catalogItem(view.id) : undefined;
  const itemOrder = item ? myOrders.find((d) => d.itemId === item.id && FILLED.includes(d.status)) : undefined;
  const itemFilled = !!itemOrder;
  const orderSide: Side | undefined = order
    ? role === "buying"
      ? order.buyer === wallets.buyer
        ? "buyer"
        : "seller"
      : order.seller === wallets.seller
        ? "seller"
        : "buyer"
    : undefined;

  const walletStrip = (
    <section className={styles.wallets} aria-label="Balances">
      {role === "buying" ? (
        <WalletCard role="Your buyer wallet" note="Pays into escrow" address={wallets.buyer} balance={balances?.buyer} />
      ) : (
        <WalletCard role="Your shop wallet" note="Paid when escrow releases" address={wallets.seller} balance={balances?.seller} />
      )}
      <WalletCard
        role="Escrow contract"
        note="Held for every open demo deal"
        address={escrow.escrowAddress()}
        balance={balances?.escrow}
        contract
      />
    </section>
  );

  return (
    <div className={styles.demo}>
      {problem && <p className={styles.problem}>{problem}</p>}

      <div className={styles.tabs} role="tablist" aria-label="Choose your side">
        <button
          role="tab"
          aria-selected={role === "buying"}
          className={role === "buying" ? styles.tabActive : styles.tab}
          onClick={() => chooseRole("buying")}
        >
          I&apos;m buying
          {myOrders.some(isOpen) && <span className={styles.tabDot} />}
        </button>
        <button
          role="tab"
          aria-selected={role === "selling"}
          className={role === "selling" ? styles.tabActive : styles.tab}
          onClick={() => chooseRole("selling")}
        >
          I&apos;m selling
          {myShopOrders.some(isOpen) && <span className={styles.tabDot} />}
        </button>
      </div>

      {/* ---------------------------------------------------- order page */}
      {view.kind === "order" && (
        <>
          <button className={styles.back} onClick={() => window.history.back()}>
            ← Back
          </button>
          {order && orderSide ? (
            <OrderPage
              deal={order}
              side={orderSide}
              signer={orderSide === "buyer" ? wallets.buyer : wallets.seller}
              arbiter={wallets.arbiter}
              now={now}
              busy={busy}
              run={run}
              attempt={attempt}
              escrow={escrow}
            />
          ) : (
            <div className={styles.empty}>
              Loading order #{view.id}… If it does not appear, it belongs to a
              different phone.
            </div>
          )}
          {walletStrip}
        </>
      )}

      {/* ---------------------------------------------------- product page */}
      {view.kind === "item" && item && (
        <>
          <button className={styles.back} onClick={() => window.history.back()}>
            ← {search ? "Back to results" : "Back"}
          </button>
          <article className={styles.detail}>
            <div className={styles.detailImg}>
              <Image src={item.image} alt={item.name} width={720} height={540} sizes="(max-width: 900px) 100vw, 560px" priority />
              <span className={styles.productCat}>{item.category}</span>
            </div>
            <div className={styles.detailBody}>
              <span className={styles.wantedTag}>{search ? `You asked for “${search.q}”` : "Request"}</span>
              <p className={styles.detailWanted}>&ldquo;{item.wanted}&rdquo;</p>

              <div className={styles.detailBid}>
                <span className={styles.bidLabel}>
                  Best bid · {LIVE_SHOP_NAME} · {short(activeShop)}
                </span>
                <h2 className={styles.detailName}>{item.name}</h2>
                <p className={styles.bidNote}>{item.bidNote}</p>
                <span className={styles.detailPrice}>
                  ₦{item.naira.toLocaleString("en-NG")}{" "}
                  <span className={styles.xlm}>({item.price.toLocaleString("en-NG")} {TOKEN_SYMBOL})</span>
                </span>
              </div>

              {/* Display-only: these shops have no wallet behind them. */}
              <div className={styles.otherBids}>
                <span className={styles.roleLabel}>Other bids on this request</span>
                <ul>
                  {bidsFor(item)
                    .filter((b) => !b.live)
                    .map((b) => (
                      <li key={b.shop}>
                        <span>
                          {b.shop} <span className={styles.bidMeta}>· {b.area} · {b.km} km · {b.rating}★</span>
                        </span>
                        <span className={styles.otherPrice}>₦{b.naira.toLocaleString("en-NG")}</span>
                      </li>
                    ))}
                </ul>
                <span className={styles.tinyNote}>Demo listings, shown for comparison. Only {LIVE_SHOP_NAME} can be paid.</span>
              </div>

              <ol className={styles.explain}>
                <li>Your ₦{item.naira.toLocaleString("en-NG")} ({item.price.toLocaleString("en-NG")} {TOKEN_SYMBOL}) goes into the escrow contract, not to the shop.</li>
                <li>The shop has {formatClock(TIMERS[timers].delivery)} to deliver, or you can take a full refund.</li>
                <li>Once delivered you have {formatClock(TIMERS[timers].inspection)} to confirm or dispute. Silence pays the shop.</li>
              </ol>

              <label className={styles.timerPick}>
                <span className={styles.srOnly}>Demo timers</span>
                <select value={timers} onChange={(e) => setTimers(e.target.value as TimerKey)}>
                  {Object.entries(TIMERS).map(([k, t]) => (
                    <option key={k} value={k}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>

              {itemFilled ? (
                <div className={styles.filledNote}>
                  <p>You already have an order for this.</p>
                  <button
                    className={styles.btnPrimary}
                    onClick={() => itemOrder && go({ kind: "order", id: itemOrder.id.toString() }, true)}
                  >
                    Open order #{itemOrder?.id.toString()}
                  </button>
                </div>
              ) : (
                <button className={`${styles.btnPrimary} ${styles.btnBig}`} onClick={() => acceptBid(item)} disabled={!!busy}>
                  {busy === `buy:${item.id}` ? "Locking payment in escrow…" : `Accept bid & pay ₦${item.naira.toLocaleString("en-NG")} into escrow`}
                </button>
              )}
            </div>
          </article>
          {walletStrip}
        </>
      )}

      {/* ---------------------------------------------------- buyer home */}
      {(view.kind === "list" || (view.kind === "item" && !item)) && role === "buying" && (
        <>
          <ShopBar
            shop={activeShop}
            own={activeShop === wallets.seller}
            fromLink={shopFromLink}
            onChange={chooseShop}
            onSell={() => chooseRole("selling")}
          />

          {myOrders.length > 0 && (
            <OrderRows title="Your orders" deals={myOrders} side="buyer" now={now} onOpen={(id) => go({ kind: "order", id })} />
          )}

          <SearchPanel
            key={search ? requestKey(search) : "empty"}
            initial={search}
            instant={search !== null && scanned === requestKey(search)}
            liveShopAddress={short(activeShop)}
            orderForItem={orderForItem}
            onSearch={(r) => {
              setSearch(r);
              /* Replace, not push: each new request should not pile up in Back. */
              window.history.replaceState(null, "", urlFor({ kind: "list" }, undefined, r));
            }}
            onComplete={(r) => setScanned(requestKey(r))}
            onOpenItem={(id) => go({ kind: "item", id })}
            onOpenOrder={(id) => go({ kind: "order", id })}
          />
          {walletStrip}
        </>
      )}

      {/* ---------------------------------------------------- seller home */}
      {(view.kind === "list" || (view.kind === "item" && !item)) && role === "selling" && (
        <>
          {walletStrip}
          <section className={styles.shopCard} aria-label="Your shop">
            <ShopQr link={shopLink} />
            <div className={styles.shopCopy}>
              <span className={styles.tag}>Your shop · {LIVE_SHOP_NAME} · {short(wallets.seller)}</span>
              <h2 className={styles.h3}>Let a buyer scan this</h2>
              <p className={styles.small}>
                They point their phone camera at the code, open the link, and
                see your winning bids. When they pay, the order lands below and
                the money waits in escrow until you deliver.
              </p>
              <CopyLink link={shopLink} />
            </div>
          </section>

          {myShopOrders.length > 0 ? (
            <OrderRows title="Incoming orders" deals={myShopOrders} side="seller" now={now} onOpen={(id) => go({ kind: "order", id })} />
          ) : (
            <section className={styles.deals} aria-label="Incoming orders">
              <h2 className={styles.h3}>Incoming orders</h2>
              <div className={styles.empty}>Waiting for orders. This page checks the ledger every few seconds.</div>
            </section>
          )}
        </>
      )}

      <p className={styles.currencyNote}>
        <strong>Prices are in naira.</strong> Testnet cannot hold naira, so
        each deal locks free test XLM at a demo rate of ₦{NAIRA_PER_TEST_XLM.toLocaleString("en-NG")} = 1
        XLM (a stand-in, not a market price). In production the same contract
        holds NGNC, a naira token pegged 1:1, so nothing is converted.{" "}
        <a href="/pitch#naira">How naira works on Stellar</a>
      </p>

      {log.length > 0 && (
        <section className={styles.panel} aria-label="Activity">
          <h2 className={styles.h3}>Activity</h2>
          <ol className={styles.log}>
            {log.map((entry) => (
              <li key={entry.id} className={styles[`log_${entry.tone}`]}>
                <span className={styles.logTime}>
                  {new Date(entry.at).toLocaleTimeString("en-NG", { hour12: false })}
                </span>
                <span className={styles.logText}>{entry.text}</span>
                {entry.receipt?.id && (
                  <a className={styles.logLink} href={entry.receipt.url} target="_blank" rel="noreferrer">
                    View on ledger ↗
                  </a>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <p className={styles.tiny}>
        <button className={styles.textButton} onClick={resetWallets} disabled={!!busy}>
          Start over with new wallets
        </button>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------- pieces

function WalletCard(props: { role: string; note: string; address: string; balance?: bigint; contract?: boolean }) {
  const href = `${EXPLORER_URL}/${props.contract ? "contract" : "account"}/${props.address}`;
  return (
    <div className={`${styles.wallet} ${props.contract ? styles.walletContract : ""}`}>
      <span className={styles.walletRole}>{props.role}</span>
      <span className={styles.walletBalance}>
        {props.balance === undefined ? "…" : naira(props.balance)}
      </span>
      {props.balance !== undefined && (
        <span className={styles.walletXlm}>
          ({formatAmount(props.balance)} test {TOKEN_SYMBOL})
        </span>
      )}
      <span className={styles.walletMeta}>
        {props.note} ·{" "}
        <a href={href} target="_blank" rel="noreferrer" className={styles.mono}>
          {short(props.address)}
        </a>
      </span>
    </div>
  );
}

function ShopBar(props: {
  shop: string;
  own: boolean;
  fromLink: boolean;
  onChange: (shop: string | null) => void;
  onSell: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const parsed = parseShop(value);
    if (!parsed) {
      setError("That is not a shop link or a Stellar address.");
      return;
    }
    props.onChange(parsed);
    setEditing(false);
    setValue("");
    setError(null);
  }

  return (
    <section className={styles.shopBar} aria-label="Shop">
      <div className={styles.shopBarMain}>
        <span className={styles.roleLabel}>Buying from</span>
        <span className={styles.shopName}>
          {LIVE_SHOP_NAME} <span className={styles.mono}>· {short(props.shop)}</span>
        </span>
        <span className={styles.shopHint}>
          {props.own
            ? "Your own test shop. For the real thing, scan someone else's shop code."
            : props.fromLink
              ? "From the shop code you scanned."
              : "A shop you chose earlier."}
        </span>
      </div>
      <div className={styles.roleButtons}>
        {!props.own && (
          <button className={styles.btnGhost} onClick={() => props.onChange(null)}>
            Use my own shop
          </button>
        )}
        <button className={styles.btnGhost} onClick={() => setEditing((v) => !v)}>
          Paste a shop link
        </button>
        {props.own && (
          <button className={styles.btnGhost} onClick={props.onSell}>
            Show my shop code
          </button>
        )}
      </div>
      {editing && (
        <div className={styles.pasteRow}>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="https://bidazk.xyz/demo?shop=G…"
            aria-label="Shop link or address"
          />
          <button className={styles.btnPrimary} onClick={submit}>
            Use shop
          </button>
          {error && <span className={styles.fieldError}>{error}</span>}
        </div>
      )}
    </section>
  );
}

function ShopQr({ link }: { link: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(link, { margin: 1, width: 480, color: { dark: "#001e00", light: "#ffffff" } })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(null));
    return () => {
      alive = false;
    };
  }, [link]);
  return (
    <div className={styles.qr}>
      {src ? (
        // A data URL generated in the browser; next/image adds nothing here.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="QR code linking to your shop" width={240} height={240} />
      ) : (
        <span className={styles.small}>Drawing code…</span>
      )}
    </div>
  );
}

function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* Clipboard blocked: the link is visible to copy by hand. */
    }
  }
  return (
    <div className={styles.linkRow}>
      <code className={styles.linkText}>{link}</code>
      <button className={styles.btnGhost} onClick={copy}>
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

/* What the clock is counting down to right now, from the ledger's numbers. */
function countdownFor(deal: Deal, now: number): { label: string; secs: number } | null {
  if (deal.status === "Funded") return { label: "Shop must deliver within", secs: deal.deliveryDeadline - now };
  if (deal.status === "Delivered")
    return { label: "Buyer's inspection ends in", secs: deal.deliveredAt + deal.inspectionPeriod - now };
  return null;
}

function OrderRows(props: { title: string; deals: Deal[]; side: Side; now: number; onOpen: (id: string) => void }) {
  return (
    <section className={styles.deals} aria-label={props.title}>
      <h2 className={styles.h3}>{props.title}</h2>
      <ul className={styles.rows}>
        {props.deals.map((d) => {
          const item = catalogItem(d.itemId);
          const status = STATUS[d.status];
          const clock = countdownFor(d, props.now);
          return (
            <li key={d.id.toString()}>
              <button className={styles.row} onClick={() => props.onOpen(d.id.toString())}>
                {item && <Image className={styles.rowThumb} src={item.image} alt="" width={96} height={72} />}
                <span className={styles.rowMain}>
                  <span className={styles.dealId}>
                    Order #{d.id.toString()} · {props.side === "buyer" ? `${LIVE_SHOP_NAME} ${short(d.seller)}` : `buyer ${short(d.buyer)}`}
                  </span>
                  <span className={styles.rowName}>{item?.name ?? `Item #${d.itemId}`}</span>
                  <span className={`${styles.chip} ${status.tone}`}>
                    <span aria-hidden="true">{status.icon}</span> {status.label}
                    {clock && clock.secs > 0 && <span className={styles.mono}> · {formatClock(clock.secs)}</span>}
                  </span>
                </span>
                <span className={styles.rowRight}>
                  <span className={styles.rowAmount}>
                    {naira(d.amount)}
                    <span className={styles.xlm}>({formatAmount(d.amount)} {TOKEN_SYMBOL})</span>
                  </span>
                  <span className={styles.rowGo}>Open →</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type StepState = "done" | "current" | "alert" | "upcoming" | "skipped";
type Step = { title: string; detail: string; state: StepState; at?: number };

/* Each step is marked done only once the ledger shows it happened. The step
   being waited on reads as waiting, never as done. */
function timelineFor(deal: Deal, amount: string): Step[] {
  const delivered = deal.deliveredAt > 0;
  const terminal = TERMINAL_STATUSES.includes(deal.status);

  const paid: Step = { title: "Payment held in escrow", detail: `${amount} locked in the contract.`, state: "done", at: deal.createdAt };

  let delivery: Step;
  if (delivered) delivery = { title: "Shop marked it delivered", detail: "The buyer's inspection window started.", state: "done", at: deal.deliveredAt };
  else if (deal.status === "Funded") delivery = { title: "Waiting for the shop to deliver", detail: "Until the deadline, the buyer cannot pull the money back.", state: "current" };
  else delivery = { title: "Not delivered", detail: deal.status === "Released" ? "The buyer confirmed before delivery was marked." : "The order closed without a delivery.", state: "skipped" };

  let inspection: Step;
  if (deal.status === "Delivered") inspection = { title: "Buyer inspecting", detail: "Confirm, dispute, or stay silent and the shop is paid.", state: "current" };
  else if (deal.status === "Disputed") inspection = { title: "Disputed: waiting for the referee", detail: "The money is frozen. Only the referee can settle it.", state: "alert" };
  else if (delivered && terminal) inspection = { title: "Inspection finished", detail: deal.status === "Resolved" ? "The buyer disputed." : "No dispute was raised.", state: "done" };
  else if (!delivered && terminal) inspection = { title: "No inspection", detail: "Nothing was delivered to inspect.", state: "skipped" };
  else inspection = { title: "Buyer inspects", detail: "Starts once the shop marks it delivered.", state: "upcoming" };

  let settled: Step;
  const refund = money(deal.buyerRefund);
  const rest = money(deal.amount - deal.buyerRefund);
  if (deal.status === "Released") settled = { title: "Settled: shop paid", detail: `The shop received ${amount}.`, state: "done" };
  else if (deal.status === "Refunded") settled = { title: "Settled: buyer refunded", detail: `The buyer got back ${amount}.`, state: "done" };
  else if (deal.status === "Cancelled") settled = { title: "Settled: shop cancelled", detail: `The buyer got back ${amount}.`, state: "done" };
  else if (deal.status === "Resolved") settled = { title: "Settled by the referee", detail: `Buyer ${refund}, shop ${rest}.`, state: "done" };
  else settled = { title: "Settlement", detail: "Not yet. The money is still held in escrow.", state: "upcoming" };

  return [paid, delivery, inspection, settled];
}

function OrderPage({
  deal,
  side,
  signer,
  arbiter,
  now,
  busy,
  run,
  attempt,
  escrow,
}: {
  deal: Deal;
  side: Side;
  signer: string;
  arbiter: string;
  now: number;
  busy: string | null;
  run: Runner;
  attempt: Runner;
  escrow: DemoWallets["escrow"];
}) {
  const [share, setShare] = useState(50);
  const id = deal.id;
  const key = (name: string) => `${id}:${name}`;
  const item = catalogItem(deal.itemId);
  const name = item?.name ?? `Item #${deal.itemId}`;
  const amount = money(deal.amount);
  const status = STATUS[deal.status];
  const terminal = TERMINAL_STATUSES.includes(deal.status);
  const buyer = side === "buyer";

  const clock = countdownFor(deal, now);
  /* Buttons wait out the ledger slack; the displayed clock does not. */
  const deadlineOpen = deal.deliveryDeadline + LEDGER_SLACK - now > 0;
  const inspectionOpen = deal.deliveredAt + deal.inspectionPeriod + LEDGER_SLACK - now > 0;
  const deadlineUnlocked = !deadlineOpen;
  const inspectionUnlocked = !inspectionOpen;
  const confirming = clock !== null && clock.secs <= 0 && clock.secs > -LEDGER_SLACK;

  let headline = "";
  if (deal.status === "Funded") {
    headline = deadlineUnlocked
      ? "The delivery deadline passed with no delivery. The buyer can now be refunded."
      : buyer
        ? "Your money is in escrow. The shop must deliver before the clock runs out, or you get a full refund."
        : "The buyer has paid into escrow. Deliver before the clock runs out, then mark it delivered.";
  } else if (deal.status === "Delivered") {
    headline = inspectionUnlocked
      ? "Inspection is over with no dispute. Payment can now be released to the shop."
      : buyer
        ? "The shop says it is delivered. Inspect it: confirm if it is right, dispute if it is not. If you stay silent, the shop is paid when the clock runs out."
        : "Marked delivered. The buyer is inspecting. If they stay silent, you are paid when the clock runs out.";
  } else if (deal.status === "Disputed") {
    headline = "The money is frozen. Only the Bidazk referee can settle it, and only between these two wallets.";
  } else {
    headline = "This order is closed for good. Nothing can reopen it or pay it out again.";
  }

  return (
    <article className={styles.order}>
      <header className={styles.orderHead}>
        {item && <Image className={styles.orderThumb} src={item.image} alt="" width={160} height={120} />}
        <div className={styles.orderTitle}>
          <span className={styles.dealId}>
            Order #{id.toString()} · you are the {buyer ? "buyer" : "shop"} ·{" "}
            {buyer ? `${LIVE_SHOP_NAME} ${short(deal.seller)}` : `buyer ${short(deal.buyer)}`}
          </span>
          <h2 className={styles.orderName}>{name}</h2>
          <span className={styles.orderAmount}>
            {naira(deal.amount)} <span className={styles.xlm}>({formatAmount(deal.amount)} {TOKEN_SYMBOL})</span>
          </span>
        </div>
        <span className={`${styles.chip} ${status.tone}`}>
          <span aria-hidden="true">{status.icon}</span> {status.label}
        </span>
      </header>

      {clock && (
        <div className={`${styles.timer} ${clock.secs <= 30 ? styles.timerLow : ""}`} role="timer" aria-live="off">
          <span className={styles.timerLabel}>{clock.label}</span>
          <span className={styles.timerValue}>{formatClock(clock.secs)}</span>
          {confirming && <span className={styles.timerNote}>Time is up. Confirming with the ledger…</span>}
        </div>
      )}

      <p className={styles.headline}>{headline}</p>

      <ol className={styles.timeline}>
        {timelineFor(deal, amount).map((s, i) => (
          <li key={i} className={styles[`tl_${s.state}`]}>
            <span className={styles.tlMark} aria-hidden="true">
              {s.state === "done" ? "✓" : s.state === "alert" ? "!" : s.state === "skipped" ? "–" : i + 1}
            </span>
            <span className={styles.tlBody}>
              <span className={styles.tlTitle}>
                {s.title}
                {s.at ? <span className={styles.tlAt}> · {formatTime(s.at)}</span> : null}
              </span>
              <span className={styles.tlDetail}>{s.detail}</span>
            </span>
          </li>
        ))}
      </ol>

      {!terminal && (
        <div className={styles.actions}>
          {buyer && deal.status === "Funded" && (
            <Group label="You">
              <Btn busy={busy} k={key("confirm")} label="I have it, pay the shop"
                onClick={() => run(key("confirm"), `You confirmed "${name}". Shop paid ${amount}.`, () => escrow.confirm(id, signer))} />
              {deadlineUnlocked && (
                <Btn busy={busy} k={key("refund")} label="Refund me" kind="primary"
                  onClick={() => run(key("refund"), `Deadline passed. You were refunded ${amount}.`, () => escrow.claimRefund(id, signer))} />
              )}
            </Group>
          )}

          {buyer && deal.status === "Delivered" && (
            <Group label="You">
              <Btn busy={busy} k={key("confirm")} label="Happy, pay the shop" kind="primary"
                onClick={() => run(key("confirm"), `You confirmed "${name}". Shop paid ${amount}.`, () => escrow.confirm(id, signer))} />
              {inspectionOpen ? (
                <Btn busy={busy} k={key("dispute")} label="Wrong item, dispute" kind="danger"
                  onClick={() => run(key("dispute"), `You disputed "${name}". Money frozen for the referee.`, () => escrow.dispute(id, signer))} />
              ) : (
                <Btn busy={busy} k={key("release")} label="Release to shop"
                  onClick={() => run(key("release"), `Inspection over. Shop paid ${amount}.`, () => escrow.claimRelease(id, signer))} />
              )}
            </Group>
          )}

          {!buyer && deal.status === "Funded" && (
            <Group label="You">
              <Btn busy={busy} k={key("deliver")} label="Mark as delivered" kind="primary" disabled={!deadlineOpen}
                onClick={() => run(key("deliver"), `You marked "${name}" delivered. The buyer's inspection window started.`, () => escrow.markDelivered(id, signer))} />
              <Btn busy={busy} k={key("cancel")} label="Cancel, out of stock"
                onClick={() => run(key("cancel"), `You cancelled. The buyer was refunded ${amount}.`, () => escrow.cancel(id, signer))} />
              {deadlineUnlocked && (
                <Btn busy={busy} k={key("refund")} label="Refund the buyer"
                  onClick={() => run(key("refund"), `Deadline passed. Buyer refunded ${amount}.`, () => escrow.claimRefund(id, signer))} />
              )}
            </Group>
          )}

          {!buyer && deal.status === "Delivered" && (
            <Group label="You">
              {inspectionUnlocked ? (
                <Btn busy={busy} k={key("release")} label="Collect payment" kind="primary"
                  onClick={() => run(key("release"), `The buyer stayed silent. You were paid ${amount}.`, () => escrow.claimRelease(id, signer))} />
              ) : (
                <span className={styles.small}>Nothing to do until the buyer answers or the clock runs out.</span>
              )}
            </Group>
          )}

          {buyer && deal.status === "Disputed" && (
            <Group label="You">
              <span className={styles.small}>
                Bidazk&apos;s referee is reviewing your dispute. The outcome will appear here.
              </span>
            </Group>
          )}

          {!buyer && deal.status === "Disputed" && (
            <Group label="You">
              <span className={styles.small}>
                The buyer disputed this order. You cannot release the money; the referee decides.
              </span>
            </Group>
          )}
        </div>
      )}

      {/* The referee is neither party. It sits on the presenter's (shop) screen
          only so the demo can be settled on stage, boxed apart so nobody reads
          it as the shop judging its own dispute. Never shown to the buyer. */}
      {!buyer && deal.status === "Disputed" && (
        <section className={styles.referee} aria-label="Bidazk referee console">
          <span className={styles.refereeTag}>Bidazk referee console</span>
          <p className={styles.refereeNote}>
            In production this is a Bidazk staff screen, not the shop&apos;s. It
            can only split this payment between this buyer and this shop.
          </p>
          <label className={styles.share}>
            <span>
              Refund buyer <strong className={styles.mono}>{share}%</strong> · shop keeps{" "}
              <strong className={styles.mono}>{100 - share}%</strong>
            </span>
            <input type="range" min={0} max={100} step={5} value={share} onChange={(e) => setShare(Number(e.target.value))} />
          </label>
          <Btn busy={busy} k={key("resolve")} label="Settle dispute" kind="primary"
            onClick={() => {
              const buyerShare = (deal.amount * BigInt(share)) / BigInt(100);
              run(key("resolve"), `Referee settled "${name}": buyer ${money(buyerShare)}, shop ${money(deal.amount - buyerShare)}.`, () =>
                escrow.resolve(id, buyerShare, arbiter),
              );
            }} />
        </section>
      )}

      {/* Each of these breaks a rule on purpose. The contract must refuse. */}
      <details className={styles.cheat}>
        <summary>Try to cheat</summary>
        <div className={styles.cheatRow}>
          {buyer && deal.status === "Funded" && deadlineOpen && (
            <CheatBtn busy={busy} k={key("x-early")} label="Grab my money back mid-delivery"
              onClick={() => attempt(key("x-early"), "You tried to take the money back before the deadline", () => escrow.claimRefund(id, signer))} />
          )}
          {buyer && deal.status === "Delivered" && (
            <CheatBtn busy={busy} k={key("x-norefund")} label={`Claim it "never arrived"`}
              onClick={() => attempt(key("x-norefund"), "You tried to claim a refund after delivery", () => escrow.claimRefund(id, signer))} />
          )}
          {!buyer && deal.status === "Funded" && (
            <CheatBtn busy={busy} k={key("x-selfpay")} label="Confirm my own payment"
              onClick={() => attempt(key("x-selfpay"), "You tried to confirm your own payment as the shop", () => escrow.confirm(id, signer))} />
          )}
          {!buyer && deal.status === "Delivered" && inspectionOpen && (
            <CheatBtn busy={busy} k={key("x-rush")} label="Grab payment before inspection ends"
              onClick={() => attempt(key("x-rush"), "You tried to take payment during the buyer's inspection", () => escrow.claimRelease(id, signer))} />
          )}
          {!buyer && deal.status === "Disputed" && (
            <CheatBtn busy={busy} k={key("x-frozen")} label="Release the frozen money to me"
              onClick={() => attempt(key("x-frozen"), "You tried to release disputed money", () => escrow.claimRelease(id, signer))} />
          )}
          {terminal && (
            <CheatBtn busy={busy} k={key("x-twice")} label="Pay this out a second time"
              onClick={() => attempt(key("x-twice"), "You tried to pay this order out twice", () =>
                buyer ? escrow.confirm(id, signer) : escrow.claimRelease(id, signer),
              )} />
          )}
          {buyer && deal.status === "Disputed" && (
            <span className={styles.small}>Nothing to try: frozen money only moves when the referee decides.</span>
          )}
          {buyer && deal.status === "Funded" && !deadlineOpen && (
            <span className={styles.small}>Nothing to try: the refund is legitimately yours now.</span>
          )}
          {!buyer && deal.status === "Delivered" && !inspectionOpen && (
            <span className={styles.small}>Nothing to try: payment is legitimately yours to collect now.</span>
          )}
        </div>
      </details>
    </article>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.roleGroup}>
      <span className={styles.roleLabel}>{label}</span>
      <div className={styles.roleButtons}>{children}</div>
    </div>
  );
}

function Btn(p: {
  busy: string | null;
  k: string;
  label: string;
  onClick: () => void;
  kind?: "primary" | "ghost" | "danger";
  disabled?: boolean;
}) {
  const cls = p.kind === "primary" ? styles.btnPrimary : p.kind === "danger" ? styles.btnDanger : styles.btnGhost;
  return (
    <button className={cls} onClick={p.onClick} disabled={!!p.busy || p.disabled}>
      {p.busy === p.k ? "Sending…" : p.label}
    </button>
  );
}

function CheatBtn(p: { busy: string | null; k: string; label: string; onClick: () => void }) {
  return (
    <button className={styles.btnCheat} onClick={p.onClick} disabled={!!p.busy}>
      {p.busy === p.k ? "Trying…" : p.label}
    </button>
  );
}
