# Design — AkariNext

A locked design system for the AkariNext landing page and publishing surfaces.
Every page in scope reads this file before visual changes are made.

## Genre

Editorial. The site behaves like a living community journal, not a product-marketing template.

## Macrostructure family

- Marketing/home: Ecosystem Index — featured, latest, games, servers, and people as distinct editorial rails.
- Content indexes: Catalogue — repeatable article entries with image, date, author, and title.
- Content pages: Long Document — title, factual metadata, hero image, readable prose, author colophon.
- Member dashboard: Index-First — editable article and game rows first, with settings revealed only where needed.

## Theme

- Variant: cool editorial blue, derived from AkariNext's earlier sky-blue identity.
- Paper: `oklch(97% 0.012 240)`
- Paper 2: `oklch(93% 0.02 238)`
- Ink: `oklch(22% 0.034 250)`
- Ink 2: `oklch(36% 0.038 248)`
- Rule: `oklch(76% 0.035 238)`
- Accent: `oklch(52% 0.16 240)`
- Focus: `oklch(58% 0.2 245)`

Dark mode uses a softened navy range rather than black and white:

- Dark paper: `oklch(18% 0.028 250)`
- Dark paper 2: `oklch(22% 0.034 248)`
- Dark ink: `oklch(90% 0.018 235)`
- Dark ink 2: `oklch(78% 0.024 237)`
- Dark rule: `oklch(35% 0.042 246)`
- Dark accent: `oklch(72% 0.14 230)`

## Typography

- Display: M PLUS 1p, weight 700, roman
- Body and UI: Zen Kaku Gothic New, weight 400–700
- Outlier: JetBrains Mono, weight 400; masthead metadata and colophon only
- Display tracking: `-0.035em`
- Display anchor: `clamp(2.75rem, 7vw, 5.25rem)`

## Spacing

The named 4-point scale in `tokens.css` is mandatory. No arbitrary spacing values in redesigned surfaces.

## Motion

- Motion-cut: no scroll reveals, parallax, floating decoration, or autoplay.
- Images may scale to 1.02 on pointer hover.
- State changes use `--ease-out`; reduced motion collapses to 150 ms.

## Microinteractions stance

- Focus rings are instant and visible.
- Links use colour or a one-pixel underline; cards do not lift or glow.
- Copy success is quiet and changes the button label briefly.

## CTA voice

- Primary: typographic link with a one-pixel underline and arrow.
- Secondary: unfilled rectangular control with a one-pixel rule.
- Pills are reserved for factual status only.

## Per-page allowances

- Home may use CMS imagery only.
- Article indexes use CMS imagery or a neutral typographic placeholder.
- Article pages use typography and the article's own image only.
- Dashboard forms use hairline field borders, 44 px controls, and quiet inline success or error messages.

## What pages must share

Cool paper/ink palette, edge-aligned header, Japanese type pairing, hairline rules, square image crops, link behaviour, and colophon.

## What pages may differ on

Content density, image ratio, number of columns, and whether metadata appears above or below the title.

## Exports

The canonical CSS export is `tokens.css`. Astro imports it through `src/styles/global.css`.
