import { describe, expect, it } from "vitest";
import { compareStatus } from "./health";
import type { Status } from "./types";

describe("compareStatus", () => {
  it("orders triage states by severity", () => {
    const statuses: Status[] = ["green", "yellow", "red", "grey"];
    expect(statuses.sort(compareStatus)).toEqual(["red", "grey", "yellow", "green"]);
  });
});
