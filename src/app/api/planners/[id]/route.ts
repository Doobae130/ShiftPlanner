import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ShareMode } from "@/lib/planner";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type PlannerPatchPayload = {
  title?: string;
  snapshot?: Record<string, unknown>;
  shareMode?: ShareMode;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase environment variables are missing." }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as PlannerPatchPayload;
  const { id } = await params;

  const payload = {
    ...(body.title ? { title: body.title.trim() || "Untitled Planner" } : {}),
    ...(body.snapshot ? { snapshot: body.snapshot } : {}),
    ...(body.shareMode ? { share_mode: body.shareMode } : {}),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("planners")
    .update(payload)
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id, title, share_mode, share_id, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Failed to update planner." }, { status: 400 });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/planners/${id}`);
  revalidatePath(`/share/${data.share_id}`);

  return NextResponse.json(data);
}
