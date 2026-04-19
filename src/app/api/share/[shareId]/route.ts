import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ shareId: string }>;
};

type SharePatchPayload = {
  title?: string;
  snapshot?: Record<string, unknown>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is missing." }, { status: 500 });
  }

  const { shareId } = await params;
  const body = (await request.json()) as SharePatchPayload;

  const { data: planner, error: fetchError } = await supabase
    .from("planners")
    .select("id, share_mode, share_id")
    .eq("share_id", shareId)
    .single();

  if (fetchError || !planner) {
    return NextResponse.json({ error: "Planner not found." }, { status: 404 });
  }

  if (planner.share_mode !== "edit") {
    return NextResponse.json({ error: "This share link is not editable." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("planners")
    .update({
      ...(body.title ? { title: body.title.trim() || "Untitled Planner" } : {}),
      ...(body.snapshot ? { snapshot: body.snapshot } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("share_id", shareId)
    .select("id, title, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Failed to save shared planner." }, { status: 400 });
  }

  revalidatePath(`/share/${shareId}`);

  return NextResponse.json(data);
}
