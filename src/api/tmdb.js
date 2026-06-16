// Centralized TMDb API helpers and image/URL constants.
// All requests use TMDb v3 auth (api_key query param) per planning.md §4.

export const TMDB_BASE = "https://api.themoviedb.org/3";
export const IMG_BASE = "https://image.tmdb.org/t/p";
export const POSTER_SIZE = "w500";
export const BACKDROP_SIZE = "w1280";

const API_KEY = import.meta.env.VITE_API_KEY;

// Build a full poster/backdrop URL, or null when the path is missing
// (callers render a placeholder rather than a broken <img>).
export function posterUrl(path) {
  return path ? `${IMG_BASE}/${POSTER_SIZE}${path}` : null;
}

// `size` defaults to w1280 (modal header); the hero passes "original" so the
// full-bleed billboard isn't upscaled/blurred on large displays.
export function backdropUrl(path, size = BACKDROP_SIZE) {
  return path ? `${IMG_BASE}/${size}${path}` : null;
}

// Maps an HTTP status to a friendly message shown in the UI.
function messageForStatus(status) {
  if (status === 401) return "Invalid API key — check your .env file.";
  if (status === 404) return "Not found.";
  if (status === 429) return "Too many requests, try again shortly.";
  return `Request failed (${status}).`;
}

// Wraps fetch so non-2xx responses throw a friendly Error.
async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(messageForStatus(res.status));
  }
  return res.json();
}

export function fetchNowPlaying(page = 1) {
  const url = `${TMDB_BASE}/movie/now_playing?api_key=${API_KEY}&language=en-US&page=${page}`;
  return getJson(url);
}

export function searchMovies(query, page = 1) {
  const url = `${TMDB_BASE}/search/movie?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(
    query
  )}&page=${page}`;
  return getJson(url);
}

export function fetchMovieDetails(id) {
  const url = `${TMDB_BASE}/movie/${id}?api_key=${API_KEY}&language=en-US&append_to_response=videos`;
  return getJson(url);
}

// --- Discovery endpoints (category rows + genre chips) ---

export function fetchTopRated(page = 1) {
  const url = `${TMDB_BASE}/movie/top_rated?api_key=${API_KEY}&language=en-US&page=${page}`;
  return getJson(url);
}

export function fetchTrending() {
  const url = `${TMDB_BASE}/trending/movie/week?api_key=${API_KEY}&language=en-US`;
  return getJson(url);
}

export function fetchPopular(page = 1) {
  const url = `${TMDB_BASE}/movie/popular?api_key=${API_KEY}&language=en-US&page=${page}`;
  return getJson(url);
}

// Returns the TMDb genre list as [{ id, name }, ...].
export function fetchGenres() {
  const url = `${TMDB_BASE}/genre/movie/list?api_key=${API_KEY}&language=en-US`;
  return getJson(url);
}

// Picks the best YouTube trailer key from a details.videos.results array.
// Prefers an official Trailer, then any Trailer, then any YouTube video.
export function pickTrailerKey(videos) {
  const results = videos?.results ?? [];
  const youtube = results.filter((v) => v.site === "YouTube");
  const official = youtube.find((v) => v.type === "Trailer" && v.official);
  const trailer = youtube.find((v) => v.type === "Trailer");
  const any = youtube[0];
  return (official || trailer || any)?.key ?? null;
}

// Append a new page of results to an existing list, de-duped by id.
// TMDb now_playing can repeat movies across pages, which would otherwise
// produce duplicate React keys.
export function mergeDedupe(prev, next) {
  const byId = new Map(prev.map((m) => [m.id, m]));
  for (const m of next) {
    if (!byId.has(m.id)) byId.set(m.id, m);
  }
  return Array.from(byId.values());
}
