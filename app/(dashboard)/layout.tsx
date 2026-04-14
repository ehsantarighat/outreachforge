import Link from "next/link";
import { redirect } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import { LayoutDashboard, Settings, CreditCard, List } from "lucide-react";
import { getQueueCount } from "@/app/actions/queue";
import { FeedbackWidget } from "@/components/feedback-widget";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const queueCount = await getQueueCount();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight">
            OutreachForge
          </Link>
          <nav className="flex flex-1 items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/dashboard" />}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/queue" />}
              className="relative"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Queue</span>
              {queueCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {queueCount > 9 ? "9+" : queueCount}
                </span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/settings" />}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/billing" />}
            >
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Billing</span>
            </Button>
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:block">
              {user.email}
            </span>
            <ModeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 px-4 py-8 sm:px-6">{children}</main>
      <FeedbackWidget />
    </div>
  );
}
