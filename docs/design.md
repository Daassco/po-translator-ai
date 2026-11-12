---
name: PO Translator AI — Open-Source Localization Hub
description: Design system specification for the AI-powered GNU Gettext (.po) web translator built with React, Vite, Tailwind CSS, Supabase, and Google Gemini 2.5 Flash.
colors:
  primitive:
    midnight-950: "#0D131F"
    slate-900: "#161F30"
    slate-800: "#1C273C"
    slate-700: "#26334D"
    slate-400: "#94A3B8"
    slate-50: "#F8FAFC"
    orange-500: "#E95420"
    orange-600: "#D04616"
    orange-900: "#8C4630"
    emerald-500: "#10B981"
    purple-500: "#A855F7"
    sky-400: "#38BDF8"
    amber-500: "#F59E0B"
    red-500: "#EF4444"
  semantic:
    primary: "#E95420"
    on-primary: "#F8FAFC"
    primary-hover: "#D04616"
    primary-subtle: "rgba(233, 84, 32, 0.15)"
    primary-muted: "#8C4630"
    background: "#0D131F"
    on-background: "#F8FAFC"
    surface-1: "#161F30"
    on-surface-1: "#F8FAFC"
    surface-2: "#1C273C"
    on-surface-2: "#F8FAFC"
    text-primary: "#F8FAFC"
    text-secondary: "#94A3B8"
    border: "#26334D"
    border-focus: "#E95420"
    success: "#10B981"
    warning: "#F59E0B"
    error: "#EF4444"
    info: "#38BDF8"
    karma: "#A855F7"
typography:
  h1:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.75rem" # 28px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  h2:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem" # 16px
    fontWeight: 600
    lineHeight: 1.3
  kpi-display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.5rem" # 24px
    fontWeight: 700
    lineHeight: 1.2
    fontVariantNumeric: "tabular-nums"
  body-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem" # 14px
    fontWeight: 400
    lineHeight: 1.6
  mono-code:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.8125rem" # 13px
    fontWeight: 400
    lineHeight: 1.6
  label-caps:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.6875rem" # 11px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.05em"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.semantic.primary}"
    textColor: "{colors.semantic.on-primary}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-secondary:
    backgroundColor: "{colors.semantic.surface-1}"
    textColor: "{colors.semantic.text-primary}"
    border: "1px solid {colors.semantic.border}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card-outer:
    backgroundColor: "{colors.semantic.surface-1}"
    border: "1px solid {colors.semantic.border}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  card-inner-callout:
    backgroundColor: "{colors.semantic.surface-2}"
    border: "1px solid {colors.semantic.border}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  input:
    backgroundColor: "{colors.semantic.surface-2}"
    textColor: "{colors.semantic.text-primary}"
    border: "1px solid {colors.semantic.border}"
    focusBorder: "1px solid {colors.semantic.border-focus}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
---

## Overview
PO Translator AI adopts a developer-first Dark Mode Native design system inspired by modern open-source localization platforms. It combines a deep midnight canvas (`#0D131F`) with elevated slate surfaces (`#161F30`) and an energetic Burnt Orange (`#E95420`) accent to guide users seamlessly through the 4-step `.po` translation workflow, terminology glossary management, and community documentation.

## Colors & Tonal Hierarchy
- **Primary (`#E95420`):** Reserved strictly for primary CTAs (`Sign In`, `Upload & Parse`), active wizard steps, active sidebar highlights (paired with `15%` opacity fill), and input focus rings.
- **Tonal Layering:** Instead of drop shadows, elevation is expressed by lightening the surface color:
  1. Canvas Level 0: `#0D131F`
  2. Card / Sidebar Level 1: `#161F30`
  3. Inner Callout / Input Level 2: `#1C273C`
- **Semantic Accents on Contributors & Dashboard:** Emerald (`#10B981`) represents language coverage, Purple (`#A855F7`) represents karma/translated strings, and Sky Blue (`#38BDF8`) highlights top contributors.

## Typography
- **Inter** handles all UI navigation, headings, and documentation prose for crisp readability at `14px`.
- **JetBrains Mono** is mandatory for all Gettext `.po` syntax (`msgid`, `msgstr`), code placeholders (`%s`, `%d`, `%(name)s`, `{0}`), and raw file previews.
- **Tabular Figures:** All KPI cards on the Dashboard and Contributors screens use `tabular-nums` to ensure clean vertical alignment.

## Spacing & Layout
- **App Shell:** Fixed `240px` left navigation sidebar + `56px` top header bar + fluid main area with a centered `1040px` max-width container.
- **Grid Breakpoints:** 12-column desktop system (4-col KPI row, 3-col Contributor cards), collapsing to 8 columns on tablet and 4 columns (single stack) on mobile.

## Rules to Never Break
- Never use `#000000` or `#FFFFFF` on backgrounds; strictly adhere to `#0D131F` and `#F8FAFC`.
- Always maintain Nested Corner Radius discipline: outer cards use `12px`, inner callouts (`KEY POINTS`, dropzones, buttons) use `8px`, and small language tags use `4px`.
- Always provide an inline focus border (`#E95420`) on active form inputs and modal fields to satisfy WCAG AA keyboard navigation standards.