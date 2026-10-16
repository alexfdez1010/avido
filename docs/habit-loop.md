# A useful reading return loop

This iteration applies the Hook Model to voluntary reading. The working assumption is that someone with a book already in their library wants an easy way to start during a short break and resume after an interruption. This is a product hypothesis, not evidence that longer sessions or more app opens improve their experience.

## Diagnosis and changes

The existing app already saves reading progress and offers daily goals, quests and achievements. The weaker transition was between wanting to read and committing to a whole daily goal. The change reduces the size of that first commitment while preserving uninterrupted reading and immediate exit.

| Transition | Implemented behavior | Intended benefit |
| --- | --- | --- |
| Need → cue | Today shows the current book and existing reading progress. | Recover the reader's own interest without another notification. |
| Cue → action | Start with 5 minutes by default, optionally choose 15 or 30, and open the book directly. | Make a short break feel sufficient; keep the daily goal unchanged. |
| Action → reward | A small passive toast acknowledges the chosen reading time once, then disappears. | Recognize actual reading without interrupting the book. |
| Reward → investment | Reading progress saves automatically and restores on the next visit. | Let reading itself make the next visit easier, with no writing or extra decisions. |

The chosen time is a starting commitment, not a limit: reaching it does not stop or pause reading, show a dialog or require an action. Leaving saves progress immediately without a recap or writing prompt. In the reader's “show nothing” setting, hidden controls leave only the book content, without the footer, progress line or reading reward toast. A target reached while toasts are disabled is consumed silently rather than appearing later.

## Local data and boundaries

The target and its one-time acknowledgement stay in the current reading session. Existing reading progress remains in the on-device library and reading stores. No account, service, analytics SDK or remote experiment is introduced. The reading tracker excludes background time, loading/error states and open reader sheets. Pending reading totals and position are saved when leaving or backgrounding the reader.

## Validation and next hypothesis

Automated tests exercise session-link validation, the five-minute default, foreground/overlay/idle timing, immediate exit and persistence, plus one-time target acknowledgement and suppression in text-only mode. Local Android validation should also cover the actual reader, the text-only setting and save/resume.

A future voluntary pilot could compare the previous flow with the small-commitment flow across comparable reading opportunities. The primary question is whether readers start more easily and successfully resume their chosen book on a later day. Observe time to start reading, successful position recovery and unwanted interruptions as guardrails. Do not treat session length, XP or app opens alone as evidence of a habit. There is no new instrumentation for this pilot in the app; outcome claims require separate evidence.
