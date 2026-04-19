import { redirect } from "next/navigation";
import { buildInitialPlannerSnapshot } from "@/lib/planner";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getDefaultPlannerTitle() {
  return "This Week";
}

export default async function DashboardPage() {
  if (!hasSupabaseEnv()) {
    return (
      <main className="dashboard-shell">
        <div className="setup-state">
          <p>Supabase variables are missing. Fill `.env.local` first.</p>
        </div>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return (
      <main className="dashboard-shell">
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

  const { data: latestPlanner, error } = await supabase
    .from("planners")
    .select("id")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load the latest planner.");
  }

  if (latestPlanner?.id) {
    redirect(`/planners/${latestPlanner.id}`);
  }

  const title = getDefaultPlannerTitle();
  const snapshot = buildInitialPlannerSnapshot(title);

  const { data: createdPlanner, error: createError } = await supabase
    .from("planners")
    .insert({
      owner_id: user.id,
      title,
      share_mode: "private",
      snapshot,
    })
    .select("id")
    .single();

  if (createError || !createdPlanner) {
    throw new Error(createError?.message || "Failed to create the default planner.");
  }

  redirect(`/planners/${createdPlanner.id}`);
}
