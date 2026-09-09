---
name: AppOrbit Core
colors:
  surface: '#0f131d'
  surface-dim: '#0f131d'
  surface-bright: '#353944'
  surface-container-lowest: '#0a0e18'
  surface-container-low: '#171b26'
  surface-container: '#1c1f2a'
  surface-container-high: '#262a35'
  surface-container-highest: '#313540'
  on-surface: '#dfe2f1'
  on-surface-variant: '#c7c4d8'
  inverse-surface: '#dfe2f1'
  inverse-on-surface: '#2c303b'
  outline: '#918fa1'
  outline-variant: '#464555'
  surface-tint: '#c3c0ff'
  primary: '#c3c0ff'
  on-primary: '#1d00a5'
  primary-container: '#635bff'
  on-primary-container: '#fefaff'
  inverse-primary: '#4c42e9'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#4cd7f6'
  on-tertiary: '#003640'
  tertiary-container: '#007f95'
  on-tertiary-container: '#f5fcff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#321ed2'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#0f131d'
  on-background: '#dfe2f1'
  surface-variant: '#313540'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 3.5rem
    fontWeight: '800'
    lineHeight: 4rem
    letterSpacing: -0.03em
  display-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.375rem
    fontWeight: '700'
    lineHeight: 1.75rem
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.015em
  title-sm:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.625rem
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.02em
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-xxs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4rem
  gutter-mobile: 1rem
  gutter-desktop: 1.5rem
  sidebar-width-collapsed: 4.5rem
  sidebar-width-expanded: 16rem
  max-content-width: 90rem
---

## Brand & Style
The design system targets forward-thinking software engineers, technical founders, and enterprise DevOps teams navigating an ecosystem to discover, deploy, and monetize modern web and native applications. It bridges the precision of elite developer platforms with the polish of high-converting, consumer-grade marketplaces.

The visual style blends **Corporate / Modern** engineering rigor with targeted **Glassmorphism** highlights and micro-textured layers:
- **Atmosphere:** Deep architectural calm, authoritative stability, and immediate clarity. Density is calibrated so high data volumes never feel cluttered.
- **Visual Tenets:** Deep obsidian foundations, ultra-fine 1px structural boundaries, resonant indigo-purple focal points, and deliberate, micro-radiant status signals.
- **Emotional Impact:** Confident mastery, instantaneous feedback, and premium craftsmanship across every administrative action.

## Colors
The palette balances deep canvas tones with electric chromatic accents to maximize readability under extensive operational use.

### Canvas & Surface Architecture
- **Root Canvas (`#0B0F19`):** Deepest space void; frames outer sidebars and canvas backing.
- **Surface Elevation 1 (`#111827`):** Primary panel, card, and modular container tier.
- **Surface Elevation 2 (`#1E293B`):** Secondary nested wells, hover triggers, and popover backdrops.
- **Surface Elevation 3 (`#334155`):** Segmented controls, chips, and selected states.
- **Light Alternative Canvas (`#F8FAFC`):** Clean, high-clarity alternative foundation for invoices, embeds, and daylight workflows.

### Brand & Functional Accents
- **Primary Core (`#635BFF`):** Dominant action color used for primary CTAs, active telemetry traces, and navigation hooks.
- **Secondary Aura (`#8B5CF6`):** Complementary violet reserved for gradient sweeps, pro badges, and analytical projections.
- **Data Highlight (`#06B6D4`):** High-contrast cyan utilized for auxiliary metrics, network latency graphs, and build pipelines.

### Status Tonal Signals
- **Published / Active:** Emerald green (`#10B981` text, `#064E3B` background at 30% opacity, `#059669` hairline border).
- **Pending Review:** Warm amber (`#F59E0B` text, `#78350F` background at 30% opacity, `#D97706` hairline border).
- **Draft / Inactive:** Slate (`#94A3B8` text, `#1E293B` background at 50% opacity, `#475569` hairline border).
- **Rejected / Failed:** Crimson (`#EF4444` text, `#7F1D1D` background at 30% opacity, `#DC2626` hairline border).

## Typography
The system employs an intentional typographic pairing: **Plus Jakarta Sans** commands high-level narrative waypoints, product headers, and marketplace showcase banners, providing contemporary, sculpted confidence. **Inter** manages high-density analytical dashboards, forms, and data grid tables, delivering high legibility and neutral rendering at small sizes.

### Usage Standards
- **Optical Kerning:** Track headings with negative letter-spacing (`-0.02em` to `-0.03em`) to anchor layout hierarchy.
- **Metric Readouts:** Financial aggregates, installation counts, and analytics summaries default to tabular numeric styling (`font-variant-numeric: tabular-nums`) within Plus Jakarta Sans or JetBrains Mono.
- **Monospaced Utility:** Bundle versions, API keys, CLI commands, and Git commit hashes use JetBrains Mono exclusively to eliminate character ambiguity.

## Layout & Spacing
The layout follows an 8-point structural rhythm, enforcing strict spatial alignment across complex administrative workflows.

### Grid & Composition Rules
- **Desktop (1280px+):** Fixed collapsed/expandable navigational sidebar paired with an adaptable 12-column dynamic grid. Max dashboard boundary is clamped at `90rem` (1440px) and centered on larger viewports to prevent line-length drift.
- **Tablet (768px - 1279px):** Sidebar collapses to an icon rail (`4.5rem`), transitioning dashboard grids to an 8-column layout with `1.25rem` gutters.
- **Mobile (<768px):** Single-column stacked architecture with an off-canvas drawer navigation. Outer screen padding drops to `1rem`.

