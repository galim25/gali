import { test } from "node:test";
import assert from "node:assert/strict";
import { findAvailableSlots, isSlotAvailable } from "./availability";

const day = (h1: number, h2: number) => ({
  starts_at: new Date(`2026-08-01T${String(h1).padStart(2, "0")}:00:00Z`),
  ends_at: new Date(`2026-08-01T${String(h2).padStart(2, "0")}:00:00Z`),
});

const at = (h: number, m = 0) => new Date(`2026-08-01T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`);

test("returns every step-aligned slot in an empty day", () => {
  const slots = findAvailableSlots({
    work_day: day(9, 10),
    busy: [],
    duration_minutes: 10,
    slot_step_minutes: 10,
  });
  assert.equal(slots.length, 6); // 9:00..9:50 in 10-min steps, last start 9:50 -> ends 10:00
});

test("excludes slots overlapping a break", () => {
  const slots = findAvailableSlots({
    work_day: day(9, 12),
    busy: [{ starts_at: at(10), ends_at: at(10, 30) }],
    duration_minutes: 15,
    slot_step_minutes: 15,
  });
  const overlapping = slots.filter((s) => s >= at(10) && s < at(10, 30));
  assert.equal(overlapping.length, 0);
});

test("excludes slots overlapping an existing appointment", () => {
  const slots = findAvailableSlots({
    work_day: day(9, 11),
    busy: [{ starts_at: at(9, 30), ends_at: at(9, 40) }],
    duration_minutes: 10,
    slot_step_minutes: 5,
  });
  assert.ok(!slots.some((s) => s.getTime() === at(9, 30).getTime()));
  assert.ok(!slots.some((s) => s.getTime() === at(9, 35).getTime()));
  assert.ok(slots.some((s) => s.getTime() === at(9, 40).getTime()));
});

test("defaults to a 10-minute grid when slot_step_minutes is omitted", () => {
  const slots = findAvailableSlots({
    work_day: day(9, 10),
    busy: [],
    duration_minutes: 10,
  });
  assert.deepEqual(
    slots.map((s) => s.getTime()),
    [0, 10, 20, 30, 40, 50].map((m) => at(9, m).getTime()),
  );
});

test("re-anchors the grid to the exact end of a busy block that isn't step-aligned", () => {
  // Two 15-minute appointments back-to-back (10:20-10:35, 10:35-10:50) on a 10-minute grid.
  const slots = findAvailableSlots({
    work_day: day(9, 12),
    busy: [
      { starts_at: at(10, 20), ends_at: at(10, 35) },
      { starts_at: at(10, 35), ends_at: at(10, 50) },
    ],
    duration_minutes: 10,
    slot_step_minutes: 10,
  });
  // The next slot after the combined block starts exactly at its end (no gap)...
  assert.ok(slots.some((s) => s.getTime() === at(10, 50).getTime()));
  // ...and every pair of consecutive offered slots is at least 10 minutes apart.
  for (let i = 1; i < slots.length; i++) {
    assert.ok(slots[i].getTime() - slots[i - 1].getTime() >= 10 * 60_000);
  }
});

test("does not offer a slot that would run past the end of the work day", () => {
  const slots = findAvailableSlots({
    work_day: day(9, 10),
    busy: [],
    duration_minutes: 15,
    slot_step_minutes: 10,
  });
  assert.ok(slots.every((s) => s.getTime() + 15 * 60_000 <= day(9, 10).ends_at.getTime()));
});

test("isSlotAvailable rejects overlap with a blocked time", () => {
  const wd = day(9, 18);
  const busy = [{ starts_at: at(12), ends_at: at(13) }];
  assert.equal(isSlotAvailable(at(12, 30), 10, wd, busy), false);
  assert.equal(isSlotAvailable(at(11, 50), 10, wd, busy), true);
  assert.equal(isSlotAvailable(at(13), 10, wd, busy), true);
});

test("isSlotAvailable rejects a slot outside work-day bounds", () => {
  const wd = day(9, 17);
  assert.equal(isSlotAvailable(at(16, 55), 10, wd, []), false);
  assert.equal(isSlotAvailable(at(8, 55), 10, wd, []), false);
});
