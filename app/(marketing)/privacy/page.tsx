import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — OutreachForge",
};

export default function PrivacyPage() {
  const updated = "April 14, 2026";
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 space-y-8">
      <div>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to home
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated: {updated}</p>
      </div>

      <Prose>
        <h2>1. Who we are</h2>
        <p>
          OutreachForge (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is a B2B outreach research and
          drafting tool. Our registered address and contact email is{" "}
          <a href="mailto:privacy@outreachforge.com">privacy@outreachforge.com</a>.
        </p>

        <h2>2. What data we collect</h2>
        <p>We collect and process the following categories of data:</p>
        <ul>
          <li>
            <strong>Account data:</strong> email address, password hash, and Google OAuth token (if
            you sign in with Google).
          </li>
          <li>
            <strong>Lead data:</strong> name, title, company, LinkedIn URL, email address, and any
            notes you enter about your prospects. This data is provided by you — we do not scrape
            LinkedIn or any external source on your behalf.
          </li>
          <li>
            <strong>Research outputs:</strong> AI-generated dossiers and draft messages created
            using the Anthropic Claude API on data you supply.
          </li>
          <li>
            <strong>Gmail OAuth credentials:</strong> a refresh token to send email on your behalf.
            The token is stored encrypted (AES-256-GCM) and is never shared with third parties
            beyond the Gmail API.
          </li>
          <li>
            <strong>Usage data:</strong> number of leads researched and emails sent, for
            subscription billing purposes.
          </li>
          <li>
            <strong>Error and analytics data:</strong> anonymised crash reports (Sentry) and product
            usage events (PostHog). No personally identifiable data is included in analytics events.
          </li>
        </ul>

        <h2>3. How we use your data</h2>
        <ul>
          <li>To provide the service: research, drafting, and email sending on your behalf.</li>
          <li>To enforce fair-use caps tied to your subscription plan.</li>
          <li>To send transactional emails (email confirmation, password reset).</li>
          <li>To debug errors and improve the product.</li>
        </ul>
        <p>We do not sell your data. We do not use your data to train AI models.</p>

        <h2>4. LinkedIn — no automation, no scraping</h2>
        <p>
          OutreachForge does <strong>not</strong> automate any action on LinkedIn. We do not scrape
          LinkedIn profiles, we do not send LinkedIn messages automatically, and we do not control a
          browser session on LinkedIn on your behalf. The LinkedIn Queue feature displays a
          pre-written message for you to copy and send manually. Your LinkedIn account is never
          touched by our servers.
        </p>

        <h2>5. Data retention</h2>
        <p>
          We retain your data for as long as your account is active. You can delete your account and
          all associated data at any time by emailing{" "}
          <a href="mailto:privacy@outreachforge.com">privacy@outreachforge.com</a>. We will process
          deletion requests within 30 days.
        </p>

        <h2>6. Third-party processors</h2>
        <ul>
          <li><strong>Supabase</strong> — database and authentication (EU region).</li>
          <li><strong>Anthropic</strong> — AI research and drafting (text only, no PII).</li>
          <li><strong>Resend</strong> — transactional email delivery.</li>
          <li><strong>Stripe</strong> — payment processing (we never store card numbers).</li>
          <li><strong>Sentry</strong> — error tracking.</li>
          <li><strong>PostHog</strong> — product analytics (self-hosted option available on request).</li>
          <li><strong>Tavily</strong> — web search for research (queries contain company names only).</li>
        </ul>

        <h2>7. Your rights</h2>
        <p>
          Depending on your jurisdiction you may have the right to access, rectify, or erase your
          personal data, and to object to or restrict processing. Contact{" "}
          <a href="mailto:privacy@outreachforge.com">privacy@outreachforge.com</a> to exercise any
          of these rights.
        </p>

        <h2>8. Changes</h2>
        <p>
          We will notify active users by email of any material changes to this policy at least 14
          days before they take effect.
        </p>
      </Prose>
    </div>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2 [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_a]:text-primary [&_strong]:text-foreground">
      {children}
    </div>
  );
}
