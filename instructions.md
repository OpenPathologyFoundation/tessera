
**Create a Svelte component `LogoLockup.svelte` for the WBC ΔΣ application logo.**

**SVG Icon (variant B — open-stroke sigma):**

```xml
<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g fill="currentColor">
    <rect x="3" y="5" width="8" height="8" rx="1"/>
    <rect x="16" y="9" width="8" height="8" rx="1"/>
    <rect x="29" y="5" width="8" height="8" rx="1"/>
  </g>
  <path d="M4 24 L36 24 M4 24 L20 30 L4 36 M4 36 L36 36" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" fill="none"/>
</svg>
```

**Component requirements:**

1. Horizontal lockup: `[icon] [text-block]` with `align-items: center` and `gap` scaled to size
2. Text block has two lines: primary token `WBC ΔΣ` (bold, small-caps, thin space `\u2009` between WBC and ΔΣ) and secondary token `Manual Differential Counter` (regular weight, smaller)
3. Accept a `size` prop with three values: `"sm"` (icon 24px, for toolbars), `"md"` (icon 32px, for app headers), `"lg"` (icon 40px, for splash/about screens). Scale font sizes proportionally.
4. All colors via `currentColor` and CSS custom properties so it inherits from the parent theme — no hardcoded colors in the component. Use `--logo-primary` for the primary token and `--logo-secondary` for the descriptor, falling back to `currentColor` and `currentColor` at 60% opacity respectively.
5. SVG should have `aria-hidden="true"` since the text block provides the accessible name. Wrap the whole lockup in an element with `role="img"` and `aria-label="WBC Delta Sigma — Manual Differential Counter"`.
6. Export the SVG as a standalone `LogoIcon.svelte` component as well (just the icon, accepting `size` in pixels as a prop) for use in favicons, tab bars, or compact contexts.

**No dependencies beyond Svelte. No animation. No hover states. This is a static identity mark.**