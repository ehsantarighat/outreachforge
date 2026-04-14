import Link from "next/link";

export const metadata = {
  title: "Terms of Service — OutreachForge",
};

export default function TermsPage() {
  const updated = "April 14, 2026";
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 space-y-8">
      <div>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to home
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated: {updated}</p>
      </div>

      <Prose>
        <h2>1. Agreement</h2>
        <p>
          By creating an account or using OutreachForge (&ldquo;Service&rdquo;), you agree to these
          Terms. If you do not agree, do not use the Service.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          OutreachForge is an AI-assisted research and drafting tool for B2B outreach. It helps
          users write personalised cold emails and LinkedIn messages. The Service does not automate
          sending on LinkedIn and does not guarantee any business outcomes.
        </p>

        <h2>3. Acceptable use</h2>
        <p>You agree not to use the Service to:</p>
        <ul>
          <li>Violate any applicable law, regulation, or third-party terms of service.</li>
          <li>
            Automate or scrape LinkedIn in any way. The LinkedIn manual-send queue is a copy-paste
            workflow only — you are responsible for all actions taken on your LinkedIn account.
          </li>
          <li>Send spam or unsolicited bulk email.</li>
          <li>
            Harvest or process personal data of individuals without a lawful basis under applicable
            privacy law (GDPR, CAN-SPAM, CASL, etc.).
          </li>
          <li>Attempt to reverse-engineer, decompile, or interfere with the Service.</li>
        </ul>

        <h2>4. LinkedIn — explicit disclaimer</h2>
        <p>
          OutreachForge does <strong>not</strong> control, access, or automate your LinkedIn
          account. We do not send LinkedIn messages automatically. Using this tool does not violate
          LinkedIn&apos;s User Agreement in and of itself, but you are solely responsible for how you
          use the messages we help you draft, and for complying with LinkedIn&apos;s terms at all times.
        </p>

        <h2>5. Subscriptions and billing</h2>
        <p>
          Paid plans are billed monthly or annually via Stripe. Subscriptions renew automatically
          until cancelled. You can cancel at any time via the billing portal. No refunds are issued
          for partial billing periods unless required by applicable law.
        </p>
        <p>
          We reserve the right to change pricing with 30 days&apos; notice. Price changes will not affect
          your current billing period.
        </p>

        <h2>6. AI-generated content</h2>
        <p>
          The Service uses the Anthropic Claude API to generate research dossiers and draft
          messages. AI output may be inaccurate, incomplete, or inappropriate. You are solely
          responsible for reviewing, editing, and approving all content before sending it.
          OutreachForge is not liable for any harm caused by AI-generated content.
        </p>

        <h2>7. Gmail integration</h2>
        <p>
          By connecting your Gmail account, you authorise OutreachForge to send emails on your
          behalf using the Gmail API. We will only send emails you explicitly approve. You can
          revoke access at any time from your Google Account settings or from OutreachForge
          Settings.
        </p>

        <h2>8. Intellectual property</h2>
        <p>
          You retain ownership of all data you upload. You grant us a limited licence to process
          your data to provide the Service. We retain ownership of the Service, its code, and its
          design.
        </p>

        <h2>9. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, OutreachForge&apos;s total liability for any claim
          arising from use of the Service is limited to the amount you paid us in the three months
          preceding the claim. We are not liable for indirect, incidental, or consequential damages.
        </p>

        <h2>10. Termination</h2>
        <p>
          We may suspend or terminate your account for violation of these Terms, with or without
          notice. You may delete your account at any time. Termination does not entitle you to a
          refund.
        </p>

        <h2>11. Governing law</h2>
        <p>
          These Terms are governed by the laws of the jurisdiction in which OutreachForge is
          registered. Disputes will be resolved through binding arbitration or in the courts of that
          jurisdiction.
        </p>

        <h2>12. Contact</h2>
        <p>
          Questions about these Terms:{" "}
          <a href="mailto:legal@outreachforge.com">legal@outreachforge.com</a>
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
