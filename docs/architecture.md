# Architecture

## Layout

```
src/
  app/                Expo Router routes (screens only)
    _layout.tsx       Root stack: fonts, providers, celebrations, notifications
    onboarding.tsx    First-run flow
    (tabs)/           Today, Library, Trophies, Profile
    reader/[id].tsx   Reader for EPUB/TXT/Markdown (reflowed) and PDF
  components/
    kit/              App design-system primitives (Txt, Tap, Ring, Bar, Cover, Sheet…)
    ui/               gluestack-ui generated components
    home/ reader/ trophies/   Screen-specific components
    celebration.tsx   Queue-driven reward overlay
  game/               Pure gamification rules (levels, quests, achievements)
  hooks/              usePalette, useReadingTracker
  i18n/               Language detection and translation helpers
  lib/                Library scanning, parsing, caching, dates, notifications
  store/              Zustand stores persisted to disk
  theme/              Palettes, reader themes and fonts
plugins/              Expo config plugins (release signing)
tools/                Asset generation scripts (app icons)
```

## Data flow

1. **Library** (`lib/library.ts`) — the user picks a folder via SAF. The folder is scanned recursively for `.epub`, `.pdf`, `.txt` and `.md` files. Books are stored in `store/library.ts`, keyed by a hash of their URI. EPUB metadata (title, author, cover) is loaded lazily in the background.
2. **Content** (`lib/content.ts`) — when a book is opened, it is parsed into `BookContent` (chapters made of `Block`s) by `lib/epub.ts` or `lib/plaintext.ts`, then cached as JSON in the app's document directory so later opens are instant. PDFs are rendered directly by `components/reader/pdf-reader.tsx`.
3. **Reader** (`app/reader/[id].tsx`) — renders blocks with FlashList, tracks position per book and reports reading time, pages and chapters through `hooks/use-reading-tracker.ts`.
4. **Game** (`store/game.ts`) — turns reading activity into XP, streak updates, quest progress and achievements, and pushes rewards to the celebration queue.

## Persistence

All stores use Zustand `persist` with a JSON storage backed by `expo-file-system` (`store/storage.ts`):

| Store | Key | Contents |
| --- | --- | --- |
| `useSettings` | `avido.settings` | Profile, goal, reminders, reader preferences, theme, e-ink mode |
| `useLibrary` | `avido.library` | Folder, books, progress |
| `useGame` | `avido.game` | XP, day logs, freezes, finished books, unlocked achievements |

## Theming

- `theme/palette.ts` defines the dark, light and e-ink app palettes plus reader themes. Components read the active palette with `usePalette()`.
- E-ink mode (`useSettings().eink`) switches to a monochrome palette, sets Reanimated to always reduce motion, disables router transitions and celebration effects, and makes the reader turn pages on side taps instead of scrolling. It is auto-enabled for known e-ink manufacturers (`store/settings.ts`).
