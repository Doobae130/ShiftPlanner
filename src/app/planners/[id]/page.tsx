import { notFound, redirect } from "next/navigation";
import { PlannerFrame } from "@/components/planner-frame";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PlannerEditorPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlannerEditorPage({ params }: PlannerEditorPageProps) {
  if (!hasSupabaseEnv()) {
    return (
      <main className="planner-shell">
        <div className="setup-state">
          <p>Supabase variables are missing. Fill `.env.local` first.</p>
        </div>
      </main>
    );
  }

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return (
      <main className="planner-shell">
        <div className="setup-state">
          <p>Supabase variables are missing. Fill `.env.local` first.</p>
        </div>
      </main>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: planner } = await supabase
    .from("planners")
    .select("id, title, snapshot, share_mode, share_id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!planner) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const shareUrl = planner.share_mode === "private" || !siteUrl ? null : `${siteUrl}/share/${planner.share_id}`;

  return (
    <main className="planner-shell">
      <header className="planner-header">
        <div>
          <div className="eyebrow">Editor</div>
          <h1 className="section-title">{planner.title}</h1>
        </div>
      </header>

      <PlannerFrame
        title={planner.title}
        initialSnapshot={(planner.snapshot as Record<string, unknown> | null) ?? null}
        saveEndpoint={`/api/planners/${planner.id}`}
        initialShareMode={planner.share_mode}
        shareUrl={shareUrl}
        manageSharing
        readonly={false}
        heading="Signed-in"
      />
    </main>
  );
}
