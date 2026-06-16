# Flixster — Project Spec (planning.md)

A React + Vite app showing movies now playing in theaters. It uses the TMDb API for data
and OpenRouter for an AI "Watch Recommendation." This spec is the contract every component
implements against. It is a living document, so update it whenever an implementation decision changes.

---

## 1. Component Architecture

```
App
├── Header
│   ├── (hamburger button that opens MobileNav; mobile only)
│   ├── SearchBar     (icon that expands into a field)
│   └── SortControl   (inline on desktop; hidden on mobile)
├── Sidebar           (desktop view-switcher panel; hidden at 768px and below)
├── MobileNav         (mobile drawer: view-switcher nav + Sort; opened via hamburger)
├── MovieList
│   └── MovieCard   (one per movie; click sets selectedMovieId)
├── MovieModal      (rendered only when selectedMovieId is not null)
└── Footer
```

| Component | Responsibility | Renders | Props (types) | State? |
|---|---|---|---|---|
| **App** | Owns nearly all app state and orchestrates data flow. | Layout shell: `Header`, `Sidebar`, `MovieList`, `MobileNav`, conditional `MovieModal`, `Footer`. | none (root) | Yes (all list/UI state, including `isMenuOpen`) |
| **Header** | App title; hosts the hamburger (mobile), search, and sort. | title/logo, hamburger `<button>` (mobile), `<SearchBar>`, `<SortControl>`. | `onSearchSubmit, onClearSearch, sortOption, onSortChange, onOpenMenu` | **Yes** (`isScrolled` only) |
| **SearchBar** | Search icon that expands into a field. | collapsed: `Search` icon button; expanded: `<form>` with `<input>` + submit + close. | `onSubmit, onClear` | **Yes** (`term` + `expanded`, local) |
| **SortControl** | Choose list ordering. | `<label>` + `<select>`. | `sortOption, onChange, id?` | No |
| **Sidebar** | Desktop view-switcher (All/Favorites/Watched); hidden at 768px and below. | `<aside>` with 3 filter buttons + counts (FILTERS from `filters.js`). | `sidebarFilter, onFilterChange, favoritesCount, watchedCount` | No |
| **MobileNav** | Mobile drawer: view-switcher nav + Sort; opened by the hamburger. | overlay + slide-in `role="dialog"` panel: FILTERS nav with counts, `<SortControl>`. | `open, onClose, sidebarFilter, onFilterChange, favoritesCount, watchedCount, sortOption, onSortChange` | No |
| **MovieList** | Renders the derived (filtered + sorted) movies as a grid. | grid container, `.map` to `MovieCard`, empty-state message. | `movies, favorites, watched, onCardClick, onToggleFavorite, onToggleWatched, isLoading, error` | No |
| **MovieCard** | One movie: poster/title/rating plus fav/watched/open actions. | poster `<img>`, title, vote_average, favorite + watched toggle buttons. | `movie, isFavorite, isWatched, onClick, onToggleFavorite, onToggleWatched` | No |
| **MovieModal** | Full details + trailer + AI recommendation. | `role="dialog"` overlay: backdrop, title, runtime, genres, release date, overview, YouTube `<iframe>`, AI insight; per-section loading/error. | `movieId, onClose, isFavorite, isWatched, onToggleFavorite, onToggleWatched` | **Yes** (its own fetch state) |
| **Footer** | Attribution and credits. | `<footer>` with TMDb attribution + year. | none | No |

The core components above satisfy the requirement of at least 5. The redesign adds discovery
components (`Hero`, `CategoryRow(s)`, `GenreChips`, `Skeleton`, `YouTubePlayer`)
and the `MobileNav` drawer. The mobile nav reuses `MovieModal`'s accessibility pattern
(Escape, Tab focus-trap, body scroll-lock, click-outside, focus-return).

---

## 2. State Architecture

**App-owned:**

