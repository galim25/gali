---
name: barberbook-design
description: Use whenever adding, editing, or reviewing any UI in the BarberBook app (apps/web) — new pages, forms, buttons, cards, badges, colors, the logo/brand banner, page headings, or a date/time picker. Applies equally to /admin and to customer-facing pages (they share one design system since 2026-07-25). Load this BEFORE writing className strings from scratch or picking a color, so new UI matches the existing conventions instead of drifting or reinventing a pattern that already exists.
---

# BarberBook design system

One unified light theme, app-wide — `/admin` and customer pages share every
convention below. The only exception is the print pages (`admin/day/[id]/print`,
`admin/print-all`), which stay plain `bg-white`/`text-gray-*` on purpose (built
for paper, not for the brand).

## Color tokens (`apps/web/src/app/globals.css`)

| Token | Hex | Use for |
|---|---|---|
| `cream` | `#fdf8f0` | Page/body background |
| `barber-teal` | `#508186` | Primary brand color — headings, borders, filled buttons, links |
| `barber-teal-dark` | `#3d666a` | Reserved for hover/pressed states — not actively used yet |
| `ink` | `#1f2421` | Primary body text |
| `slate-muted` | `#7c7c7c` | Secondary text, placeholders |
| `cream-text` | `#fffcf7` | Text on a filled `barber-teal` background |

Never introduce a new color for something these six already cover. If a new
shade seems needed, it's more likely an existing token applied at the wrong
opacity (e.g. `border-barber-teal/40` for a de-emphasized border).

## Component patterns

Copy these verbatim; don't invent new radii or shapes.

- **Text input / select**: `border-barber-teal bg-white text-ink rounded-xl border p-2` (placeholder: `placeholder-slate-muted`). Auth-page inputs use a taller wrapping `<label>` variant with `focus-within:ring-barber-teal focus-within:ring-2` — check a nearby existing form before picking which variant.
- **Primary button** (the main CTA on a form/screen): `bg-barber-teal text-cream-text rounded-full ... font-bold`. Big top-level CTAs additionally use `uppercase tracking-wide text-lg`/`text-xl`.
- **Secondary/outline button**: `border-barber-teal text-barber-teal rounded-full border ... font-medium`.
- **Small pill button** (inline actions inside a list/card, e.g. approve/reject): same primary/secondary coloring, just `px-3 py-1 text-sm` instead of the larger padding.
- **Danger/destructive button** (delete, unblock, remove — anything irreversible or removing something): break from teal on purpose — `text-red-600`/`border-red-600`. Keep the same *shape* convention as everything else: `rounded-full` for a single button, `rounded-xl` for a confirmation panel holding several buttons.
- **Card / info box** (announcements, appointment rows, list items): `rounded-xl border-barber-teal bg-white p-3` (or `p-4` for a form-like panel).
- **Section heading** (`<h2>` inside a page, e.g. a form's title): `text-ink font-bold`.
- **Page-level heading** (`<h1>`): `text-barber-teal text-3xl font-bold text-center` — **always centered**, no exceptions. If the heading shares a row with a back button (see `forgot-password`/`reset-password`), don't just leave it left-aligned next to the icon — use `flex-1 text-center` on the `<h1>` plus an invisible spacer `<div>` on the opposite side sized to match the icon's width (e.g. `w-[22px]` for a 22px `BackIcon`), so the text is centered against the *whole row*, not just the leftover space.
- **Toggle switch** (see `ApprovalToggle.tsx` / `BlockDayToggle.tsx`): `role="switch" aria-checked`, track `h-7 w-12 rounded-full border p-1`, `bg-barber-teal border-barber-teal` when on vs `bg-white border-barber-teal` when off, knob `h-5 w-5 rounded-full` sliding via `translate-x-[-20px]`/`translate-x-0`, `bg-white` when on vs `bg-slate-muted` when off (a white knob on a white track would be invisible).

## Logo / brand banner

One shared asset for the whole app: `apps/web/public/logo-cropped.png` — a
**flattened PNG with real alpha transparency**, cropped tight to the artwork.
It is deliberately a PNG and not an SVG: the original Figma export used
nested `<mask>`/`<pattern>`/`<image>` SVG elements to fake a transparent
cutout, which rendered fine in desktop Chromium but was invisible on a real
mobile browser (WebKit doesn't support that construct reliably) — a real
bug found 2026-07-26. If the logo art ever changes, render the new source at
2x with a real alpha channel and export a plain PNG the same way; don't go
back to a mask-based SVG for this, and don't hand-edit the PNG.

Shown via a top banner, right after `<BsdBar/>` and before the page's own
heading/content — **not** a footer, despite the historical component name
`BrandHero`/`AdminBrandHero` suggesting otherwise:

```tsx
<div className="from-barber-teal/50 -mx-6 flex flex-col items-center bg-gradient-to-b to-cream px-6 pt-10 pb-10">
  <img src="/logo-cropped.png" alt="Yossi Barber" height={90} style={{ height: 90, width: "auto" }} />
</div>
```

Teal at the outer/top edge fading down into cream (so it blends into the
page's own background) — never the other direction. No bordered/boxed
backing behind the logo. Customer pages render `<BrandHero/>` directly in
JSX; `/admin` pages pass `<AdminBrandHero/>` via `PageHeader`'s `topBanner`
prop instead (see below). Every new page of either kind must include it.

## `<BsdBar/>` and `<PageHeader/>`

`<BsdBar/>` ("בס״ד") is always the literal first child of `<main>` — it uses
`-mx-6 -mt-6` to bleed to the page edges and `sticky top-0` to stay visible
while scrolling. Wrapping it in another `<div>` breaks the offset.

Every customer page composes this by hand: `<BsdBar/>` → `<BrandHero/>` →
`<h1>`. Every `/admin` page instead calls `<PageHeader title="..." topBanner={<AdminBrandHero/>} />`,
which returns exactly that sequence as a fragment (no wrapping div, for the
same reason as `BsdBar` above).

## Date/time pickers

Two calendar-grid implementations exist, visually identical, logic inverted
— know which one to copy:

- **Customer** (`DateCalendar` in `account/book/page.tsx`): only dates already
  present in `getOpenDates()` are clickable; everything else is faded/disabled.
  Month navigation is limited to months that actually contain an open date.
- **Admin** (`AdminDateCalendar` in `admin/OpenWorkDayForm.tsx`): the barber is
  opening days, so *every future date* is clickable except ones already open
  (shown disabled) or in the past. Month navigation is free forward, blocked
  only going before the current month.

Both use the same cell styling: selected = filled `bg-barber-teal text-cream-text`
circle; available-but-unselected (admin only, since customer's list is
sparse) = `border-barber-teal` outlined circle; disabled = faded `text-ink/30`,
no circle.

**Don't render the grid inline and permanently visible.** The admin version
shows a compact field first (styled exactly like a normal text input, showing
the chosen date or a placeholder) that opens the calendar as a popover on
click, and closes it again once a date is picked. Reuse this pattern for any
future date-entry field instead of a bare `<input type="date">` or an
always-expanded grid.

## Font

Rubik, loaded once globally in `app/layout.tsx` — never re-add it per page.
(Known pre-existing exception: `login/page.tsx` locally overrides it with
Heebo for a specific Figma-matched heading; don't propagate that pattern
elsewhere without a reason.)
