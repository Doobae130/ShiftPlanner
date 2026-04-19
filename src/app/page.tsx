import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/sign-in-form";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabaseConfigured = hasSupabaseEnv();

  if (supabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return null;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/dashboard");
    }
  }

  return (
    <main className="page-shell">
      <section className="login-shell">
        <div className="login-card">
          <div className="eyebrow">Shift Planner</div>
          <h1 className="section-title">Sign in</h1>
          <p style={{ marginTop: 10, marginBottom: 20 }}>
            Company accounts are managed by an administrator.
          </p>

          {supabaseConfigured ? (
            <SignInForm />
          ) : (
            <div className="setup-state">
              <p>
                Supabase environment variables are not set yet. Add the values from `.env.example`, create the SQL tables in Supabase, then redeploy.
              </p>
              <div className="toolbar-row" style={{ marginTop: 16 }}>
                <Link className="button-secondary" href="https://supabase.com/dashboard" target="_blank">
                  Open Supabase
                </Link>
                <Link className="button-ghost" href="https://vercel.com/new" target="_blank">
                  Deploy on Vercel
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
