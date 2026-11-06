# copy/

Copy is product. Every user-facing string lives here, not inline in screens.

Rules (from CLAUDE.md §3):
- Short. Imperative. No exclamation points. No "You've got this!"
- Use the book's words where they exist (`mantra`, `why_it_matters`). Write new copy in the same register.
- "Dodged it" is the honest option. Never shame the user for choosing it.

Each file carries a `status`:
- `draft` — written by the build, **not yet approved by Mark**. Do not build a screen on draft copy.
- `approved` — Mark signed off (record the date in the file).

Book text (rule cards, passages) is never copied here. It is read from `content/` verbatim.
