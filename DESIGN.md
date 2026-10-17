---
name: Ávido launch website
description: Warm literary typography and sharp green for reclaiming attention through books
colors:
  green: "#3dd68c"
  forest: "#145b38"
  paper: "#f3ede2"
  ink: "#171811"
  muted: "#58594e"
  gallery: "#e6dfd0"
  dark-body: "#d5d6c8"
  privacy-body: "#19452c"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(3.6rem, 6.9vw, 6rem)"
    fontWeight: 900
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(2.6rem, 4.6vw, 4.5rem)"
    fontWeight: 900
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Bricolage, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Bricolage, system-ui, sans-serif"
    fontSize: "17px"
    lineHeight: 1.55
  label:
    fontFamily: "Bricolage, system-ui, sans-serif"
    fontSize: "15px"
rounded:
  control: "8px"
  selected-control: "5px"
  video: "12px"
spacing:
  compact: "16px"
  related: "24px"
  section: "112px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "16px 23px"
  button-primary-hover:
    backgroundColor: "{colors.forest}"
  button-closing:
    backgroundColor: "{colors.green}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "16px 23px"
  button-closing-hover:
    backgroundColor: "{colors.paper}"
  mode-selected:
    backgroundColor: "{colors.green}"
    textColor: "{colors.ink}"
    rounded: "{rounded.selected-control}"
    padding: "11px 16px"
---

# Design System: Ávido launch website

## Overview

**Creative North Star: "The Reader's Marginal Manifesto"**

Warm paper, dense ink and sharp green extend Ávido's established literary identity into a confident editorial website. Expressive serif headlines carry the provocation; a practical sans serif makes benefits, installation and privacy easy to read. The atmosphere is rebellious, generous and direct.

This document captures the implemented static launch website under `site/`. Native app colors and font names remain defined by `src/theme/palette.ts` and `src/theme/fonts.ts`; these web values do not replace them. The chosen website world and its narrative sequence are recorded in `.impeccable/surfaces/launch.md`. Headings have no terminal full stops, and spacing and tonal fields provide separation without decorative rules.

**Key Characteristics:**

- Literary display type paired with a clear, friendly interface face
- Warm paper, dark ink and green fields with strong typographic contrast
- Open editorial grids with real Android screenshots as product evidence
- Restrained controls, explicit language choice and motion that yields to accessibility

## Colors

The palette combines warm print-like neutrals with a bright reading-progress green and a deeper green for legible accents on paper.

### Primary

- **Sharp Green** (`green`): selected comparison controls, the privacy section, emphasis on dark backgrounds and the final download action
- **Forest Green** (`forest`): italic emphasis on paper, primary-button hover, focus outlines, numbered installation steps and active language underlines

### Neutral

- **Warm Paper** (`paper`): page canvas and text on dark sections
- **Dense Ink** (`ink`): primary text, dark narrative sections and primary download buttons
- **Olive Grey** (`muted`): supporting body text and small explanatory copy on paper
- **Gallery Paper** (`gallery`): the screenshot section's quiet tonal field
- **Soft Paper Ink** (`dark-body`): longer body passages within dark sections
- **Deep Leaf Ink** (`privacy-body`): supporting text on the bright green privacy field

**The Contrast Pairing Rule.** Use forest for green text on paper, and sharp green for emphasis against ink. Preserve the implemented pairings when extending this surface.

The stylesheet retains an unused `--rule` custom property; it is not a shipping divider pattern or an active palette primitive here.

The sidecar's eight-step OKLCH tonal ramps are generated panel-preview metadata, not additional colors used by the website.

## Typography

**Display Font:** Fraunces, with Georgia and serif fallbacks

**Body Font:** Bricolage Grotesque, registered in web CSS as `Bricolage`, with system-ui and sans-serif fallbacks

**Character:** Heavy, tightly spaced literary headlines contrast with open, approachable interface text. Fraunces italic provides selective emphasis within the display hierarchy.

### Hierarchy

