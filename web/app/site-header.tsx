import Link from "next/link";
import styles from "./site.module.css";

/* Slim header for inner pages. The landing page keeps its own two-bar
   header; this one only has to get people home and between the escrow pages. */
export default function SiteHeader({ current }: { current?: "pitch" | "how" | "demo" }) {
  return (
    <header className={styles.header}>
      <div className={`${styles.inner} ${styles.headerInner}`}>
        <Link className={styles.brand} href="/">
          Bidazk<span className={styles.brandDot}>.</span>
        </Link>
        <nav className={styles.links}>
          <Link
            className={styles.link}
            href="/pitch"
            aria-current={current === "pitch" ? "page" : undefined}
          >
            Pitch
          </Link>
          <Link
            className={styles.link}
            href="/how-it-works"
            aria-current={current === "how" ? "page" : undefined}
          >
            How it works
          </Link>
          <Link
            className={styles.link}
            href="/demo"
            aria-current={current === "demo" ? "page" : undefined}
          >
            Live demo
          </Link>
        </nav>
        <span className={styles.spacer} />
        <Link className={styles.cta} href="/demo">
          Try the demo
        </Link>
      </div>
    </header>
  );
}
