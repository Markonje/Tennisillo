# ADR 004 — Design System: Glass Morphism as Source of Truth

**Date**: 2026-05-22
**Status**: Accepted
**Sprint**: Sprint UI v2 — Design System Rewrite

---

## Context

The Tennisillo frontend was scaffolded with an Apple-iOS-inspired design palette
(`#007AFF` SystemBlue, iOS gray scale, `#34C759` SystemGreen, etc.) defined in
`packages/ui/src/tokens.ts`. This palette was specified in `docs/specs/02` §11
but was never visually realised in the application — all components were built
with inline `style={{}}` props using hardcoded glass-morphism values that did
not match the token file. The result was a design system with two contradictory
sources of truth and a UI that looked rough and inconsistent.

Concurrently, a high-fidelity design prototype was produced and stored in
`_design-reference/` (four HTML files + `CLAUDE_CODE_HANDOFF.md`). The prototype
uses a dark glass-morphism aesthetic built around:

- Composite radial + linear background gradient (`#071517 → #17304A → #0B1A1C`)
- Lime accent `#B9FF5A` as primary interactive colour
- Ice-blue `#79A7D8` as secondary accent
- Layered glass cards (`backdrop-filter: blur(26px) saturate(140%)`, `rgba(255,255,255,0.11)` fill)
- OKLCH-based avatar gradients
- Inter (400–900) as the single typeface

This prototype was approved by the product owner as the target visual direction
for the MVP.

---

## Decision

1. **The `_design-reference/CLAUDE_CODE_HANDOFF.md` document is the sole visual
   source of truth** for Sprint UI v2 and all future UI work. The Apple-iOS
   palette previously described in `docs/specs/02 §11` is considered superseded.

2. **The `packages/ui/src/tokens.ts` file is fully rewritten** to export the
   glass-morphism palette (see §1 of the handoff). The Apple-iOS colour scales
   (`primary`, `neutral`, semantic iOS colours) are removed. The v2.0 domain
   tokens (`colors.frequency`, `colors.training`, `colors.venue`) are preserved
   unchanged.

3. **The `packages/ui/src/tailwind.preset.ts` is fully rewritten** to expose all
   design tokens as Tailwind utility classes (`bg-glass-card`, `border-glass`,
   `shadow-glass`, `backdrop-glass`, `animate-fade-up`, `rounded-card`, etc.).
   The old shadcn/ui CSS-variable colour mappings are removed since Tennisillo
   does not use shadcn components directly.

4. **Tailwind-first + CVA pattern** replaces inline style props. Components must
   use `cva` (class-variance-authority) for variant logic and `cn()` for class
   merging. Inline `style={{}}` is permitted **only** for OKLCH avatar gradients
   (Tailwind v3 does not support `oklch()` in arbitrary values natively).

5. **`docs/specs/02 §11`** retains the v2.0 domain token additions
   (`FrequencyBadge`, `TrainingSessionBadge`, `VenueCard`) which remain valid.
   The design system section title "Apple-Inspired" is to be treated as
   historically inaccurate; the current system is glass-morphism-based.

---

## Consequences

**Positive:**
- Single source of truth eliminates the divergence between token file and
  actual component styles.
- Tailwind utility classes enable rapid composition and remove ~90% of inline
  styles, improving readability and enabling purging of unused CSS.
- `cva` variants are type-safe and co-located with the component, replacing
  scattered conditional style logic.
- The `backdrop-glass` compound utility encapsulates the vendor-prefixed
  backdrop-filter declaration so it is never copy-pasted.

**Negative / Trade-offs:**
- Existing components (Sprint UI 1-4, Sprint 2/2.5/3a) are incompatible with
  the new token structure and must be rewritten in Phase 2 of Sprint UI v2.
  A backward-compat `tokens` export is maintained during the migration window.
- Tailwind v3 does not natively support OKLCH in arbitrary values, requiring
  inline styles for avatar gradients. This is a known limitation and is
  acceptable for the current MVP scope.
- The `docs/specs/02 §11` section becomes partially stale. It is not archived
  (it contains valid v2.0 component specs) but should be updated post-sprint
  to reflect the glass palette.

---

## Alternatives Considered

**Keep Apple-iOS palette, build on top of it**: Rejected. The prototype and
product direction explicitly diverge from iOS aesthetics. Building on the wrong
foundation would require a second rewrite later.

**Use shadcn/ui as the component library**: Rejected. shadcn/ui targets a
light-mode / neutral design language. Customising it to the glass dark aesthetic
requires overriding ~100% of its default styles, offering no net benefit over
building components from scratch with CVA + Tailwind.

**Use Tailwind v4**: Rejected for this sprint. The project stack mandates
Tailwind v3 until a dedicated upgrade sprint is planned (post-MVP).
