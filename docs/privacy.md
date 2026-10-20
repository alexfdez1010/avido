# Privacy and local data

Public user-facing policies are published at [Spanish](https://avido.alejandrofernandezcamello.me/es/privacy/)
and [English](https://avido.alejandrofernandezcamello.me/en/privacy/). Their generator is
`scripts/build-privacy.cjs`; this implementation guide complements those policies.
The publisher is Alejandro Fernández Camello; support/privacy contact is
`apps_alejandro@proton.me`. The intended audience is ages 16 and over.


Ávido is built around a local reading library. The application source has no account system, advertising integration, analytics SDK, remote reading-history service or cloud-sync feature. You can read books already available on your device without using Discover or connecting to an Ávido service.

This document describes the application in this repository. It is a description of the current implementation, not a guarantee about every operating system, dependency, development tool or modified build.

## What is stored locally

| Data | Location and purpose |
| --- | --- |
| Optional profile name, goals, reminder settings, theme and reader preferences | The `avido.settings` AsyncStorage entry |
| Selected folder, book metadata and file URIs, reading positions, reading totals and downloaded Gutenberg IDs | The `avido.library` AsyncStorage entry |
| XP, streaks, achievements, finished-book titles and reading activity by day/hour | The `avido.game` AsyncStorage entry |
| Parsed book text, extracted EPUB covers and embedded images | The app's document directory, under `books/<id>/` |
| Original books and downloaded EPUBs | The folder you selected; Discover writes its downloads there |

Ávido does not add its own encryption layer to these stores or book files. Device locking, storage encryption, filesystem permissions and backup protection depend on your operating system and configuration. Do not treat the app as a secure vault for confidential documents.

The app configuration does not explicitly disable operating-system backup or device-transfer behavior. Device or cloud backups may therefore include app data depending on the platform and your settings. Ávido's lack of a sync backend does not prevent those backups. A selected folder can also be managed by another file provider or sync application.

## When the app connects to the network

The optional **Discover** screen contacts Project Gutenberg directly over HTTPS. Opening it requests its catalogue; searching sends the search text and selected language; visible results load cover images; choosing a book downloads its EPUB. These requests expose the usual connection information, including the source IP address, to the receiving service. Downloads may follow redirects operated by that service. Project Gutenberg states that its access logs, including IP addresses, are retained for at most 60 days; this is not ephemeral-only processing. See its current policy for details. Opening the Project Gutenberg footer link hands the website to your browser.

Ávido does not attach your local profile, XP, reading history or library database to these requests. The downloaded-book list stays local. Reading your own local books does not need this catalogue. EPUB parsing skips remote images and extracts supported embedded images locally.

Project Gutenberg is an independent service with its own [privacy policy](https://www.gutenberg.org/policy/privacy_policy.html). GitHub also handles traffic when you visit the project's website, source repository, issues or release downloads. Development builds use development tooling, such as Metro, whose behavior is separate from the installed release app. No claim here means that a device makes zero network requests.

## Permissions and notifications

Library setup uses the system folder picker and retains access to that selected folder. Android all-files access and legacy external-storage permissions are explicitly blocked, including permissions introduced by dependencies. The app scans the selected folder and supported subdirectories. If a folder configured in an older version relied on broad storage access, select it again through the system picker; existing book IDs and reading progress are retained when the files are recognized.

Reading reminders are scheduled locally with the operating system. The app does not register a remote push token or send reminder content to an Ávido push service. A reminder can include the current book's title and remaining daily reading time, which may be visible on your lock screen. Disable reminders in Profile, revoke notification permission, or adjust lock-screen previews in system settings if you prefer.

## Deletion, backups and portability

The library's delete action deletes the original book file as well as its extracted cache and library entry; it is not just a hide/remove-from-shelf action. Aggregate game history and the separate finished-book record can remain after deleting a book. Selecting a different folder is not a full data reset.

Profile → Progress backup can export a plain JSON copy of reading positions, per-book reading totals, daily history, XP, achievements, finished-book records, name and goals. Book contents, covers, file URIs, folder permissions and notification/device settings are excluded. The SHA-256 checksum detects corruption; it does not encrypt the file or authenticate its author. Export writes it only to the folder selected with the system picker; that folder’s provider may sync it. Protect exported copies as personal reading history.

Import checks the size, format, checksum and supported data fields before showing a confirmation. Confirming replaces the current reading history and goals, preserving local files and permissions. Missing books retain their progress and can be reattached by selecting a folder containing matching filenames and sizes. Renamed files and ambiguous duplicates cannot be reliably matched on another device. Save a current export before restoring an older copy. There is no encrypted backup, automatic cross-device sync or reset-all feature. System app-data clearing or uninstalling normally removes the installation's local app data, subject to platform backup/restore behavior. Files in your selected shared folder and copies in external backups are managed separately and can remain. Back up books you want to keep before deleting them or clearing device storage.

## Reviewing the implementation

Relevant sources are [`store/storage.ts`](../src/store/storage.ts), the three persisted stores in [`src/store/`](../src/store/), [`lib/gutenberg.ts`](../src/lib/gutenberg.ts), [`lib/library.ts`](../src/lib/library.ts), [`lib/epub.ts`](../src/lib/epub.ts), [`lib/paths.ts`](../src/lib/paths.ts), [`lib/notifications.ts`](../src/lib/notifications.ts), [`lib/progress-backup.ts`](../src/lib/progress-backup.ts) [`lib/progress-transfer.ts`](../src/lib/progress-transfer.ts) and [`app.config.ts`](../app.config.ts). Contributions that change storage, permissions, network traffic or third-party services should update this document alongside the code.
