"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { formatShareMode, type PlannerSnapshot, type ShareMode } from "@/lib/planner";

type PlannerFrameProps = {
  title: string;
  initialSnapshot: PlannerSnapshot | null;
  saveEndpoint: string | null;
  initialShareMode: ShareMode;
  shareUrl: string | null;
  manageSharing: boolean;
  readonly: boolean;
  heading: string;
};

type PlannerMessage =
  | { type: "planner:ready" }
  | { type: "planner:snapshot"; snapshot: string }
  | { type: "planner:error"; message?: string };

export function PlannerFrame({
  title: initialTitle,
  initialSnapshot,
  saveEndpoint,
  initialShareMode,
  shareUrl,
  manageSharing,
  readonly,
  heading,
}: PlannerFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const snapshotResolverRef = useRef<((snapshot: string) => void) | null>(null);
  const [status, setStatus] = useState("No unsaved changes.");
  const [tone, setTone] = useState<"default" | "success" | "danger">("default");
  const [title, setTitle] = useState(initialTitle);
  const [shareMode, setShareMode] = useState<ShareMode>(initialShareMode);
  const [busy, setBusy] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const autoSaveTimerRef = useRef<number | null>(null);
  const lastSavedSnapshotRef = useRef<string>(initialSnapshot ? JSON.stringify(initialSnapshot) : "");

  const iframeSrc = useMemo(() => {
    const params = new URLSearchParams();
    params.set("embed", "1");
    return `/planner/index.html?${params.toString()}`;
  }, []);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent<PlannerMessage>) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const message = event.data;
      if (!message || typeof message !== "object") return;

      if (message.type === "planner:ready") {
        const snapshotText = initialSnapshot ? JSON.stringify(initialSnapshot) : null;
        if (snapshotText) {
          iframeRef.current?.contentWindow?.postMessage(
            { type: "planner:loadSnapshot", snapshot: snapshotText },
            window.location.origin,
          );
        }

        iframeRef.current?.contentWindow?.postMessage(
          { type: "planner:setReadonly", value: readonly },
          window.location.origin,
        );

        return;
      }

      if (message.type === "planner:snapshot" && typeof message.snapshot === "string") {
        snapshotResolverRef.current?.(message.snapshot);
        snapshotResolverRef.current = null;
        return;
      }

      if (message.type === "planner:error") {
        setTone("danger");
        setStatus(message.message || "The embedded planner reported an error.");
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [initialSnapshot, readonly]);

  async function requestSnapshot() {
    const frameWindow = iframeRef.current?.contentWindow;
    if (!frameWindow) {
      throw new Error("Planner iframe is not ready.");
    }

    const snapshot = await new Promise<string>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        snapshotResolverRef.current = null;
        reject(new Error("Planner did not answer in time."));
      }, 4000);

      snapshotResolverRef.current = (value) => {
        window.clearTimeout(timeout);
        resolve(value);
      };
      frameWindow.postMessage({ type: "planner:requestSnapshot" }, window.location.origin);
    });

    return snapshot;
  }

  async function savePlanner(nextShareMode: ShareMode = shareMode, options?: { force?: boolean }) {
    if (!saveEndpoint) return;

    try {
      const snapshotText = await requestSnapshot();
      if (!options?.force && snapshotText === lastSavedSnapshotRef.current && nextShareMode === shareMode) {
        setTone("default");
        setStatus("No unsaved changes.");
        return;
      }

      setBusy(true);
      setTone("default");
      setStatus("Saving changes...");

      const snapshot = JSON.parse(snapshotText) as PlannerSnapshot;
      const nextTitle =
        typeof snapshot.title === "string" && snapshot.title.trim()
          ? snapshot.title.trim()
          : title;

      const response = await fetch(saveEndpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: nextTitle,
          snapshot,
          shareMode: nextShareMode,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Failed to save planner.");
      }

      setTitle(nextTitle);
      setShareMode(nextShareMode);
      lastSavedSnapshotRef.current = snapshotText;
      setTone("success");
      setStatus("Changes saved.");
    } catch (error) {
      setTone("danger");
      setStatus(error instanceof Error ? error.message : "Failed to save planner.");
    } finally {
      setBusy(false);
    }
  }

  const autoSaveCurrentPlanner = useEffectEvent(async () => {
    await savePlanner();
  });

  async function copyShareUrl() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setTone("success");
    setStatus("Share link copied.");
  }

  useEffect(() => {
    if (!saveEndpoint || readonly) return;

    const frameWindow = iframeRef.current?.contentWindow;
    if (!frameWindow) return;

    const pollId = window.setInterval(async () => {
      try {
        const snapshotText = await requestSnapshot();
        if (snapshotText !== lastSavedSnapshotRef.current && !busy) {
          if (autoSaveTimerRef.current) {
            window.clearTimeout(autoSaveTimerRef.current);
          }

          setTone("default");
          setStatus("Waiting to auto-save...");

          autoSaveTimerRef.current = window.setTimeout(() => {
            void autoSaveCurrentPlanner();
          }, 3000);
        }
      } catch {
        // Ignore polling errors while the iframe is still booting.
      }
    }, 2000);

    return () => {
      window.clearInterval(pollId);
    };
  }, [busy, readonly, saveEndpoint, shareMode]);

  return (
    <section className={`planner-frame-layout${panelOpen ? " planner-frame-layout-open" : ""}`}>
      <div className="frame-card">
        <div className="frame-toolbar">
          <div className="stack planner-toolbar-text">
            <strong>{title}</strong>
            <span className="micro">
              {heading} · {status}
            </span>
          </div>
          <div className="toolbar-row">
            <button
              className="button-ghost"
              type="button"
              onClick={() => setPanelOpen((value) => !value)}
            >
              {panelOpen ? "Close info" : "Info"}
            </button>
          </div>
        </div>
        <div className="frame-wrap">
          <iframe
            ref={iframeRef}
            className="planner-iframe"
            src={iframeSrc}
            title="Shift planner editor"
          />
        </div>
      </div>

      <aside className={`side-card${panelOpen ? " side-card-open" : ""}`}>
        <div className="field">
          <span className="label">Save status</span>
          <p className="status" data-tone={tone}>
            {status}
          </p>
          <p className="micro">Shows whether the current planner has been saved successfully or if an error occurred.</p>
        </div>

        {manageSharing ? (
          <div className="field">
            <label className="label" htmlFor="share-mode">
              Share mode
            </label>
            <select
              id="share-mode"
              className="select"
              value={shareMode}
              onChange={(event) => {
                const nextShareMode = event.target.value as ShareMode;
                setShareMode(nextShareMode);
                void savePlanner(nextShareMode);
              }}
              disabled={busy}
            >
              <option value="private">Private</option>
              <option value="view">Anyone with the link can view</option>
              <option value="edit">Anyone with the link can edit</option>
            </select>
          </div>
        ) : null}

        {shareUrl ? (
          <div className="field">
            <span className="label">Share link</span>
            <div className="code-block">{shareUrl}</div>
            <button className="button-secondary" type="button" onClick={copyShareUrl}>
              Copy link
            </button>
          </div>
        ) : null}
        {!shareUrl && !manageSharing ? <p className="micro">{formatShareMode(shareMode)}</p> : null}
      </aside>
    </section>
  );
}
