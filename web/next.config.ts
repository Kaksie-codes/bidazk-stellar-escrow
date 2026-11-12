import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Static export: emits plain HTML to out/ so any static host serves the
     site for free. Valid only while every route is prerenderable — adding a
     server action, route handler, or dynamic render breaks the build, which
     is the signal to move to a host with a Next.js runtime. */
  output: "export",
  images: {
    /* Static export has no image optimizer, so images in /public are
       stored pre-sized. */
    unoptimized: true,
  },
};

export default nextConfig;
