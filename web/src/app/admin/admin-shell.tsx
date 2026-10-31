import { signOutAdmin } from "./actions";
import { AdminSidebar } from "./admin-navigation";
import Link from "next/link";

export function AdminShell({
  adminName,
  adminRole,
  children,
}: {
  adminName: string;
  adminRole: string;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-dashboard">
      <AdminSidebar adminName={adminName} adminRole={adminRole} />
      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-copy">
            <span className="admin-workspace-label">Operations workspace</span>
            <strong className="admin-greeting">Welcome back, {adminName}</strong>
          </div>
          <div className="admin-header-right">
            <Link className="admin-header-link" href="/">
              View website
            </Link>
            <Link className="admin-header-primary" href="/reserve">
              + New inquiry
            </Link>
            <form action={signOutAdmin}>
              <button className="admin-signout" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
