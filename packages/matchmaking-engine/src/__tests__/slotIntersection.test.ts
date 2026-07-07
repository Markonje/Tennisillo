import {
  intersectSlots,
  materializeSlots,
  mergeSlots,
  subtractSlots,
} from '../utils/slotIntersection';

// Monday 2026-06-01 08:00 local time
const MONDAY_8 = new Date(2026, 5, 1, 8, 0, 0, 0);

const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 5, day, hour, minute, 0, 0);

describe('mergeSlots', () => {
  it('merges overlapping and adjacent slots', () => {
    const merged = mergeSlots([
      { startsAt: at(1, 10), endsAt: at(1, 12) },
      { startsAt: at(1, 11), endsAt: at(1, 13) },
      { startsAt: at(1, 13), endsAt: at(1, 14) },
      { startsAt: at(2, 9), endsAt: at(2, 10) },
    ]);
    expect(merged).toHaveLength(2);
    expect(merged[0]).toEqual({ startsAt: at(1, 10), endsAt: at(1, 14) });
  });
});

describe('subtractSlots', () => {
  it('carves a block out of the middle of a slot', () => {
    const result = subtractSlots(
      [{ startsAt: at(1, 9), endsAt: at(1, 13) }],
      [{ startsAt: at(1, 10), endsAt: at(1, 11) }],
    );
    expect(result).toEqual([
      { startsAt: at(1, 9), endsAt: at(1, 10) },
      { startsAt: at(1, 11), endsAt: at(1, 13) },
    ]);
  });

  it('removes a fully covered slot', () => {
    const result = subtractSlots(
      [{ startsAt: at(1, 9), endsAt: at(1, 10) }],
      [{ startsAt: at(1, 8), endsAt: at(1, 11) }],
    );
    expect(result).toEqual([]);
  });
});

describe('intersectSlots', () => {
  it('finds common windows', () => {
    const result = intersectSlots(
      [{ startsAt: at(1, 9), endsAt: at(1, 12) }],
      [{ startsAt: at(1, 11), endsAt: at(1, 14) }],
    );
    expect(result).toEqual([{ startsAt: at(1, 11), endsAt: at(1, 12) }]);
  });

  it('returns empty when nothing overlaps', () => {
    const result = intersectSlots(
      [{ startsAt: at(1, 9), endsAt: at(1, 10) }],
      [{ startsAt: at(1, 10), endsAt: at(1, 11) }],
    );
    expect(result).toEqual([]);
  });
});

describe('materializeSlots', () => {
  it('expands a weekly pattern over the horizon', () => {
    // Tuesdays 18:00-20:00 (2026-06-01 is a Monday → dayOfWeek 2 = Tuesday)
    const slots = materializeSlots(
      {
        availabilityPattern: [{ dayOfWeek: 2, startMinute: 18 * 60, endMinute: 20 * 60 }],
        availabilityOverrides: [],
      },
      14,
      MONDAY_8,
    );
    expect(slots).toHaveLength(2); // two Tuesdays in 14 days
    expect(slots[0]).toEqual({ startsAt: at(2, 18), endsAt: at(2, 20) });
    expect(slots[1]).toEqual({ startsAt: at(9, 18), endsAt: at(9, 20) });
  });

  it('drops pattern occurrences already in the past', () => {
    // Monday 06:00-07:00 pattern, reference is Monday 08:00 → first occurrence skipped
    const slots = materializeSlots(
      {
        availabilityPattern: [{ dayOfWeek: 1, startMinute: 6 * 60, endMinute: 7 * 60 }],
        availabilityOverrides: [],
      },
      14,
      MONDAY_8,
    );
    expect(slots).toHaveLength(2); // Mondays June 8 and 15, not June 1
    expect(slots[0]?.startsAt).toEqual(at(8, 6));
  });

  it('adds AVAILABLE overrides and carves UNAVAILABLE ones', () => {
    const slots = materializeSlots(
      {
        availabilityPattern: [{ dayOfWeek: 2, startMinute: 18 * 60, endMinute: 20 * 60 }],
        availabilityOverrides: [
          { type: 'AVAILABLE', startsAt: at(4, 14), endsAt: at(4, 17) },
          { type: 'UNAVAILABLE', startsAt: at(9, 0), endsAt: at(10, 0) }, // blocks 2nd Tuesday
        ],
      },
      14,
      MONDAY_8,
    );
    expect(slots).toEqual([
      { startsAt: at(2, 18), endsAt: at(2, 20) },
      { startsAt: at(4, 14), endsAt: at(4, 17) },
    ]);
  });

  it('ignores overrides outside the horizon', () => {
    const slots = materializeSlots(
      {
        availabilityPattern: [],
        availabilityOverrides: [
          { type: 'AVAILABLE', startsAt: at(20, 10), endsAt: at(20, 12) },
        ],
      },
      14,
      MONDAY_8,
    );
    expect(slots).toEqual([]);
  });

  it('clamps a pattern slot in progress at the reference time', () => {
    // Monday 07:00-09:00 pattern, reference is Monday 08:00 → clipped to 08:00-09:00
    const slots = materializeSlots(
      {
        availabilityPattern: [{ dayOfWeek: 1, startMinute: 7 * 60, endMinute: 9 * 60 }],
        availabilityOverrides: [],
      },
      14,
      MONDAY_8,
    );
    expect(slots[0]).toEqual({ startsAt: MONDAY_8, endsAt: at(1, 9) });
  });

  it('clamps an AVAILABLE override that straddles the horizon boundaries', () => {
    const horizonEnd = new Date(MONDAY_8.getTime() + 14 * 24 * 60 * 60 * 1000);
    const slots = materializeSlots(
      {
        availabilityPattern: [],
        availabilityOverrides: [
          { type: 'AVAILABLE', startsAt: at(1, 6), endsAt: at(1, 10) }, // starts before "now"
          { type: 'AVAILABLE', startsAt: at(15, 7), endsAt: at(16, 10) }, // crosses horizon end
        ],
      },
      14,
      MONDAY_8,
    );
    expect(slots[0]).toEqual({ startsAt: MONDAY_8, endsAt: at(1, 10) });
    expect(slots[1]).toEqual({ startsAt: at(15, 7), endsAt: horizonEnd });
  });
});
