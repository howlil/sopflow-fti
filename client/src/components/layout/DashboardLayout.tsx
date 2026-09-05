import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { Users, FileText, Menu, X, Workflow, ShieldCheck, House } from "lucide-react";
import { useMyProcesses } from "@/api/process-context";
import { useMyOrganizationalAuthorities } from "@/api/organizational-authority";
import logoSvg from "@/assets/logo.svg";
import { HeaderBar } from "@/components/layout/HeaderBar";
import { PageHeaderProvider } from "@/components/layout/PageHeaderProvider";
import { SidebarUserMenu } from "@/components/layout/SidebarUserMenu";
import { APP_DISPLAY_NAME } from "@/config/env";
import { AppSidebar, type AppSidebarItem } from "@/components/layout/AppSidebar";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/utils/cn";
import { ROUTES } from "@/utils/constants";

const DESKTOP_SIDEBAR_STORAGE_KEY = "ui:desktop-sidebar-collapsed";

function isActivePath(pathname: string, itemTo: string): boolean {
  return pathname.startsWith(itemTo.replace("/$id", ""));
}

export function DashboardLayout() {
  const { pathname } = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { data: myProcesses = [] } = useMyProcesses();
  const { data: myAuthorities = [] } = useMyOrganizationalAuthorities();
  const isDesktopNavOpen = useUIStore((state) => state.sidebarOpen);
  const setDesktopNavOpen = useUIStore((state) => state.setSidebarOpen);
  const contextualItems: AppSidebarItem[] = [
    { to: ROUTES.WORK, label: "Beranda Kerja", icon: House },
    ...(myProcesses.length > 0
      ? [{ to: ROUTES.WORK_QUEUE, label: "Pekerjaan SOP", icon: FileText }]
      : []),
    ...(myAuthorities.length > 0
      ? [{ to: ROUTES.APPROVAL.INBOX, label: "Persetujuan & TTE", icon: ShieldCheck }]
      : []),
    ...(user?.platformRole === "SUPER_ADMIN"
      ? [
          { to: ROUTES.ADMIN.ACCOUNTS, label: "Akun FTI", icon: Users },
          { to: ROUTES.ADMIN.PROCESSES, label: "Proses FTI", icon: Workflow },
          { to: ROUTES.ADMIN.AUTHORITIES, label: "Kewenangan Organisasi", icon: ShieldCheck },
        ]
      : []),
  ];

  // First-party navigation is owned by Process relationships, organizational authority,
  // and platform administration. Legacy role routing is no longer a navigation fallback.
  const sidebarItems = contextualItems;
  const activeItem = sidebarItems.find(({ to }) => isActivePath(pathname, to));

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      setDesktopNavOpen(window.localStorage.getItem(DESKTOP_SIDEBAR_STORAGE_KEY) !== "true");
    } catch {
      // Preferensi visual tetap opsional ketika storage browser tidak tersedia.
    }
  }, [setDesktopNavOpen]);

  const handleDesktopSidebarOpenChange = (open: boolean) => {
    setDesktopNavOpen(open);
    try {
      window.localStorage.setItem(DESKTOP_SIDEBAR_STORAGE_KEY, String(!open));
    } catch {
      // Sidebar tetap dapat digunakan walau storage browser diblokir.
    }
  };

  return (
    <div suppressHydrationWarning className="flex h-[100dvh] flex-col lg:h-screen lg:flex-row">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[60] focus:rounded-control focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-raised focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Lewati ke konten utama
      </a>

      <nav
        data-print-hide
        className="shrink-0 border-b border-border bg-surface lg:hidden"
        aria-label="Navigasi utama"
      >
        <div className="flex min-h-[var(--header-height)] items-center gap-3 px-4 md:px-5">
          <img src={logoSvg} alt={APP_DISPLAY_NAME} className="h-8 w-8 shrink-0" />
          <span className="min-w-0 flex-1 text-ui-body font-semibold text-foreground">
            {activeItem?.label ?? APP_DISPLAY_NAME}
          </span>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-control text-secondary-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={isMobileNavOpen ? "Tutup navigasi" : "Buka navigasi"}
            aria-expanded={isMobileNavOpen}
            aria-controls="mobile-main-navigation"
            onClick={() => setIsMobileNavOpen((open) => !open)}
          >
            {isMobileNavOpen ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
      </nav>

      {isMobileNavOpen ? (
        <div className="fixed inset-0 z-overlay lg:hidden" data-print-hide>
          <button
            type="button"
            className="absolute inset-0 bg-gray-950/40"
            aria-label="Tutup navigasi"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div
            id="mobile-main-navigation"
            className="relative flex h-full w-[248px] flex-col border-r border-border bg-surface shadow-overlay"
          >
            <div className="flex h-[var(--header-height)] shrink-0 items-center gap-2.5 border-b border-border px-3">
              <img src={logoSvg} alt="" aria-hidden className="h-8 w-8 shrink-0" />
              <span className="min-w-0 flex-1 text-ui-body font-semibold text-foreground">
                {APP_DISPLAY_NAME}
              </span>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-control text-secondary-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Tutup navigasi"
                onClick={() => setIsMobileNavOpen(false)}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              <div className="grid gap-1">
                {sidebarItems.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    aria-current={isActivePath(pathname, to) ? "page" : undefined}
                    className={cn(
                      "flex min-h-10 items-center gap-2.5 rounded-control px-3 py-2 text-ui-body transition-colors",
                      isActivePath(pathname, to)
                        ? "bg-primary-subtle font-semibold text-primary"
                        : "text-secondary-foreground hover:bg-surface-muted",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0 opacity-80" aria-hidden />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            <SidebarUserMenu collapsed={false} onNavigate={() => setIsMobileNavOpen(false)} />
          </div>
        </div>
      ) : null}

      <AppSidebar
        items={sidebarItems}
        isItemActive={(to) => isActivePath(pathname, to)}
        open={isDesktopNavOpen}
        onOpenChange={handleDesktopSidebarOpenChange}
      />

      <div suppressHydrationWarning className="flex-1 flex flex-col min-w-0 min-h-0">
        <PageHeaderProvider>
          <HeaderBar />
          <main
            id="main-content"
            className="relative flex-1 overflow-auto bg-background scrollbar-hide"
          >
            <div data-scroll-content className="min-h-full p-4 md:p-5 lg:p-6">
              <div data-app-content className="w-full">
                <Outlet />
              </div>
            </div>
          </main>
        </PageHeaderProvider>
      </div>
    </div>
  );
}
