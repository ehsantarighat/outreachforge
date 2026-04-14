import type { NextConfig } from "next";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default withSentryConfig(nextConfig, {
  // Suppress Sentry CLI output during builds
  silent: true,
  // Automatically tree-shake Sentry logger statements
  disableLogger: true,
  // Upload source maps only in CI / production builds
  sourcemaps: {
    disable: process.env.NODE_ENV !== "production",
  },
});