| Var | Type | Init | Update trigger |
|---|---|---|---|
| `movies` | `Movie[]` | `[]` | After each TMDb list fetch; **append (de-duped by id)** when `page>1`, else replace. |
| `searchQuery` | `string` | `''` | `SearchBar` submit (committed query). |
| `mode` | `'nowPlaying'\|'search'` | `'nowPlaying'` | `'search'` on non-empty submit, `'nowPlaying'` on clear. |
| `page` | `number` | `1` | Load More adds 1; resets to `1` when `mode`/query changes. |
| `totalPages` | `number` | `1` | From response `total_pages`; hide Load More when `page>=totalPages`. |
| `sortOption` | `'none'\|'title-asc'\|'release-desc'\|'rating-desc'` | `'none'` | `SortControl` change. Derived view, **no refetch**. |
| `selectedMovieId` | `number\|null` | `null` | `MovieCard` click sets it; modal close clears it. Non-null renders `MovieModal`. |
| `isLoading` | `boolean` | `false` | `true` before a list fetch, `false` once it settles. |
| `error` | `string\|null` | `null` | Set on list fetch failure; cleared at the next fetch start. |
| `favorites` | `Set<number>` | `new Set()` | Toggle on fav button (clone the Set). |
| `watched` | `Set<number>` | `new Set()` | Toggle on watched button (clone the Set). |
| `sidebarFilter` | `'all'\|'favorites'\|'watched'` | `'all'` | `Sidebar` click. Derived view, **no refetch**. |

`favorites` and `watched` are **`Set<number>`** project-wide for O(1) membership. Toggle them immutably:
`setFavorites(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; })`.
They reset on reload (no persistence required; an optional localStorage polish serializes as `[...set]`).

**MovieModal-owned (local):**

| Var | Type | Init | Update trigger |
|---|---|---|---|
| `details` | `object\|null` | `null` | From `GET /movie/{id}?append_to_response=videos`. |
| `detailsLoading` | `boolean` | `true` | `true` while details are in flight. |
| `detailsError` | `string\|null` | `null` | On details fetch failure. |
| `trailerKey` | `string\|null` | `null` | First YouTube `Trailer` from `details.videos.results`. |
| `aiInsight` | `string\|null` | `null` | OpenRouter completion text (on button click). |
| `loadingInsight` | `boolean` | `false` | `true` while the AI request is in flight. |

---

## 3. Data Flow

TMDb list endpoints return `{ results, page, total_pages }`. **App** runs **one fetch effect with a
fixed dep array `[mode, searchQuery, page]`**, branching inside on `mode` to call `fetchNowPlaying(page)`
or `searchMovies(searchQuery, page)` (guard: in search mode with an empty `searchQuery`, it does not fetch). On
success it stores `results` into `movies` (append-with-dedupe when `page>1`, else replace) and copies
`total_pages`. List cards read `id, title, poster_path, vote_average, release_date` directly. The only
transforms are building the image URL at render and applying **client-side filter + sort** (a
`useMemo`-derived `displayedMovies`, **not** stored state) before passing to `MovieList`.

```
TMDb /now_playing | /search ──fetch (deps: mode,searchQuery,page)──▶ App.movies (+totalPages)
                                            │ derive: useMemo(sort(filter(movies, sidebarFilter), sortOption))
                                            ▼ displayedMovies ──▶ MovieList ──.map──▶ MovieCard
```

**Open details:** `MovieCard onClick` calls `App.onCardClick(id)`, which calls `setSelectedMovieId(id)`, which renders
`<MovieModal movieId=…>`. On mount or `movieId` change the modal makes **two requests** (with an
`ignore`-flag cleanup, since StrictMode double-invokes in dev): (1) `GET /movie/{id}?append_to_response=videos`
sets `details` and derives `trailerKey` from `details.videos.results`; (2) **when the user clicks
"Get AI Recommendation"**, a `POST` to OpenRouter sets `aiInsight`. Closing the modal (`onClose` calls
`setSelectedMovieId(null)`) unmounts it and discards local state.

**Favorites/Watched flow up:** the Sets live in App. Cards and the modal receive `isFavorite`/`isWatched` booleans
(`favorites.has(id)`) plus `onToggle*` callbacks that bubble to App's `toggleFavorite(id)`/`toggleWatched(id)`
(a new Set each time). **Sidebar filter** is controlled by `sidebarFilter` and feeds the `displayedMovies`
derivation, purely client-side with no refetch.

---

## 4. API Contracts

