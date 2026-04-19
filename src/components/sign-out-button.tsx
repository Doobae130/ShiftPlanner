"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="button-ghost"
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const supabase = getSupabaseBrowserClient();
          await supabase?.auth.signOut();
          router.push("/");
          router.refresh();
        })
      }
    >
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
