# Miga

Miga is a vector reading owl built with the existing SVG and Reanimated dependencies.
It appears inside today's goal ring, in the profile header, in reading progress
notifications, and in goal/streak celebrations. It adds no explanatory cards or
settings rows. Tap it on Today or Profile for a short greeting; reaching the daily
goal changes it to its happy pose.

Breathing, blinking and wing motion stop when the screen loses focus or the app
enters the background. Reduced-motion preferences and e-ink mode disable movement.
The Android notification small icon uses a monochrome silhouette; system
notifications are static, while in-app progress notifications animate the owl.

Reminder text is built in `src/lib/companion.ts`. Today's messages use remaining
minutes, future messages use the full daily goal, and a completed goal suppresses
both of today's scheduled messages. Run `node --test scripts/test-reminders.cjs`
for scheduler regression checks.

For mobile-sized browser previews, the web entry loads the app's bundled fonts,
uses React Native Text to support style arrays, bypasses Uniwind 1.12's missing
web InputAccessoryView wrapper, and shows a mobile-only message for PDF reading.
Native PDF behavior is unchanged. Web previews do not request notification access.