Constants (centralized in `src/api/tmdb.js`): `TMDB_BASE=https://api.themoviedb.org/3`,
`IMG_BASE=https://image.tmdb.org/t/p`, `POSTER_SIZE=w500`, `BACKDROP_SIZE=w1280`.
TMDb v3 auth uses `?api_key=${import.meta.env.VITE_API_KEY}&language=en-US`. Every fetch checks `res.ok`
and throws on non-2xx, which maps to a friendly `error` string.

| # | Endpoint | Method/URL | Key params | Fields used | Drives |
|---|---|---|---|---|---|
| 1 | Now Playing | GET `/movie/now_playing` | `api_key, language, page` | `page, total_pages, results[].{id,title,poster_path,vote_average,release_date}` | `movies, page, totalPages` |
| 2 | Search | GET `/search/movie` | `api_key, language, query` (URL-encoded), `page` | same shape as #1 | `movies, page, totalPages, mode` |
| 3 | Details+Videos | GET `/movie/{id}?append_to_response=videos` | `api_key, language` | `title, overview, runtime, genres[].name, release_date, backdrop_path, vote_average, videos.results[].{type,site,key,official}` | `details, trailerKey` |
| 4 | OpenRouter | POST `https://openrouter.ai/api/v1/chat/completions` | headers `Authorization: Bearer ${VITE_OPENROUTER_API_KEY}`, `Content-Type` | `choices[0].message.content` | `aiInsight` |

