# @tennisillo/ui

Design system for Tennisillo — Apple-inspired tokens and Tailwind preset.

**Invariant:** all UI consumers import tokens and the Tailwind preset from this
package. Never duplicate color/spacing/typography values across apps.

## Usage in apps/web

```ts
// tailwind.config.ts
import { tailwindPreset } from '@tennisillo/ui';
export default { presets: [tailwindPreset], ... };
```

## Token source

`docs/specs/02_specifiche_sviluppo.md §11` (v1.0 base) and `§11.1` (v2.0 additions).
