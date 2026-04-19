import Link from "next/link";
import { notFound } from "next/navigation";
import { PlannerFrame } from "@/components/planner-frame";
import { hasServiceRoleEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type SharedPlannerPageProps = {
  params: Promise<{ shareId: string }>;
};

export default async function SharedPlannerPage({ params }: SharedPlannerPageProps) {
  if (!hasServiceRoleEnv()) {
    return (
      <main className="planner-shell">
        <div className="setup-state">
          <p>`SUPABASE_SERVICE_ROLE_KEY` is required for public share links.</p>
        </div>
      </main>
    );
  }

  const { shareId } = await params;
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return (
      <main className="planner-shell">
        <div className="setup-state">
          <p>`SUPABASE_SERVICE_ROLE_KEY` is required for public share links.</p>
        </div>
      </main>
    );
  }

  const { data: planner } = await supabase
    .from("planners")
    .select("id, title, snapshot, share_mode, share_id")
    .eq("share_id", shareId)
    .single();

  if (!planner || planner.share_mode === "private") {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const shareUrl = siteUrl ? `${siteUrl}/share/${planner.share_id}` : null;
  const readonly = planner.share_mode === "view";

  return (
    <main className="planner-shell">
      <header className="planner-header">
        <div>
          <div className="eyebrow">{readonly ? "View only" : "Shared edit"}</div>
          <h1 className="section-title">{planner.title}</h1>
        </div>
        <Link className="button-ghost" href="/">
          Open home
        </Link>
      </header>

      <PlannerFrame
        title={planner.title}
        initialSnapshot={(planner.snapshot as Record<string, unknown> | null) ?? null}
        saveEndpoint={readonly ? null : `/api/share/${planner.share_id}`}
        initialShareMode={planner.share_mode}
        shareUrl={shareUrl}
        manageSharing={false}
        readonly={readonly}
        heading={readonly ? "Preview" : "Shared"}
      />
    </main>
  );
}
