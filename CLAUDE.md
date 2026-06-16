# CLAUDE.md — Flixster

Guidance for Claude when working in this repo.

## What this project is

Flixster is a React 18 + Vite app that shows movies now playing in theaters (TMDb API)
with search, sort, a details modal, favorites/watched, a sidebar filter, embedded YouTube
trailers, and an AI "Watch Recommendation" (OpenRouter). It is a CodePath assignment graded
against a written spec the student authored *before* implementation.

- **Stack:** React 18.2, Vite 5, Node 24. No router, no backend, no test runner configured.
- **Scope:** all required features + AI Watch Recommendation + stretch (favorites, watched,
  sidebar filter, embedded trailer) + **Render static-site deployment** ([render.yaml](render.yaml)).
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
├── Header → hamburger (mobile, → MobileNav), SearchBar (icon-expand), SortControl
├── Sidebar           (desktop All / Favorites / Watched view-switcher; hidden ≤768px)
├── MobileNav         (mobile drawer: same view-switcher + Sort; opened by hamburger)
├── MovieList → MovieCard   (click → selectedMovieId)
├── MovieModal        (mounted only when selectedMovieId !== null; owns its own fetch state)
└── Footer
```

- **State lives in App** (`movies`, `searchQuery`, `mode`, `page`, `totalPages`, `sortOption`,
  `selectedMovieId`, `isLoading`, `error`, `favorites`, `watched`, `sidebarFilter`, `isMenuOpen`).
  Exceptions: **MovieModal** owns its own fetch state (`details`, `detailsLoading`, `detailsError`,
  `trailerKey`, `aiInsight`, `loadingInsight`); **SearchBar** owns its local `term` + `expanded`
  (only the committed query bubbles up). `MobileNav` and `Sidebar` share `FILTERS` from
  [src/components/filters.js](src/components/filters.js).
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
- **Theming:** single locked palette (Amazon Prime Video) — all color tokens in `:root` of
  [src/index.css](src/index.css); see planning.md §7. Use the color tokens, never raw hex.
  Background-derived overlays must use `rgba(var(--bg-rgb), X)`, and **`--bg-rgb` must stay in sync with
  `--bg`**. (Media/content overlays that should stay constant — `#000` behind video, white glass
  hero/header controls, black modal/badge scrims — are intentionally literal.)
- **Responsive nav:** desktop (≥769px) shows the `Sidebar` panel + inline `SortControl`; mobile (≤768px)
  hides both and uses the header hamburger → `MobileNav` drawer, which reuses `MovieModal`'s a11y pattern
  (Escape, Tab focus-trap, body scroll-lock, click-outside, focus-return via App's `lastTriggerRef`).
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