- **Display:** the frontmatter `display` role drives the hero. At the mobile breakpoint its size becomes `clamp(3.5rem, 12vw, 5.5rem)`; at widths up to 360px it becomes 3rem.
- **Headline:** the frontmatter `headline` role drives section headings. The manifesto, FAQ and closing have observed contextual sizes in `site/assets/styles.css`; mobile section headings use `clamp(2.7rem, 10vw, 4rem)`.
- **Title:** bold sans serif definition terms use the `title` role; installation titles are slightly smaller (21px).
- **Body:** the `body` role is the page default. Introductions rise to 20–21px on desktop; supporting descriptions use 15–18px, generally constrained to 32–48 characters per line. FAQ answers allow up to 65ch.
- **Label:** navigation and text links use the `label` role. Supplementary labels and captions are smaller (11–14px depending on context and viewport). The format list has a modest 0.08em letter spacing.

All four font files are local under `site/assets/fonts/`: Fraunces black (900 normal), Fraunces italic (600), Bricolage regular (400) and Bricolage bold (700). Each face uses `font-display: swap`; the black display face is preloaded. Their OFL license files ship alongside them. No remote font service is required.

**The Whole Phrase Rule.** Headings use `text-wrap: pretty`. Keep the Spanish hero's “vicio se lee” together through `.headline-ending { white-space: nowrap; }`, so “lee” cannot become an isolated final line. The English “has pages” uses the same treatment.

**The Unstopped Heading Rule.** Headings and definition-list titles omit terminal full stops. Body sentences retain normal punctuation.

## Layout

The shared container `.wrap` is capped at 1280px with 56px side gutters. The default section rhythm uses the frontmatter `section` spacing. Two-column editorial layouts separate an expressive heading from readable content; the hero uses a 1.45:1 grid. The product showcase integrates the film directly beneath its existing section heading, followed by carousel controls and six screenshots with benefit titles and short descriptions. The carousel scrolls horizontally with snapping at every breakpoint. Desktop figures use `min(340px, calc((100% - 64px)/3))` with 32px gaps, showing three captures and a preview of the next when space permits.

- **Above 1450px:** the hero gap increases to 110px and its app screenshot grows to 300px wide.
- **At or below 1100px:** side gutters become 32px, regular section padding becomes 85px, most two-column gaps become 55px, and the hero screenshot becomes 240px wide.
- **From 761px to 1000px:** carousel figures use `min(340px, calc((100% - 32px)/2))`, showing two captures and a preview of the next when space permits.
- **At or below 760px:** side gutters become 20px, editorial sections stack, regular section padding becomes 65px, and the hero screenshot becomes 220px wide. The header retains install and language controls while other section links hide. The comparison steps become individual label-and-copy rows. Each carousel slide fills the track width, with its image and caption centered at a maximum of 280px. Only one capture is visible at rest. A 24px gap separates slides; mandatory snapping and `scroll-snap-stop: always` make horizontal swipes settle on the next capture.
- **At or below 360px:** the hero's smaller display size protects the grouped ending from overflow.

The browser-language entry point redirects to Spanish for an `es` browser language and English otherwise, preserving the query and fragment. Explicit `/es/` and `/en/` URLs remain stable. The shared layout supports both translations and exposes an ES/EN switch with the current language identified.

## Elevation & Depth

Broad, flat tonal sections establish hierarchy. Ambient shadows belong to actual app screenshots, giving them a restrained physical presence without surrounding the page in cards. Buttons and navigation remain flat.

### Shadow Vocabulary

- **Hero screenshot:** `0 18px 50px #17181124`
- **Gallery screenshot:** `0 15px 40px #17181116`

## Shapes

Controls have gently curved edges using the frontmatter control radius. The selected comparison segment uses the smaller inset radius. The comparison group has a functional thin border; section separators have no decorative strokes. App screenshots have larger corners: 24px for the desktop hero, 20px for its mobile version, and 19px/13px for desktop/mobile gallery images. The video uses the frontmatter video radius and reduces to 8px on mobile. The actual app icon supplies the recognizable brand mark.

## Components

### Buttons

Download actions are solid, confident links with a download SVG, bold body typography and a minimum height of 56px. The primary and closing variants use their frontmatter color assignments. Hover changes background over 0.18 seconds with `ease`; no scale or lift is added. Mobile padding becomes 14px 18px and text becomes 15px.

Global `:focus-visible` outlines are 3px with a 5px offset, forest on light sections and sharp green on dark ones. Text links use a small arrow that moves 3px right over 0.2 seconds on hover. Underlines are offset by 5px where present.

### Navigation

The masthead places the actual icon and Fraunces wordmark beside section navigation and the language group. Plain navigation links underline on hover. Language links have a minimum height of 44px; the current language has a bold label and forest underline. Mobile keeps install and language choices visible without a menu drawer. The footer contains the brand and GitHub, contribution and MIT links.

