import type { AbsoluteSlot, SpecificOverride, TimeSlot } from '../types';

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

interface AvailabilitySource {
  availabilityPattern: TimeSlot[];
  availabilityOverrides: SpecificOverride[];
}

/**
 * Expands a weekly recurring pattern plus date-specific overrides into
 * absolute slots over the next `horizonDays` starting from `from`.
 * AVAILABLE overrides add extra slots; UNAVAILABLE overrides carve out
 * any overlapping time. Slots in the past (before `from`) are dropped.
 */
export function materializeSlots(
  source: AvailabilitySource,
  horizonDays: number,
  from: Date,
): AbsoluteSlot[] {
  const horizonEnd = new Date(from.getTime() + horizonDays * MS_PER_DAY);
  const slots: AbsoluteSlot[] = [];

  // recurring pattern → absolute occurrences
  const dayStart = new Date(from);
  dayStart.setHours(0, 0, 0, 0);
  for (let day = 0; day <= horizonDays; day++) {
    const date = new Date(dayStart.getTime() + day * MS_PER_DAY);
    const dow = date.getDay();
    for (const slot of source.availabilityPattern) {
      if (slot.dayOfWeek !== dow) continue;
      const startsAt = new Date(date.getTime() + slot.startMinute * MS_PER_MINUTE);
      const endsAt = new Date(date.getTime() + slot.endMinute * MS_PER_MINUTE);
      if (endsAt <= from || startsAt >= horizonEnd) continue;
      slots.push({
        startsAt: startsAt < from ? new Date(from) : startsAt,
        endsAt: endsAt > horizonEnd ? horizonEnd : endsAt,
      });
    }
  }

  // extraordinary availability
  for (const override of source.availabilityOverrides) {
    if (override.type !== 'AVAILABLE') continue;
    if (override.endsAt <= from || override.startsAt >= horizonEnd) continue;
    slots.push({
      startsAt: override.startsAt < from ? new Date(from) : new Date(override.startsAt),
      endsAt: override.endsAt > horizonEnd ? horizonEnd : new Date(override.endsAt),
    });
  }

  const merged = mergeSlots(slots);

  // carve out UNAVAILABLE overrides
  const blocks = source.availabilityOverrides
    .filter((o) => o.type === 'UNAVAILABLE')
    .map((o) => ({ startsAt: o.startsAt, endsAt: o.endsAt }));
  return blocks.length === 0 ? merged : subtractSlots(merged, blocks);
}

/** Sorts and merges overlapping/adjacent slots. */
export function mergeSlots(slots: AbsoluteSlot[]): AbsoluteSlot[] {
  const sorted = [...slots].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const merged: AbsoluteSlot[] = [];
  for (const slot of sorted) {
    const last = merged[merged.length - 1];
    if (last && slot.startsAt.getTime() <= last.endsAt.getTime()) {
      if (slot.endsAt > last.endsAt) last.endsAt = slot.endsAt;
    } else {
      merged.push({ startsAt: new Date(slot.startsAt), endsAt: new Date(slot.endsAt) });
    }
  }
  return merged.filter((s) => s.endsAt > s.startsAt);
}

/** Removes `blocks` intervals from `slots`. */
export function subtractSlots(slots: AbsoluteSlot[], blocks: AbsoluteSlot[]): AbsoluteSlot[] {
  let current = slots.map((s) => ({ startsAt: s.startsAt, endsAt: s.endsAt }));
  for (const block of blocks) {
    const next: AbsoluteSlot[] = [];
    for (const slot of current) {
      if (block.endsAt <= slot.startsAt || block.startsAt >= slot.endsAt) {
        next.push(slot); // no overlap
        continue;
      }
      if (block.startsAt > slot.startsAt) {
        next.push({ startsAt: slot.startsAt, endsAt: new Date(block.startsAt) });
      }
      if (block.endsAt < slot.endsAt) {
        next.push({ startsAt: new Date(block.endsAt), endsAt: slot.endsAt });
      }
    }
    current = next;
  }
  return current.filter((s) => s.endsAt > s.startsAt);
}

/** Intersects two sorted-or-not slot lists into common windows. */
export function intersectSlots(a: AbsoluteSlot[], b: AbsoluteSlot[]): AbsoluteSlot[] {
  const listA = mergeSlots(a);
  const listB = mergeSlots(b);
  const result: AbsoluteSlot[] = [];
  let i = 0;
  let j = 0;
  while (i < listA.length && j < listB.length) {
    const slotA = listA[i] as AbsoluteSlot;
    const slotB = listB[j] as AbsoluteSlot;
    const start = slotA.startsAt > slotB.startsAt ? slotA.startsAt : slotB.startsAt;
    const end = slotA.endsAt < slotB.endsAt ? slotA.endsAt : slotB.endsAt;
    if (start < end) {
      result.push({ startsAt: new Date(start), endsAt: new Date(end) });
    }
    if (slotA.endsAt <= slotB.endsAt) i++;
    else j++;
  }
  return result;
}
