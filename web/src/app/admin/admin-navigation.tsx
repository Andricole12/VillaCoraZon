"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartMark } from "../heart-mark";

const navigation = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Reservations", href: "/admin/reservations", icon: "reservations" },
  { label: "Calendar & schedules", href: "/admin/calendar", icon: "calendar" },
  { label: "Clients", href: "/admin/clients", icon: "clients" },
  { label: "Venues", href: "/admin/venues", icon: "venues" },
  { label: "Packages & services", href: "/admin/packages", icon: "packages" },
  { label: "Payments", href: "/admin/payments", icon: "payments" },
  { label: "Reports", href: "/admin/reports", icon: "reports" },
  { label: "Notifications", href: "/admin/notifications", icon: "notifications" },
] as const;

const iconPaths = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  reservations: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4m10-4v4M3 10h18" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4m10-4v4M3 10h18m4 4h.01M8 14h.01M12 14h.01M8 18h.01M12 18h.01M16 18h.01" />
    </>
  ),
  clients: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  venues: (
    <>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v12h14V9M9 21v-7h6v7" />
    </>
  ),
  packages: (
    <>
      <path d="m12 3 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z" />
      <path d="m19 15 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z" />
    </>
  ),
  payments: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 8.5c-.6-.6-1.6-1-3-1-1.7 0-3 .8-3 2s1.2 1.8 3 2c1.8.2 3 .8 3 2s-1.3 2-3 2c-1.3 0-2.4-.4-3-1m3-8v10" />
    </>
  ),
  reports: (
    <>
      <path d="M4 20V10m5 10V4m5 16v-7m5 7V7" />
      <path d="M2 20h20" />
    </>
  ),
  notifications: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
} as const;

function NavigationIcon({ name }: { name: keyof typeof iconPaths }) {
  return (
    <svg
      aria-hidden="true"
      className="admin-nav-icon"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      {iconPaths[name]}
    </svg>
  );
}

export function AdminSidebar({
  adminName,
  adminRole,
}: {
  adminName: string;
  adminRole: string;
}) {
  const pathname = usePathname();
  const initials = adminName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <aside className="admin-sidebar" aria-label="Staff workspace navigation">
      <Link className="brand admin-sidebar-brand" href="/" aria-label="Villa Corazon home">
        <HeartMark className="admin-brand-mark" />
        <span className="brand-name">
          <strong>VILLA CORAZON</strong>
          <span>EVENTS PLACE</span>
        </span>
      </Link>
      <p className="admin-sidebar-label">MANAGEMENT</p>
      <nav className="admin-sidebar-nav">
        {navigation.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`admin-sidebar-link${active ? " admin-sidebar-link-active" : ""}`}
              href={item.href}
              key={item.href}
            >
              <NavigationIcon name={item.icon} />
              <span className="admin-nav-label">{item.label}</span>
            </Link>
          );
        })}
        <Link className="admin-sidebar-link admin-sidebar-website" href="/">
          <span className="admin-nav-external" aria-hidden="true">↗</span>
          <span className="admin-nav-label">View website</span>
        </Link>
      </nav>
      <div className="admin-sidebar-profile">
        <span className="admin-avatar" aria-hidden="true">
          {initials}
        </span>
        <span>
          <strong>{adminName}</strong>
          <small>{adminRole}</small>
        </span>
      </div>
    </aside>
  );
}
