export type ShareMode = "private" | "view" | "edit";

export type PlannerSnapshot = Record<string, unknown>;
type PlannerRow = {
  id: string;
  name: string;
  color: number;
  shifts: Array<{
    id: string;
    dayIdx: number;
    workerName: string;
    startMin: number;
    endMin: number;
  }>;
};

export type PlannerSummary = {
  id: string;
  title: string;
  share_mode: ShareMode;
  updated_at: string;
};

export type PlannerRecord = PlannerSummary & {
  snapshot: PlannerSnapshot | null;
  share_id: string;
};

export const SHARE_MODE_LABELS: Record<ShareMode, string> = {
  private: "Private",
  view: "Anyone with the link can view",
  edit: "Anyone with the link can edit",
};

export function extractTitleFromSnapshot(snapshot: PlannerSnapshot | null) {
  if (!snapshot) return "Untitled Planner";

  const title = snapshot.title;
  return typeof title === "string" && title.trim() ? title.trim() : "Untitled Planner";
}

export function formatShareMode(mode: ShareMode) {
  return SHARE_MODE_LABELS[mode];
}

const DEFAULT_TEMPLATE: {
  slotMin: number;
  startHourMin: number;
  endHourMin: number;
  cellW: number;
  viewMode: string;
  title: string;
  dayTargets: Array<{ lunch: string; dinner: string }>;
  rows: PlannerRow[];
} = {
  slotMin: 15,
  startHourMin: 480,
  endHourMin: 1440,
  cellW: 29.095000000000013,
  viewMode: "timeline",
  title: "Shift Planner",
  dayTargets: [
    { lunch: "", dinner: "" },
    { lunch: "", dinner: "" },
    { lunch: "", dinner: "" },
    { lunch: "", dinner: "" },
    { lunch: "", dinner: "" },
    { lunch: "", dinner: "" },
    { lunch: "", dinner: "" },
  ],
  rows: [
    { id: "r3", name: "Position A", color: 2, shifts: [] },
    { id: "r2", name: "Position B", color: 1, shifts: [] },
    { id: "r4", name: "Position C", color: 3, shifts: [] },
    { id: "r5", name: "Position D", color: 4, shifts: [] },
    { id: "r6", name: "Position E", color: 5, shifts: [] },
  ],
};

function getMelbourneTodayParts() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return { year, month, day };
}

function toIsoDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentWeekRangeInMelbourne() {
  const { year, month, day } = getMelbourneTodayParts();
  const current = new Date(Date.UTC(year, month - 1, day));
  const weekDay = current.getUTCDay();
  const daysFromMonday = weekDay === 0 ? 6 : weekDay - 1;

  const start = new Date(current);
  start.setUTCDate(current.getUTCDate() - daysFromMonday);

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);

  return {
    dateStart: toIsoDate(start),
    dateEnd: toIsoDate(end),
  };
}

export function buildInitialPlannerSnapshot(title?: string): PlannerSnapshot {
  const { dateStart, dateEnd } = getCurrentWeekRangeInMelbourne();

  return {
    slotMin: DEFAULT_TEMPLATE.slotMin,
    startHourMin: DEFAULT_TEMPLATE.startHourMin,
    endHourMin: DEFAULT_TEMPLATE.endHourMin,
    cellW: DEFAULT_TEMPLATE.cellW,
    viewMode: DEFAULT_TEMPLATE.viewMode,
    title: title?.trim() || DEFAULT_TEMPLATE.title,
    dateStart,
    dateEnd,
    dayTargets: DEFAULT_TEMPLATE.dayTargets.map((target) => ({ ...target })),
    rows: DEFAULT_TEMPLATE.rows.map((row) => ({
      ...row,
      shifts: row.shifts.map((shift) => ({ ...shift })),
    })),
  };
}
