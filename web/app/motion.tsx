"use client";

import { motion, MotionConfig, type Variants } from "motion/react";
import type { ReactNode } from "react";

/* Motion primitives for the landing page.
   The rule here is restraint: one orchestrated moment in the hero, then a
   single quiet reveal pattern everywhere else. Scattered effects read as
   noise, and on a mid-tier Android they cost frames that matter more.

   MotionProvider sets reducedMotion="user", so every animation below is
   automatically disabled for anyone with that OS setting. */

const EASE = [0.22, 1, 0.36, 1] as const;

export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/* Entrance on page load. Used only in the hero, sequenced by delay. */
export function Intro({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/* The single scroll reveal used across every section. */
export function Reveal({
  children,
  className,
  delay = 0,
  id,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}) {
  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/* Grid and list containers whose children arrive one after another. */
export function Stagger({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.div
      id={id}
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}

/* Bid rows slide in from the left rather than up, so the feed reads as
   bids arriving one after another instead of a block fading in. */
export function SlideInRow({
  children,
  className,
  index = 0,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: -14 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{
        duration: 0.45,
        delay: 0.12 + index * 0.09,
        ease: EASE,
      }}
    >
      {children}
    </motion.div>
  );
}

/* Same as StaggerItem but keeps the <article> element for request cards. */
export function StaggerCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.article className={className} variants={item}>
      {children}
    </motion.article>
  );
}
