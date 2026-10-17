# Architecture

## Layout

```
src/
  app/                Expo Router routes (screens only)
    _layout.tsx       Root stack: fonts, providers, celebrations, notifications
    onboarding.tsx    First-run flow
    (tabs)/           Today, Library, Stats, Trophies, Profile
    discover.tsx      Optional Project Gutenberg catalogue
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

1. **Library** (`lib/library.ts`) — the user picks a folder through the system picker (Android SAF). If the picker fails, `components/folder-browser.tsx` provides a shared-storage browser using Android all-files access (`lib/storage-access.ts`). The onboarding step is persisted (`settings.onboardStep`) so a restarted app resumes where it was. The folder is scanned recursively, to a maximum depth of eight subdirectories and excluding hidden directories, for `.epub`, `.pdf`, `.txt`, `.md` and `.markdown` files. Books are stored in `store/library.ts`; new IDs are hashes of file name and size, with URI-based collision handling. Existing URI matches and supported file moves retain their IDs. EPUB metadata (title, author, cover) is loaded in the background.
   - **Discover** (`app/discover.tsx`, `lib/gutenberg.ts`) — queries Project Gutenberg's official OPDS search feed (`/ebooks/search.opds/`, sorted by downloads, `l.<lang>` for the language filter), downloads `/<id>.epub3.images` to the cache, writes it into the books folder as `Author - Title.epub` (works for SAF and file URIs) and rescans. Downloaded Gutenberg ids are kept in `library.downloaded`.
2. **Content** (`lib/content.ts`) — when a book is opened, it is parsed into `BookContent` (chapters made of `Block`s) by `lib/epub.ts` or `lib/plaintext.ts`, then cached as JSON in the app's document directory to avoid reparsing on later opens. EPUB covers and embedded images are extracted locally; remote EPUB images are skipped. This is a reflowed reader, not a complete browser layout engine or DRM implementation. PDFs are rendered directly by `components/reader/pdf-reader.tsx`; the web variant shows a mobile-app message instead.
3. **Reader** (`app/reader/[id].tsx`) — renders scrollable blocks with FlashList or a paged view, tracks position per book and reports reading time, pages and chapters through `hooks/use-reading-tracker.ts`. Reading is untimed by default; optional 5/15/30-minute reminders use foreground reader time. Reward time has a separate three-minute inactivity cutoff. See [habit-loop.md](habit-loop.md).
4. **Game** (`store/game.ts`) — turns reading activity into XP, streak updates, quest progress and achievements, and pushes rewards to the celebration queue.

## Persistence

All stores use Zustand `persist` with JSON storage backed by AsyncStorage (`store/storage.ts`):

| Store | Key | Contents |
| --- | --- | --- |
| `useSettings` | `avido.settings` | Profile, goal, reminders, reader preferences, theme, e-ink mode |
| `useLibrary` | `avido.library` | Folder, books, progress, downloaded Gutenberg IDs |
| `useGame` | `avido.game` | XP, day logs, freezes, finished books, unlocked achievements |

Book originals stay in the selected folder; parsed content and extracted assets live separately in the app's document directory. There is no app-operated account, sync service or analytics integration. Optional Discover requests are made directly to Project Gutenberg. Storage is not encrypted by Ávido, and operating-system backup settings are outside this local-persistence guarantee. See [privacy.md](privacy.md) for network, permission and deletion details.

## Theming

- `theme/palette.ts` defines the dark, light and e-ink app palettes plus reader themes. Components read the active palette with `usePalette()`.
- E-ink mode (`useSettings().eink`) switches to a monochrome palette, sets Reanimated to always reduce motion, disables root-stack transitions and celebration effects, and enables reader page turns through side taps. Known Android e-ink manufacturers receive e-ink mode and paged reading as defaults (`store/settings.ts`); the reading layout remains configurable. Hardware-specific refresh behavior is not controlled by the app.
