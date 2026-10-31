import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Staff sign in | Villa Corazon Events Place",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="admin-login-page">
      <header className="site-header reserve-header">
        <Link className="brand" href="/" aria-label="Villa Corazon home">
          <span className="brand-mark" aria-hidden="true">
            VC
          </span>
          <span className="brand-name">
            <strong>VILLA CORAZON</strong>
            <span>EVENTS PLACE</span>
          </span>
        </Link>
        <Link className="text-link reserve-back" href="/">
          <span aria-hidden="true">←</span> Back to website
        </Link>
      </header>

      <section className="admin-login-content">
        <div className="admin-login-card">
          <p className="eyebrow">STAFF PORTAL</p>
          <h1>Welcome <em>back.</em></h1>
          <p className="admin-login-description">
            Sign in with an account the venue owner has authorized for staff
            access.
          </p>
          <LoginForm accessMessage="" />
          <p className="admin-login-help">
            Need access? Ask the venue owner to invite your email and add you as
            an admin.
          </p>
        </div>
      </section>
    </main>
  );
}
