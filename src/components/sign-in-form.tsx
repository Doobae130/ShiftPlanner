"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [tone, setTone] = useState<"default" | "success" | "danger">("default");
  const [pending, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setTone("danger");
        setStatus("Supabase environment variables are missing.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setTone("danger");
        setStatus(error.message);
        return;
      }

      setTone("success");
      setStatus("Signed in. Opening dashboard...");
      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="field-stack">
      <div className="field">
        <label className="label" htmlFor="email">
          Work email
        </label>
        <input
          id="email"
          className="input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="chef@restaurant.com"
          required
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          className="input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Company account password"
          minLength={8}
          required
        />
      </div>

      <button className="button" type="submit" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
      <p className="status" data-tone={tone}>
        {status || "Company accounts are created by an administrator. This screen only allows sign-in."}
      </p>
    </form>
  );
}
