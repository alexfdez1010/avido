# Mobile design

Ávido preserves its warm paper and ink surfaces, green primary accent, literary
Fraunces headings and Bricolage interface text. Native behavior takes precedence
over importing iOS presentation conventions into the Android release.

## Design guidance

The [Appllama app design skill](https://github.com/Appllama/appllama-skills/tree/main/skills/appllama-app-design-skill)
was installed for Codex and applied to the shared mobile kit and primary screens.
Its guidance complements the existing Android verification workflow in
[android-testing.md](android-testing.md).

The reference patterns are a cover-led library, a direct resume-reading action,
quiet peer navigation and secondary progress information. Public references are
[Apple Books](https://www.apple.com/apple-books/) and
[Kobo on Android](https://play.google.com/store/apps/details?id=com.kobobooks.android).
The Appllama MCP is not connected in this environment; these public sources do
not constitute a full Appllama flow study.

## Shared rules

- Use palette roles from `src/theme/palette.ts` for both app themes and e-ink.
  Green identifies actions and selection; reward colors retain their existing
  game meanings. Muted text must remain legible on the surrounding surface.
- Separate sections and rows with space. No decorative rules, heading underlines
  or terminal periods in headings. Input boundaries, progress tracks and chart
  data communicate controls or information rather than ornament.
- Shared cards use a 16 dp radius, actions 12 or 16 dp, sheets 24 dp and covers
  their existing 6 dp radius. Use continuous corners and one cover shadow.
- Tabs are peers with no lateral transition or scaling on press. Other shared
  press feedback settles within 120 ms without bounce; e-ink and system reduced
  motion suppress scaling. System reduced motion is read on app startup.
- Buttons have minimum heights of 48 or 56 dp and can grow to wrap larger labels.
  Expose disabled and busy states to accessibility services. Numeric variants
  use tabular figures.
- Library empty states distinguish missing folders, empty folders, searches and
  filters, and provide the corresponding recovery action. Keep Spanish and
  English strings behind `tx`.

## Verification scope

Use an isolated QA build with synthetic books. Check both themes, enlarged text,
search recovery, tab navigation, reader entry and Back. Record native screenshots
and motion evidence under the ignored `artifacts/android/` directory. Emulator
checks do not establish a sustained 60 fps performance result on physical devices
or iOS compatibility.
