"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import styles from "./page.module.css";

type Side = "buying" | "selling";

/**
 * The dual-audience hero. One headline states the loop; this switch decides
 * which door the visitor walks through. Splitting the hero into two columns
 * would give neither side a real headline. This keeps one voice and two
 * entry points. It is also the natural seam for the animated hero later.
 */
export default function HeroSwitch() {
  const [side, setSide] = useState<Side>("buying");

  return (
    <div className={styles.switchWrap}>
      <div className={styles.segmented} role="tablist" aria-label="I am here to">
        <button
          type="button"
          role="tab"
          aria-selected={side === "buying"}
          className={`${styles.segment} ${
            side === "buying" ? styles.segmentActive : ""
          }`}
          onClick={() => setSide("buying")}
        >
          {side === "buying" ? (
            <motion.span layoutId="segment-pill" className={styles.segmentPill} />
          ) : null}
          <span className={styles.segmentLabel}>I&rsquo;m buying</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={side === "selling"}
          className={`${styles.segment} ${
            side === "selling" ? styles.segmentActive : ""
          }`}
          onClick={() => setSide("selling")}
        >
          {side === "selling" ? (
            <motion.span layoutId="segment-pill" className={styles.segmentPill} />
          ) : null}
          <span className={styles.segmentLabel}>I&rsquo;m selling</span>
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={side}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {side === "buying" ? (
        <div className={styles.composer}>
          <div className={styles.composerTop}>
            <span className={`${styles.tag} ${styles.composerTag}`}>I want</span>
            <input
              className={styles.composerInput}
              placeholder="Nike Air Force 1, size 43, white…"
              aria-label="What are you looking for?"
            />
          </div>
          <div className={styles.composerRow}>
            <span className={styles.field}>
              Budget
              <span className={`${styles.fieldValue} figure`}>₦85,000</span>
            </span>
            <span className={styles.field}>
              Within
              <span className={`${styles.fieldValue} figure`}>10 km</span>
            </span>
            <span className={styles.field}>
              Condition
              <span className={styles.fieldValue}>New</span>
            </span>
            <span className={styles.composerSpacer} />
            <button className={styles.btnPrimary} type="button">
              Get bids
            </button>
          </div>
          <p className={styles.switchNote}>
            Free to post. Your money sits in escrow until you confirm you got
            the item.
          </p>
        </div>
      ) : (
        <div className={styles.composer}>
          <div className={styles.composerTop}>
            <span className={`${styles.tag} ${styles.composerTag}`}>
              My shop
            </span>
            <input
              className={styles.composerInput}
              placeholder="Kunle Sports, Yaba…"
              aria-label="What is your shop called?"
            />
          </div>
          <div className={styles.composerRow}>
            <span className={styles.field}>
              I sell
              <span className={styles.fieldValue}>Footwear</span>
            </span>
            <span className={styles.field}>
              Location
              <span className={styles.fieldValue}>Lagos</span>
            </span>
            <span className={styles.field}>
              Min. profit
              <span className={`${styles.fieldValue} figure`}>20%</span>
            </span>
            <span className={styles.composerSpacer} />
            <button className={styles.btnPrimary} type="button">
              Start selling
            </button>
          </div>
          <p className={styles.switchNote}>
            Every tool is free: inventory, receipts, POS, your own store link.
            You only pay when a sale actually clears.
          </p>
        </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
