import type { Status } from "./types";

export const statusRank: Record<Status, number> = {
  red: 0,
  grey: 1,
  yellow: 2,
  blue: 3,
  green: 4
};

export const statusLabel: Record<Status, string> = {
  green: "Normal",
  yellow: "Review",
  red: "Action",
  grey: "Data gap",
  blue: "Waiting"
};

export const statusClass: Record<Status, string> = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  yellow: "border-amber-200 bg-amber-50 text-amber-800",
  red: "border-rose-200 bg-rose-50 text-rose-800",
  grey: "border-zinc-200 bg-zinc-100 text-zinc-700",
  blue: "border-sky-200 bg-sky-50 text-sky-800"
};

export function compareStatus(a: Status, b: Status) {
  return statusRank[a] - statusRank[b];
}