- List endpoints **lack** `runtime` and `genres`, which is why the modal fetches details (#3).
- **Trailer is a single call** via `append_to_response=videos`. Parse
  `details.videos.results.find(r => r.type==='Trailer' && r.site==='YouTube')?.key` (prefer `official`).
  A `null` result means "No trailer available." Embed `https://www.youtube.com/embed/${trailerKey}` in an `<iframe allowFullScreen>`.
- Images: poster `${IMG_BASE}/w500${poster_path}`, backdrop `${IMG_BASE}/w1280${backdrop_path}`.
  A `null` path uses a placeholder, never a broken `<img>`.
- **Errors:** 401 bad key shows "Invalid API key, check `.env`"; 404 shows the modal message "Details unavailable";
  an empty search `results:[]` shows the empty state (not an error); 429 shows "Too many requests, try again shortly";
  a network failure goes through try/catch into `error`/`detailsError`.

---

## 5. AI Feature Spec — "Watch Recommendation"

**Prompt spec.** Role: concise film concierge. Task: a 2 to 3 sentence recommendation. Inputs: `title`,
`genres` (comma-joined from `details.genres`), and `overview`. Output: plain text, 2 to 3 sentences, no
markdown, quotes, or preamble. Constraints: no spoilers, no first-person "I", no hype ("must-see",
"masterpiece"), and it stays grounded in the supplied data. Failure: show `"We couldn't generate a recommendation
right now — but the trailer and overview above should help you decide."` and `console.error` the real error.

**Single authoritative prompt.** `src/api/openrouter.js` implements it:

```js
const SYSTEM_PROMPT =
  "You are a concise film concierge. Given a movie's title, genres, and overview, " +
  "write a recommendation explaining who would enjoy it and why. " +
  "Rules: 2-3 sentences of plain text only (no markdown, lists, or quotes). " +
  "No spoilers, plot twists, or endings. No first person ('I'). " +
  "Avoid hype like 'must-see', 'masterpiece', or '10/10'. " +
  "Base your answer only on the supplied genres and overview; do not invent cast, awards, or sequels. " +
  "No preamble like 'Here is' or 'Sure'.";

const buildUserPrompt = ({ title, genres, overview }) =>
  `Title: ${title}\nGenres: ${genres || "Unknown"}\nOverview: ${overview || "No overview available."}\n\nWrite the recommendation now.`;
```

Body: `{ models: FREE_MODELS, messages:[system,user], temperature:0.7, max_tokens:160 }`, where
`FREE_MODELS` is `["openrouter/free"]`. That slug routes the request across OpenRouter's pool of
free models, so the app uses whichever free model is currently available without pinning a specific one.
The `models` array still supports fallthrough, so extra slugs can be added later if needed.
Parse `data?.choices?.[0]?.message?.content?.trim()` and fall back on empty. **Trigger:** lazy, behind a
"Get AI Recommendation" button (this saves free-tier quota and avoids a 429 on every modal open), so
`loadingInsight` starts `false` until the click. It resets on close when the modal unmounts.

Key security: `VITE_OPENROUTER_API_KEY` lives in `.env` (gitignored), and `.env.example` lists both var names.

### AI Feature — Decisions Log
- **What the API returned initially:** With a single pinned `:free` slug, requests intermittently hit
  429 rate limits or returned empty content when that one model was busy.
- **What I changed in my prompt:** Tightened the system prompt to forbid markdown, first person, and hype
  words, and to stay grounded in the supplied genres and overview so it stops inventing cast or sequels.
- **What fallback behavior I implemented:** Any missing key, non-2xx response, thrown error, or empty
  completion returns `FALLBACK_INSIGHT` so the UI never breaks, and the real error is logged to the console.
- **What I learned:** Switching to the `openrouter/free` pool slug instead of one pinned model made the
  call far more reliable, and keeping the request lazy behind a button kept me well under the free quota.

---

## 6. Responsive Plan

| Breakpoint | Width | Cards/row |
|---|---|---|
| Mobile | `< 600px` | 2 |
| Tablet | `600–1024px` | 3 |
| Desktop | `> 1024px` | 5 |

The base grid is `display:grid; gap:1rem;` with an explicit `grid-template-columns: repeat(N, 1fr)` per breakpoint
for deterministic counts. Posters use `aspect-ratio: 2/3` to prevent layout jank while images load.

**Mobile header (768px and below).** A hamburger button appears in the header and opens the **MobileNav** drawer
(view-switcher nav + Sort). The inline desktop **Sidebar** panel is `display:none`, and the header's
inline Sort is hidden because the drawer carries it. Search is a **search icon that expands into a field** at
all widths. Desktop (769px and up) keeps the 220px sidebar panel and inline Sort, with no hamburger.

**Hero image.** The hero billboard requests the TMDb `original` backdrop (not `w1280`) so it is not
upscaled or blurred on large displays, and it uses `object-position: center 20%` so the wide, short desktop
crop keeps faces and the title. The modal header keeps `w1280` because its 16:9 box needs no more.

**Dark palette (WCAG AA targets):** a single locked palette, **Amazon Prime Video**: `--bg #0F171E`,
`--surface #1A242F`, `--text #FFFFFF` (about 16:1 on surface), `--text-muted #AAB7C4` (about 8:1), `--accent
#00A8E1`, `--accent-ink #00121C`, `--error #FF8A80`. Body text, muted text, and accent-ink all pass AA.

---

## 7. Theming

**Single locked palette: Amazon Prime Video.** All color tokens are CSS custom properties in
[src/index.css](src/index.css) `:root`, and shape/shadow/type tokens live there too. `<html data-theme="prime">`
is kept for self-documentation. There is no theme switching (an earlier multi-theme picker was removed).

**`--bg-rgb` rule.** `:root` defines `--bg` **and** its RGB triplet `--bg-rgb`. Background-derived overlays
(header gradient + scrolled bar, hero side-scrim and nav buttons, category-row arrows) use
`rgba(var(--bg-rgb), X)` so opacity composites over the real background color. **Keep `--bg-rgb` in sync
with `--bg`.** Media and content overlays meant to stay constant (the `#000` behind video, the white glass hero/header
controls, and the black modal/badge scrims) are intentionally left literal.

---

## 8. Deployment (Render static site)

Deployed as a **Render Static Site** via [render.yaml](render.yaml) (Blueprint / config-as-code):

- **Type:** `type: web` + `runtime: static`. **Build:** `npm install && npm run build`.
  **Publish dir:** `./dist`. **Branch:** `main` (auto-deploys on every push).
- **SPA fallback:** a `routes` rewrite (`source: /*` to `destination: /index.html`) so reloads and deep
  links resolve. There is no client router today, but this keeps deep links robust and is standard for Vite SPAs.
- **Env vars:** `VITE_API_KEY` + `VITE_OPENROUTER_API_KEY` declared with `sync: false`, so values are set in
  the Render dashboard and never committed. **Caveat:** `VITE_` vars are baked into the client bundle at build
  time, so they ship publicly in the JS. That is acceptable for the free-tier TMDb/OpenRouter keys here, but a
  production app would proxy these through a backend. The AI helper sends `HTTP-Referer:
  window.location.origin` so attribution reflects the deployed URL rather than `localhost`.
