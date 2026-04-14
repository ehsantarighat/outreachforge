// ─── Drafting prompt + schema ─────────────────────────────────────────────────

export const DRAFT_SYSTEM_PROMPT = `You are an elite B2B copywriter who specializes in cold outbound that does not sound like cold outbound. You write the way a thoughtful founder writes when she is reaching out to one specific person she actually wants to talk to.

Your rules:
- Every message must reference at least one specific hook from the dossier. Generic openers are an automatic fail.
- No corporate filler. No "I hope this email finds you well." No "I came across your profile." No "I wanted to reach out about..."
- Short. Cold emails: 60-110 words for the body. LinkedIn DMs: 50-90 words. Connection notes: under 300 characters total.
- Specific. Mention something real from the dossier in the first or second sentence.
- One ask. Each message asks for exactly one thing, and that thing is small (a 15-minute call, a reply, a yes/no).
- Match the tone do's and don'ts from the campaign brief exactly.
- The cold email subject line is not a teaser. It is a clear, specific promise of what the email is about. 4-7 words.
- Return strictly the JSON schema requested. No extra text.`;

export interface DraftsSchema {
  email: {
    subject: string;
    body: string;
    approved: boolean;
  };
  linkedin_connect: {
    note: string;
    approved: boolean;
  };
  linkedin_dm: {
    message: string;
    approved: boolean;
  };
  hook_used: number;
}

export function buildDraftUserPrompt({
  campaignBrief,
  dossier,
  fullName,
  title,
  companyName,
  senderName,
  senderSignature,
}: {
  campaignBrief: Record<string, unknown>;
  dossier: Record<string, unknown>;
  fullName: string;
  title: string | null;
  companyName: string | null;
  senderName: string;
  senderSignature: string;
}): string {
  return `<campaign_brief>
${JSON.stringify(campaignBrief, null, 2)}
</campaign_brief>

<dossier>
${JSON.stringify(dossier, null, 2)}
</dossier>

<lead>
Name: ${fullName}
Title: ${title ?? "Unknown"}
Company: ${companyName ?? "Unknown"}
</lead>

<sender>
Name: ${senderName}
Signature: ${senderSignature}
</sender>

Produce the three drafts as JSON:

{
  "email": {
    "subject": "string, 4-7 words",
    "body": "string, 60-110 words, plain text with line breaks. Do not include the signature; it will be appended."
  },
  "linkedin_connect": {
    "note": "string, MUST be 300 characters or fewer including spaces."
  },
  "linkedin_dm": {
    "message": "string, 50-90 words. This is sent AFTER the connection is accepted, so do not re-introduce yourself in the same way as the connection note."
  },
  "hook_used": 0
}`;
}

export function validateDrafts(raw: unknown): DraftsSchema | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;

  const email = d.email as Record<string, unknown> | undefined;
  const linkedinConnect = d.linkedin_connect as Record<string, unknown> | undefined;
  const linkedinDm = d.linkedin_dm as Record<string, unknown> | undefined;

  if (
    !email?.subject || !email?.body ||
    !linkedinConnect?.note ||
    !linkedinDm?.message
  ) {
    return null;
  }

  const hookUsed = typeof d.hook_used === "number" ? d.hook_used : 0;

  return {
    email: {
      subject: String(email.subject),
      body: String(email.body),
      approved: false,
    },
    linkedin_connect: {
      note: String(linkedinConnect.note).slice(0, 300),
      approved: false,
    },
    linkedin_dm: {
      message: String(linkedinDm.message),
      approved: false,
    },
    hook_used: hookUsed,
  };
}