### Alignment Principles
- Card-internal layouts use nested paddings: large metric cards use `1.5rem`, while smaller listing rows and compact popovers use `1rem`.
- Data grid headers and row items strictly synchronize horizontal padding (`1rem`) to keep boundaries clean across dynamic sort columns.

## Elevation & Depth
Depth is constructed using dark tonal steps, ultra-crisp interior boundaries, and subtle, diffuse glowing penumbras rather than heavy traditional drop shadows.

### Elevation Hierarchy
- **Level 0 (Base Canvas):** Background foundation (`#0B0F19`) with no shadow or border.
- **Level 1 (Card & Module Foundation):** `#111827` surface featuring a 1px continuous border (`rgba(255, 255, 255, 0.08)`). Shadow: `0 4px 20px -2px rgba(0, 0, 0, 0.5)`.
- **Level 2 (Hover & Active Interactive Panels):** Elevation to `#1E293B` coupled with an Indigo-shifted rim highlight (`rgba(99, 91, 255, 0.25)`). Shadow: `0 12px 28px -4px rgba(0, 0, 0, 0.65), 0 0 1px 1px rgba(99, 91, 255, 0.2)`.
- **Level 3 (Modals, Overlays, Command Palettes):** `#111827` elevated surface with `backdrop-filter: blur(16px)`. Border: `1px solid rgba(255, 255, 255, 0.15)`. Shadow: `0 24px 48px -12px rgba(0, 0, 0, 0.85)`.

### Border Discipline
Never rely on solid opaque borders on dark canvases. Always execute borders with semi-transparent white alpha values (`0.06` to `0.15`) or low-opacity Indigo accents to preserve a crisp, edge-lit glass feel.

## Shapes
The shape language is modern and architectural, contrasting soft exterior silhouettes with tightly tuned interior elements.

### Curvature Taxonomy
- **Dashboard & App Cards:** `rounded-2xl` (`1rem` / 16px) for major modules, creating a premium software showcase aesthetic.
- **Modals & Dialogs:** `rounded-2xl` (`1rem` / 16px) matching the primary card silhouette.
- **Inputs & Interactive Controls:** `rounded-lg` (`0.5rem` / 8px) to provide defined, functional targets.
- **Chips, Badges & Status Indicators:** Full pill geometry (`rounded-full` / 9999px) to contrast with geometric card containers.

## Components

### Buttons
- **Primary:** Gradient fill `linear-gradient(135deg, #635BFF 0%, #8B5CF6 100%)`, 1px boundary `rgba(255, 255, 255, 0.2)`, white text, font weight 600, rounded-lg. Hover shifts brightness by +8% with a subtle glow shadow (`0 0 16px rgba(99, 91, 255, 0.4)`).
- **Secondary:** Surface `#1E293B`, border `1px solid rgba(255, 255, 255, 0.1)`, text `#F8FAFC`. Hover brings background to `#334155`.
- **Ghost/Tertiary:** Transparent fill, text `#94A3B8`, hover text `#FFFFFF`, hover background `rgba(255, 255, 255, 0.05)`.

### Status Badges
Rendered as compact inline-flex pills (`px-2.5 py-0.5`, font-size 12px, weight 600) with a 6px circular glowing indicator:
- **Published:** Emerald background (`rgba(16, 185, 129, 0.1)`), emerald text (`#34D399`), border `rgba(16, 185, 129, 0.25)`. Indicator includes an ambient drop shadow.
- **Pending Review:** Amber background (`rgba(245, 158, 11, 0.1)`), amber text (`#FBBF24`), border `rgba(245, 158, 11, 0.25)`.
- **Draft:** Slate background (`rgba(148, 163, 184, 0.1)`), slate text (`#94A3B8`), border `rgba(148, 163, 184, 0.2)`.
- **Rejected:** Rose background (`rgba(239, 68, 68, 0.1)`), rose text (`#F87171`), border `rgba(239, 68, 68, 0.25)`.

### Cards & App Showcase Units
- Styled with `rounded-2xl`, `#111827` surface fill, and `1px solid rgba(255, 255, 255, 0.08)`.
- Header houses the app icon (`rounded-xl`), title, active release version chip, and a 3-dot context menu.
- Internal footer dividers use a hairline border (`1px solid rgba(255, 255, 255, 0.05)`) framing download metrics and publishing telemetry.

### Metric Indicators & KPIs
- KPI value displayed in `display-sm` Plus Jakarta Sans with tabular figures.
- Dynamic trend badge (`+14.8%`) paired alongside: emerald fill for positive velocity, red for churn.
- Compact sparkline SVG nestled at the base of the card using `#635BFF` with an underlying gradient fill to `rgba(99, 91, 255, 0)`.

### Form Controls & Text Inputs
- Canvas: `#0B0F19` background inset into `#111827` cards.
- Border: `1px solid rgba(255, 255, 255, 0.12)`, radius `0.5rem`.
- Focus State: Border transitions to `#635BFF`, accompanied by a `0 0 0 3px rgba(99, 91, 255, 0.2)` ring.
- Placeholder text: `#64748B`. Active text: `#F8FAFC`.

### Checkboxes & Radios
- Size: 16px x 16px square (rounded-md for checkboxes) or circle (for radios).
- Unchecked: `#0B0F19` fill with `1px solid rgba(255, 255, 255, 0.2)`.
- Checked: `#635BFF` fill with crisp white vector checkmark and soft brand glow.