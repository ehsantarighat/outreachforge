import { PostHog } from "posthog-node";

let _client: PostHog | null = null;

function getPostHogClient(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null;
  if (!_client) {
    _client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return _client;
}

/**
 * Fire a server-side PostHog event.
 * Silently no-ops if NEXT_PUBLIC_POSTHOG_KEY is not set.
 */
export function trackEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  const client = getPostHogClient();
  if (!client) return;
  client.capture({ distinctId, event, properties });
}
