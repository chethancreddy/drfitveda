---
version: alpha
name: Hims CareSans
description: A warm, confidence-building health commerce system with soft contrast, rounded pills, and editorial-scale typography.
colors:
  primary: "#5C8CB5"
  primary-hover: "#4F7FA8"
  secondary: "#453421"
  tertiary: "#CFA16A"
  neutral: "#F6F1E8"
  surface: "#FFFFFF"
  on-surface: "#1F1A17"
  muted: "#8B6F57"
  border: "#D9CDBF"
  accent: "#F0B95A"
  error: "#C95A4A"
typography:
  headline-display:
    fontFamily: CareSans
    fontSize: 57px
    fontWeight: 410
    lineHeight: 57px
    letterSpacing: -0.57px
  headline-lg:
    fontFamily: CareSans
    fontSize: 41px
    fontWeight: 410
    lineHeight: 57px
    letterSpacing: -0.57px
  headline-md:
    fontFamily: CareSans
    fontSize: 30px
    fontWeight: 400
    lineHeight: 36px
    letterSpacing: 0.43px
  headline-sm:
    fontFamily: CareSans
    fontSize: 22px
    fontWeight: 400
    lineHeight: 31.5px
    letterSpacing: -0.05px
  body-lg:
    fontFamily: CareSans
    fontSize: 18px
    fontWeight: 400
    lineHeight: 28px
    letterSpacing: 0.2px
  body-md:
    fontFamily: CareSans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0.36px
  body-sm:
    fontFamily: CareSans
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0.2px
  label-lg:
    fontFamily: CareSans
    fontSize: 16px
    fontWeight: 500
    lineHeight: 24px
    letterSpacing: 0.02px
  label-md:
    fontFamily: CareSans
    fontSize: 13px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: 0.01px
  label-sm:
    fontFamily: CareSans
    fontSize: 13px
    fontWeight: 400
    lineHeight: 18px
    letterSpacing: 0.01px
  caption:
    fontFamily: CareSans
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  none: 0px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  full: 9999px
spacing:
  xs: 8px
  sm: 16px
  md: 28px
  lg: 40px
  xl: 60px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.full}"
    padding: 16px 24px
    height: 52px
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.surface}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.full}"
    padding: 16px 24px
    height: 52px
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.surface}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.none}"
    padding: 0px
  card:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: 16px
  card-feature:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: 24px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.full}"
    padding: 16px 20px
  chip:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 12px 16px
  banner:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 8px 16px

# Hims

## Overview
Hims feels warm, direct, and reassuring, with a premium consumer-health tone rather than a clinical one. The interface is spacious and editorial, using oversized headlines and rounded promotional surfaces to make sensitive topics feel approachable and confident. It balances trust and momentum: clear calls to action, soft contrast, and friendly image-led storytelling.

## Colors
- **Primary (#5C8CB5):** A muted blue used for trust-forward accents, links, and supporting action states. It feels calm and credible rather than loud.
- **Secondary (#453421):** A deep cocoa brown that anchors large feature panels and gives the brand its warm, grounded mood.
- **Tertiary (#CFA16A):** A sandy tan used as a warm highlight for product storytelling and tonal variation inside feature cards.
- **Neutral (#F6F1E8):** A soft cream that works as the lightest background tone for chips, cards, and resting surfaces.
- **Surface (#FFFFFF):** Clean white used for the main page canvas and high-clarity content areas.
- **On-surface (#1F1A17):** Near-black text for primary readability on light surfaces.
- **Muted (#8B6F57):** A subdued brown-gray for secondary copy and less prominent labels.
- **Border (#D9CDBF):** A gentle warm border color that supports structure without introducing hard contrast.
- **Accent (#F0B95A):** A golden highlight used for announcement pills and small emphasis moments.
- **Error (#C95A4A):** A restrained warm red for validation or alert states; it should stay secondary to the overall calm palette.

## Typography
CareSans is the single typographic voice across the system, with a modern rounded structure and a slightly humanist feel. Headlines use light-to-regular weights around 400–410 to preserve elegance at large sizes, while UI labels step up to 500 for clarity and affordance. The system is not uppercase-heavy; instead it relies on weight, scale, and generous line-height to communicate hierarchy. Letter spacing is subtle and mostly neutral, with tighter tracking on display headlines to keep the large copy compact and polished.

## Layout & Spacing
The layout is fluid and wide, with generous outer margins and large horizontal breathing room for hero content, promo cards, and editorial modules. Spacing follows a small set of roomy increments: 8px, 16px, 28px, 40px, and 60px, which creates a calm rhythm with noticeable separation between sections. Cards and chips use compact internal padding, while feature banners and hero regions expand horizontally to feel premium and immersive. The overall structure favors large contiguous blocks over dense grids.

## Elevation & Depth
Depth is intentionally subtle. Rather than dramatic shadows, the design leans on tonal layering, warm background contrast, and gentle borders to separate content. Feature panels sit on contrasting brown and cream fields, and image-led cards carry the visual weight instead of heavy elevation. This makes the interface feel soft, modern, and accessible rather than materially stacked.

## Shapes
The shape language is soft and pill-forward. Interactive controls such as buttons, chips, and announcement banners use full or very large radii to create a friendly, approachable feel. Cards are more restrained, typically sitting in the 8px to 24px range depending on prominence, which keeps the layout polished while still approachable. The overall effect is rounded, gentle, and consumer-friendly.

## Components
Buttons
- Use `button-primary` for the main action. It should feel substantial, with 16px/24px padding, 52px height, full rounding, and white text on the blue primary background.
- Use `button-secondary` for low-emphasis actions that still need button affordance. Keep the same size and shape as primary, but transparent background.
- Use `button-link` for tertiary text actions, especially in banners and compact utility areas. Keep it minimal, unboxed, and underlined.
- Hover states should deepen or darken the fill slightly, but avoid harsh contrast jumps or sharp corners.

Cards
- Use `card` for compact content tiles and `card-feature` for larger promotional modules.
- Prefer warm backgrounds and minimal borders over shadows.
- Keep padding consistent and allow imagery to do most of the storytelling work.
- Feature cards should have noticeably more radius than utility cards.

Inputs
- Inputs should feel soft and calm, with rounded ends and generous horizontal padding.
- Use white surfaces, dark text, and minimal border emphasis.
- Avoid square fields or dense forms; spacing around inputs should remain airy.

Chips and pills
- Chips use cream backgrounds, compact padding, and full rounding.
- They should read as selectable categories or quick links, not as buttons with heavy visual weight.
- Announcement pills can use the accent gold to stand apart from the page while still feeling friendly.

Banners
- Use full-width rounded banners for major campaigns or education moments.
- Let the banner background carry a strong tonal statement, but keep the typography clear and restrained.

Navigation and utility actions
- Header actions should remain lightweight and unobtrusive.
- Keep menu and account controls small, clear, and visually secondary to the main conversion path.

## Do's and Don'ts
- Do use CareSans consistently across headlines, body copy, and controls.
- Do preserve the large, editorial headline scale; it is a defining brand trait.
- Do keep corners soft and rounded, especially on pills, chips, and primary actions.
- Do favor warm tonal backgrounds and soft creams over stark white-on-black contrasts.
- Do rely on spacing and color blocks for hierarchy instead of heavy shadows.
- Don't introduce sharp, boxy buttons or cards with low-radius corners.
- Don't use saturated, neon, or overly clinical colors that break the calm health-focused mood.
- Don't crowd content; the system should remain spacious and easy to scan.