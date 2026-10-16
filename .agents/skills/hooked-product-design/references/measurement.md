# Habit Testing and experiments

Book basis: chapter 8's Identify → Codify → Modify. Event design, causal safeguards, and stopping rules are practical extensions.

## Identify: define and find useful repeated behavior

Set a behavior, eligible population, natural cadence, observation window, and meaningful result before inspecting winners. Use realistic need opportunities, not only the most active users. Separate onboarding completion from recurrent value. Cohorts should have comparable age and adequate time to experience the next need.

The book suggests an initial five-percent habitual-user heuristic. It is not statistical significance, product-market fit, a universal success threshold, or a recommendation that a business can survive on five-percent active users. Define context-specific criteria and mark assumptions when evidence is absent.

Measure useful outcomes and prompt dependence separately. A person who returns due to a work requirement or paid incentive is not necessarily showing an internally cued habit. Interviews and contextual observation help interpret behavioral data.

## Codify: discover candidate Habit Paths

Compare sequences taken by frequent useful users with new, lapsed, and less successful users. Consider acquisition source, user purpose, skill, content availability, device, social connections, and time since signup.

Look for early events that precede later value: first useful result, saved work reused, relevant follows, or resumed practice. Do not select a future event and pretend it was an early predictor. Avoid comparing mature accounts with new accounts before they have the same opportunity.

A shared path is correlational. Existing motivation may cause both the early action and retention; encouraging the action may not reproduce motivation. The book's Twitter following-count example is historical and product-specific, not a universal onboarding target.

## Modify: test a narrow change

Choose a plausible mechanism and a change encouraging a useful path. Examples: reduce first-task friction, show a rewarding relevant result sooner, make saved work retrievable, or offer a chosen next cue. Define an evaluation before rollout; compare cohorts and revisit alternative explanations.

Do not force every user through a devotee's path. Their needs, experience, resources, and social context may differ. A successful experiment needs benefit across the intended audience, not merely more completion of an arbitrary step.

## Product actions

| ID    | Action                                              | Output                                       |
| ----- | --------------------------------------------------- | -------------------------------------------- |
| ME-01 | Define beneficial repetition at natural cadence     | Behavior, denominator, window                |
| ME-02 | Segment meaningful cohorts                          | Comparable populations and maturity          |
| ME-03 | Inspect candidate early sequences                   | Candidate paths with counterexamples         |
| ME-04 | Separate value from incentives/prompts              | Useful repeat and prompt-dependence measures |
| ME-05 | Validate event accuracy and missingness             | Instrumentation limitations                  |
| ME-06 | Choose one supported bottleneck hypothesis          | Mechanism and narrow change                  |
| ME-07 | Specify comparator and adequate observation         | Experiment or appropriate prototype study    |
| ME-08 | Monitor value and undesirable effects               | Primary metric and guardrails                |
| ME-09 | Test reduced prompting when appropriate             | Evidence of autonomous useful return         |
| ME-10 | Decide continue, revise, remove, or gather evidence | Decision tied to actual results              |

## Lean event schema

Use existing instrumentation first. Add only data needed for the decision; do not log raw messages, sensitive emotions, or unnecessary personal content. The following names are conceptual examples, not a requirement to rename the project's analytics:

| Event                | What it establishes                              | Useful properties when appropriate |
| -------------------- | ------------------------------------------------ | ---------------------------------- |
| cue_eligible         | User could appropriately receive a cue           | cue type, cadence bucket           |
| cue_delivered/opened | Cue delivery/response, where actually observable | variant, channel, destination      |
| core_action_started  | Intended behavior began                          | mode, entry source                 |
| meaningful_outcome   | Useful result occurred                           | outcome type, success criterion    |
| investment_saved     | Work persisted                                   | investment type, success/failure   |
| saved_value_reused   | Stored value helped a later visit                | value type, elapsed-time bucket    |
| session_resumed      | Interruption was recovered                       | resume type, success               |
| preference_changed   | User adjusted reminders/privacy                  | category, chosen setting           |

Do not equate server delivery with human exposure. Do not infer internal triggers directly from event attribution. If session storage or offline use loses events, explain the bias.

## Outcome definitions

- **Useful activation:** eligible new users reaching a meaningful first result within a defined window.
- **Useful repetition:** eligible users completing the beneficial behavior across appropriate need windows.
- **Time to value:** elapsed time from the relevant starting point to the meaningful outcome, including failures.
- **Stored-value reuse:** users benefiting from saved work later, not merely saving it.
- **Cue effectiveness:** useful completions attributable to a cue relative to a suitable comparator; opens alone are insufficient.
- **Prompt dependence:** how useful repeat behavior changes when nonessential cues/incentives are reduced.

Report numerator, denominator, window, cohort age, and exclusions. DAU/MAU and session length can describe activity but cannot establish usefulness or automaticity. Shorter sessions can be better when they save time; longer sessions can be desirable in chosen entertainment. Interpret through the goal.

## Experiment design and decision

Write: **For [segment], [change] should improve [useful behavior] because [mechanism].** Specify comparator, assignment unit, eligibility, observation period, primary measure, guardrails, minimum decision-worthy effect, uncertainty, and rollback. Use sufficient duration for the natural cycle rather than an arbitrary week.

Randomize when feasible for causal questions. For shared/social experiences consider spillover; for cross-device behavior use a consistent unit when possible. With limited traffic, usability observation or a small pilot can inform decisions without claiming statistical proof. Do not invent a sample size; calculate from real baseline/variance and desired inference when needed.

Predefine when to stop or remove: inaccurate promises, broken recovery, unwanted disclosure, violated preferences, material outcome regression, or an unacceptable guardrail change. Avoid repeated peeking and selecting whichever metric improves. Publishing/running an experiment requires the task's actual authorization.
