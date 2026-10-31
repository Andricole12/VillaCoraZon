"use client";

import { useActionState } from "react";
import { signInAdmin, type LoginFormState } from "@/app/admin/actions";

const initialState: LoginFormState = {};

export default function LoginForm({ accessMessage }: { accessMessage: string }) {
  const [state, formAction, isPending] = useActionState(signInAdmin, initialState);

  return (
    <form className="admin-login-form" action={formAction}>
      {accessMessage ? (
        <p className="admin-message admin-message-error" role="alert">
          {accessMessage}
        </p>
      ) : null}
      {state.error ? (
        <p className="admin-message admin-message-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <label className="form-field">
        <span>Email address</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          maxLength={254}
          required
        />
      </label>

      <label className="form-field">
        <span>Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          maxLength={128}
          required
        />
      </label>

      <button className="button button-navy admin-login-submit" type="submit" disabled={isPending}>
        {isPending ? "Signing in..." : "Sign in"}
        <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
