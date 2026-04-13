"use client";

import { useTransition, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { saveProfile, saveAnthropicKey, testAnthropicKey, disconnectGmail } from "@/app/actions/settings";
import { CheckCircle, XCircle, Loader2, Mail, Key, User } from "lucide-react";

interface Settings {
  email: string;
  default_sender_name: string;
  default_signature: string;
  has_anthropic_key: boolean;
  gmail_email: string | null;
}

export function SettingsClient({ settings }: { settings: Settings }) {
  const searchParams = useSearchParams();
  const gmailParam = searchParams.get("gmail");
  const errorParam = searchParams.get("error");

  return (
    <div className="space-y-6">
      {gmailParam === "connected" && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Gmail connected successfully.
        </div>
      )}
      {errorParam && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <XCircle className="h-4 w-4 shrink-0" />
          {errorParam === "gmail_denied" && "Gmail connection was cancelled."}
          {errorParam === "gmail_no_refresh_token" && "No refresh token returned. Try disconnecting and reconnecting."}
          {errorParam === "gmail_failed" && "Gmail connection failed. Please try again."}
        </div>
      )}

      <ProfileSection settings={settings} />
      <Separator />
      <AnthropicSection hasKey={settings.has_anthropic_key} />
      <Separator />
      <GmailSection gmailEmail={settings.gmail_email} />
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────

function ProfileSection({ settings }: { settings: Settings }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setResult(null);
    startTransition(async () => {
      const res = await saveProfile(formData);
      setResult(res);
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Profile</CardTitle>
        </div>
        <CardDescription>
          Your display name and default email signature.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={settings.email} disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="default_sender_name">Sender name</Label>
            <Input
              id="default_sender_name"
              name="default_sender_name"
              defaultValue={settings.default_sender_name}
              placeholder="e.g. Alex from OutreachForge"
            />
            <p className="text-xs text-muted-foreground">
              Used as the From name on emails sent via Gmail.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="default_signature">Default signature</Label>
            <Textarea
              id="default_signature"
              name="default_signature"
              defaultValue={settings.default_signature}
              placeholder={"Best,\nAlex\nhttps://yoursite.com"}
              rows={4}
            />
          </div>
          {result?.error && (
            <p className="text-sm text-red-600">{result.error}</p>
          )}
          {result?.success && (
            <p className="text-sm text-green-600">Profile saved.</p>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Anthropic API key ────────────────────────────────────────────────────────

function AnthropicSection({ hasKey }: { hasKey: boolean }) {
  const [isSaving, startSave] = useTransition();
  const [isTesting, startTest] = useTransition();
  const [saveResult, setSaveResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const [testResult, setTestResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const [showInput, setShowInput] = useState(!hasKey);

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSaveResult(null);
    setTestResult(null);
    startSave(async () => {
      const res = await saveAnthropicKey(formData);
      setSaveResult(res);
      if (res.success) setShowInput(false);
    });
  }

  function handleTest() {
    setTestResult(null);
    startTest(async () => {
      const res = await testAnthropicKey();
      setTestResult(res);
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Anthropic API Key</CardTitle>
        </div>
        <CardDescription>
          Your key is used to run research and drafting. It is encrypted at rest
          and never logged.{" "}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            Get a key →
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasKey && !showInput ? (
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Saved</Badge>
              <span className="text-sm text-muted-foreground">sk-ant-••••••••</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowInput(true)}>
              Replace
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="anthropic_api_key">API key</Label>
              <Input
                id="anthropic_api_key"
                name="anthropic_api_key"
                type="password"
                placeholder="sk-ant-..."
                autoComplete="off"
                required
              />
            </div>
            {saveResult?.error && (
              <p className="text-sm text-red-600">{saveResult.error}</p>
            )}
            {saveResult?.success && (
              <p className="text-sm text-green-600">Key saved.</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save key
              </Button>
              {hasKey && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowInput(false)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        )}

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={isTesting || !hasKey}
          >
            {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Test connection
          </Button>
          {testResult?.success && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" /> Connected
            </span>
          )}
          {testResult?.error && (
            <span className="flex items-center gap-1.5 text-sm text-red-600">
              <XCircle className="h-4 w-4" /> {testResult.error}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Gmail ────────────────────────────────────────────────────────────────────

function GmailSection({ gmailEmail }: { gmailEmail: string | null }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDisconnect() {
    setError(null);
    startTransition(async () => {
      const res = await disconnectGmail();
      if (res.error) setError(res.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Gmail</CardTitle>
        </div>
        <CardDescription>
          Connect your Gmail account to send outreach emails directly from your
          inbox.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {gmailEmail ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Connected
                </Badge>
                <span className="text-sm">{gmailEmail}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Disconnect
              </Button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You&apos;ll be asked to grant OutreachForge permission to send and
              read emails on your behalf. We only access threads we sent.
            </p>
            <Button nativeButton={false} render={<a href="/api/auth/gmail" />}>
              Connect Gmail
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
