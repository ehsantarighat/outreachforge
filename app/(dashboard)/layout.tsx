import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Settings, CreditCard, List } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/queue", label: "Queue", icon: List },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/billing", label: "Billing", icon: CreditCard },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight">
            OutreachForge
          </Link>
          <nav className="flex flex-1 items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                size="sm"
                render={<Link href={item.href} />}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button variant="ghost" size="sm" render={<Link href="/login" />}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
