import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">
              OutreachForge
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/pricing"
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Pricing
            </Link>
            <ModeToggle />
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/login" />}>
              Sign in
            </Button>
            <Button size="sm" nativeButton={false} render={<Link href="/signup" />}>
              Start free trial
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm font-semibold">OutreachForge</p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} OutreachForge. Built for founders
              selling where others don&apos;t look.
            </p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
