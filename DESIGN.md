# Design System

## Theme Architecture

Smart Campus employs an executive modern minimalist product theme. It uses slate-tinted dark and light neutrals paired with deliberate, high-contrast semantic accents.

- **Primary Brand Ink**: `#0F172A` (Deep Slate 900) / `#1E293B` (Slate 800)
- **Primary Brand Accent**: `#2563EB` (Royal Executive Blue / Sapphire)
- **Backgrounds**:
  - Web Light: `#F8FAFC` (Slate 50)
  - Card / Surface Light: `#FFFFFF` (White)
  - Sidebar / Header: `#0F172A` (Executive Slate) or `#FFFFFF` with `#E2E8F0` border
- **Semantic Accents**:
  - Emergency / Urgent / Danger: `#EF4444` (Rose 500), Background: `#FEF2F2`, Border: `#FECACA`
  - Active / Operational / Success: `#10B981` (Emerald 500), Background: `#ECFDF5`, Border: `#A7F3D0`
  - Warning / In-Progress / Preparing: `#F59E0B` (Amber 500), Background: `#FFFBEB`, Border: `#FDE68A`
  - Info / Scheduled / Blue: `#3B82F6` (Blue 500), Background: `#EFF6FF`, Border: `#BFDBFE`
  - Neutral / Inactive: `#64748B` (Slate 500), Background: `#F1F5F9`, Border: `#E2E8F0`

## Typography

- **Font Family**: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- **Scale Ratio**: 1.15 to 1.2 (Tight, functional product scale)
- **Sizes**:
  - Caption / Footnote: `11px` (0.6875rem) / `12px` (0.75rem), medium or semibold
  - Body / Subtext: `13px` (0.8125rem) / `14px` (0.875rem), regular
  - Control / Table Header: `12px` (0.75rem), uppercase tracking-wider, semibold
  - Section Title: `16px` (1rem) / `18px` (1.125rem), semibold
  - Page Heading: `22px` (1.375rem) / `24px` (1.5rem), bold, tight tracking (-0.02em)
  - Key Metric / Metric Hero: `28px` (1.75rem) / `32px` (2rem), bold tabular-nums

## Spacing & Elevation

- **Scale**: `4px` (xs), `8px` (sm), `12px` (md), `16px` (lg), `24px` (xl), `32px` (2xl)
- **Borders**: Crisp `1px solid` with explicit slate values (`#E2E8F0` on light, `#334155` on dark). No heavy drop-shadows paired with borders.
- **Card Radius**: `10px` to `12px` maximum. No oversized bulbous rounding (never >16px on cards).
- **Control Radius**: `6px` to `8px` for inputs and buttons; pill `9999px` strictly for status badges.

## Component Specifications

### 1. Metric / Stats Cards
- Clean white card, `1px` border (`#E2E8F0`), subtle `shadow-sm`.
- Top: Icon badge in muted tinted square (36x36px) + small label.
- Center: Tabular bold metric number.
- Bottom: Micro-indicator (e.g. "+3 active", "98% availability") with semantic color badge.

### 2. Status Badges & Pills
- Pill shape with icon + text label.
- Low-saturation background (10-15% tint), high-contrast text, 1px border.
- Never rely on color alone; always render an icon or text status code.

### 3. Action Buttons & Toggles
- Primary: Solid `#0F172A` (Executive Slate) or `#2563EB` (Accent Blue) with white text, crisp 6px radius, active press feedback.
- Secondary: White background, 1px border (`#CBD5E1`), slate-700 text, hover:bg-slate-50.
- Danger: Solid `#DC2626` or tint `#FEF2F2` with `#B91C1C` text.
- Responsive touch targets: min 40px height on web, min 48px height on mobile.

### 4. Tables & Data Lists
- Sticky, uppercase, tracking-wider column headers with muted slate background.
- Row hover: `bg-slate-50/75` with smooth transition.
- Cells aligned by type: text left, numbers right, badges center.
- Immediate row action buttons (Dispatch, Update Status, Mark Ready).

### 5. Mobile App Standards
- Bottom navigation with crisp 1px top border, active indicator dot, haptic feedback feeling.
- Prominent floating SOS FAB (`#EF4444`) with high elevation, pulse effect, and easy thumb-zone placement.
- Segmented pill controls for quick filtering (e.g. Veg / Non-Veg, Building A / B, Pain Relief / First Aid).
- High readability cards with clear price, time, and availability indicators.
