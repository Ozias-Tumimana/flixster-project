# CLAUDE.md — Flixster

Guidance for Claude when working in this repo.

## What this project is

Flixster is a React 18 + Vite app that shows movies now playing in theaters (TMDb API)
with search, sort, a details modal, favorites/watched, a sidebar filter, embedded YouTube
trailers, and an AI "Watch Recommendation" (OpenRouter). It is a CodePath assignment graded
against a written spec the student authored *before* implementation.

- **Stack:** React 18.2, Vite 5, Node 24. No router, no backend, no test runner configured.
- **Scope:** all required features + AI Watch Recommendation + stretch (favorites, watched,
  sidebar filter, embedded trailer). **Render deployment is intentionally excluded.**
- **Spec:** [planning.md](planning.md) is the source of truth — component architecture, state
  architecture, API contracts, data flow, and the AI feature spec. It is a living document.

## ⚠️ Do this on EVERY prompt (before writing or changing code)

1. **Read [planning.md](planning.md) first.** It defines canonical component names, state
   variables, API contracts, and data flow. Treat it as the contract.
2. **Review the current code** before editing — at minimum [src/App.jsx](src/App.jsx) (owns
   nearly all state) plus whichever component(s) the prompt touches. Don't guess at the current
   structure; read it.
3. **Enforce canonical names.** Never invent `selectedMovie` for `selectedMovieId`, `isFav` for
   `favorites`, etc. Name drift causes prop-mismatch bugs across App/MovieCard/Sidebar/MovieModal.
4. **Keep planning.md in sync.** If an implementation decision diverges from the spec, update
   planning.md in the same change — code and spec must never disagree.
5. **After any code change, run `npm run build` and `npm run lint`** and confirm both are clean
   before reporting done. State failures honestly with the output.

## Architecture (canonical — must match planning.md)

```
App  (owns all list/UI state + the single fetch effect)
├── Header → SearchBar, SortControl
├── Sidebar           (All / Favorites / Watched filter)
├── MovieList → MovieCard   (click → selectedMovieId)
├── MovieModal        (mounted only when selectedMovieId !== null; owns its own fetch state)
└── Footer
```

- **State lives in App** (`movies`, `searchQuery`, `mode`, `page`, `totalPages`, `sortOption`,
  `selectedMovieId`, `isLoading`, `error`, `favorites`, `watched`, `sidebarFilter`). **MovieModal
  owns only its own fetch state** (`details`, `detailsLoading`, `detailsError`, `trailerKey`,
  `aiInsight`, `loadingInsight`).
- **One fetch effect** keyed on `[mode, searchQuery, page]`; branches on `mode`; appends
  (de-duped by id via `mergeDedupe`) when `page > 1`, else replaces.
- **Sort + sidebar filter are client-side derived** (`useMemo` → `displayedMovies`), never stored
  state, never a refetch.
- **`favorites`/`watched` are `Set<number>`** — toggle by cloning into a *new* Set so React
  re-renders (mutating in place will not).
- **API helpers:** [src/api/tmdb.js](src/api/tmdb.js) (TMDb v3, `api_key` query param;
  `posterUrl`/`backdropUrl`/`pickTrailerKey`/`mergeDedupe`) and
  [src/api/openrouter.js](src/api/openrouter.js) (single authoritative AI prompt + graceful
  fallback). Reuse these — don't re-implement fetch/URL logic inline.

## Conventions

- **Components:** one `.jsx` + co-located `.css` per component in [src/components/](src/components/).
  Functional components with hooks; arrow-function components; default export.
- **Env:** `VITE_API_KEY` (TMDb, present) and `VITE_OPENROUTER_API_KEY` (OpenRouter, must be added
  by the user). `VITE_*` vars ship to the client bundle — never hardcode a key in source, never
  paste a real key into chat or commit it. `.env` is gitignored.
- **Errors/loading/empty:** every async path shows a friendly message, never a blank or broken UI.
- **Accessibility:** alt text on posters; cards keyboard-activatable; modal has `role="dialog"`,
  focus trap, Escape/outside-click close, body scroll lock, focus-return to the opening card;
  toggle buttons use `aria-pressed`; semantic `<header>/<main>/<footer>/<aside>`.
- **ESLint:** `react/prop-types` is intentionally off (props are documented in planning.md, not
  PropTypes). Keep lint clean.

## Commands

- `npm run dev` — dev server at http://localhost:5173
- `npm run build` — production build (use to verify a change compiles)
- `npm run lint` — ESLint, must pass with zero warnings

## How to use Claude well on this project (Reviewer-in-Chief)

The student drives the spec and verifies behavior in the browser; Claude writes the spec and code.

- **Spec-first loop:** spec the milestone in planning.md → Claude restates the plan (use plan mode
  for anything touching App state or fetch logic) → implement one milestone → student verifies in
  the browser → commit per milestone with a scoped `feat:`/`fix:` message.
- **Give good context:** `@`-reference the real files; paste the relevant planning.md section;
  debug with expected-vs-actual + repro steps, not "it's broken."
- **Quality gates:** run `/code-review` on each milestone's diff (watch for Set-mutation, missing
  effect deps, duplicate keys, stale closures); `/security-review` before submit to confirm no key
  leaked.
- **Don't over-scope** — scope is locked; if time is short, cut polish, never a required feature.

## Implementation status (as of this writing)

All 9 components, both API helpers, and planning.md are implemented; build + lint pass.
Outstanding for the user: add `VITE_OPENROUTER_API_KEY` to `.env`, verify behavior in the browser,
fill in the AI Decisions Log in planning.md, and commit (nothing is committed yet).

Note: the AI "Watch Recommendation" is triggered by a **button** in the modal (lazy, to protect
free-tier quota), not auto-on-open. The assignment text describes auto-on-open — switch it if the
grader expects that.
