# Copy for return, reminders, and relationships

Original operational applications of chapters 2 and 5. Messaging recipes and channel controls are practical extensions, not verbatim book content.

## Define logic before words

Every message needs audience eligibility, a real useful event/need, channel permission, timing, one destination, expiry, suppression after completion, and a practical preference route. Write this contract before polishing a headline. Producing copy does not authorize sending it.

Use **real available value → relevant reason now → clear next action**. Avoid generic activity bait. Message previews should not expose sensitive content. Change text and timing separately where causal attribution matters.

## Channel-specific handoff

**Push:** title, body, optional action, exact destination, expiry, grouping, permission, quiet-time behavior, and private-preview alternative. Length limits are platform/context-specific; use the actual project's constraints, not invented universal character counts.

**Email:** subject, preheader, opening, primary action, useful body context, sender identity, and implemented preference/unsubscribe routes as appropriate. Match subject to actual content. Do not invent urgency or a personal relationship with the sender.

**In-app:** anchor/context, timing, dismiss behavior, action, and suppression. Avoid an interrupting modal when contextual text solves the need.

**SMS or other channels:** use only when supported, appropriate, and authorized. Do not assume a new channel is available because it might improve reach.

## Message actions

| ID    | Occasion                   | Draft pattern/example                                             | Logic to specify                                       |
| ----- | -------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| CL-01 | Chosen practice reminder   | Your practice time is here. Start a short round when it suits you | User-selected time; stop when paused/completed         |
| CL-02 | Saved unfinished work      | Your saved challenge is ready to continue                         | Actual retained state and resume link                  |
| CL-03 | New relevant content       | A new challenge is available for your chosen level                | Supported relevance; honest availability               |
| CL-04 | Genuine social reply       | Someone replied to your question. Read their response             | Real reply, audience privacy, thread link              |
| CL-05 | Followed item's change     | An update is available for an item you saved                      | Subscribed item; meaningful change                     |
| CL-06 | A new user never started   | Try the guided first round, or choose another mode                | Eligibility window; no repetitive nagging              |
| CL-07 | First result completed     | Your result is saved. Choose what to practice next                | Real saved result; value before investment             |
| CL-08 | Periodic summary           | Here's what you practiced this week                               | Real summary; useful interpretation, not just activity |
| CL-09 | Missed session             | Your progress is still here. Resume when you're ready             | Retained progress; no false claim about streak state   |
| CL-10 | Lapsed user                | Pick up with a short refresher                                    | Feasible small restart; limited outreach               |
| CL-11 | Expired invitation/content | This invitation has expired. See available options                | Accurate fallback, no dead end                         |
| CL-12 | Preferences/pause          | Reminders paused until [date]. You can still practice anytime     | Actual scheduled resumption and control                |

Replace illustrative claims with verified product behavior. A message saying a new challenge exists must not lead to old content. If the user has declined nonessential messages, reactivation is not permission to override that choice.

## Complete sample: a chosen reminder

Context: a user opted into reminders for a chosen practice time. Example text assumes practice and saved preferences are supported.

- Push title: **Ready for your practice round?**
- Push body: **Start one challenge, or come back when it suits you.**
- Destination: chosen practice mode, with an achievable starting task.
- Suppression: paused reminders; today's intended task already completed; expired daily item; duplicate reminder; unsupported channel permission.
- Controls: change time, pause, or disable in the implemented settings surface.
- Primary outcome: completed useful practice among eligible users.
- Guardrail: dismissals, opt-outs, expressed pressure, and redundant alerts.

The reassuring wording is a choice cue, not a technique guaranteed to raise response. Make the actual action and decline as flexible as promised.

## Referrals and sharing

| ID    | Surface               | Draft pattern/example                                                 | Required control                               |
| ----- | --------------------- | --------------------------------------------------------------------- | ---------------------------------------------- |
| CL-13 | Share a useful result | Share this challenge with someone who might enjoy it                  | Deliberate recipient/channel choice            |
| CL-14 | Editable invitation   | I found a challenge you might like. Want to try it?                   | Sender sees/edits before sending               |
| CL-15 | Social contribution   | Ask the group for feedback                                            | Visible audience and preview                   |
| CL-16 | Invitation received   | [Name] invited you to [actual activity]                               | Genuine source and available activity          |
| CL-17 | Opt-out completion    | You won't receive these reminders. Your saved work is still available | Accurate preference update and retained access |

Make a share valuable to the recipient, not merely useful for acquisition metrics. Do not auto-import contacts, auto-post achievements, preselect every friend, or turn refusal into social guilt.

## Lapse and saturation

Recognize natural cadence and absence of need. A lapse may indicate healthy completion rather than failure. Offer smaller tasks or retained context where relevant, with no required backlog to clear. Never turn a limited reminder experiment into an endless escalation sequence.

Check whether the reward behind the message is still useful, whether a simpler entry point would work, and whether fewer messages preserve the same outcome. Use [measurement](measurement.md) for cohort and holdout design only when needed.