### Habit Comparison

The two-option `.mode-switch` sits within an ink section. Its grouped buttons use `aria-pressed` to identify the selected option and update three cue/action/reward statements in an `aria-live="polite"` region. Selection changes copy immediately; the initial selection is the reading habit. Each option has a minimum height of 44px. The surrounding border communicates the group rather than dividing page sections.

### Product Screenshots

The hero and gallery show real Android captures, with explicit width and height attributes and descriptive alternative text. Each page uses screenshots from its matching `site/assets/screenshots/es/` or `site/assets/screenshots/en/` directory. The hero uses `home.webp` with high fetch priority. The gallery uses `library.webp`, `stats.webp`, `trophies.webp`, `reader.webp`, `stats-details.webp` and `trophies-details.webp`. Gallery images link to their full-size local versions in a new tab with localized accessible link labels. They currently use synchronous decoding without lazy loading. Captions describe reader benefits rather than QA or demonstration status.

The owner authorized a coherent demonstration library and reading history in the local capture environment, rendered by the actual native app. The library includes Gutenberg editions of Don Quijote and Crimen y castigo. Displayed statistics and achievements are illustrative samples, not evidence of real user outcomes. Keep provenance with shipping raster assets according to the asset workflow.

### Screenshot Carousel

The track uses horizontal scrolling and mandatory start snapping, with a thin forest scrollbar and an 8px leading inset to keep focus outlines visible on larger screens. Mobile removes the horizontal inset so each slide occupies one complete viewport. Circular 48px previous/next buttons have localized accessible labels, ink backgrounds and paper arrows; hover uses forest. Unavailable directions are disabled with muted colors. Buttons remain hidden until the carousel script initializes, while ordinary scrolling remains available without it.

The labeled track is keyboard focusable. Left and right arrows move between screenshot positions; Home and End reach the ends. Touch and wheel scrolling remain available, and there is no automatic advance. A screen-reader-only polite live region announces the visible range after scrolling settles, excluding small previews. Reduced-motion navigation moves instantly. Slide groups have localized position labels; the screen keeps its interface free of visible counters.

### Launch Video

The bilingual 33-second film pairs campaign copy with tall full-phone app captures, including holds on detailed statistics and achievements. Its composition omits slide folios, decorative rules and top labels. It sits within the showcase section without a separate visible title; its accessible name is “Descubre Ávido” / “Discover Ávido”. The wrapper retains `#film-heading` as an existing link destination. The player uses the browser's native controls, `playsinline`, `preload="none"`, a local poster and no autoplay. Each version offers a download fallback and a small music/credits link using `.film-credit`. The implemented player has no caption track or visible transcript disclosure, following the owner's explicit refinement. Media and posters are self-hosted with the site.

### FAQ

Native `details` and `summary` provide keyboard-operable disclosure. A decorative plus rotates when open and is hidden from assistive technology. Answers use the muted supporting-text style without card backgrounds or separator rules.

### Accessibility and Motion

A visible-on-focus skip link leads to the main content. Semantic section headings, labeled navigation, explicit page languages and decorative SVGs hidden from assistive technology support orientation. Smooth anchor and carousel scrolling and short hover transitions supply custom motion. `prefers-reduced-motion: reduce` disables smooth anchor scrolling, transitions and animations; the carousel script also chooses instant scrolling. Reduced motion does not remove controls or information. The site implements no text input, form field or general-purpose card component.

## Do's and Don'ts

### Do:

- **Do** extend the warm paper, ink, green and Fraunces/Bricolage identity already shared with the app
- **Do** keep the entire Spanish hero ending “vicio se lee” together and apply pretty wrapping to headings
- **Do** use actual app captures and the real icon, with meaningful alternative text and retained provenance
- **Do** preserve explicit language links, visible keyboard focus, reduced motion and the simple native video controls
- **Do** use space and tonal fields to separate content and keep the installation action easy to find

### Don't:

- **Don't** add terminal full stops to headings or definition-list titles
- **Don't** add decorative separator rules between sections, list items or footer content
- **Don't** add QA/demo captions, redundant footer slogans or explanatory filler to the website
- **Don't** autoplay the launch film or require its audio to understand the content
- **Don't** treat these web tokens as replacements for the native app's theme files
