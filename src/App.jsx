import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MovieList from "./components/MovieList";
import MovieModal from "./components/MovieModal";
import Footer from "./components/Footer";
import { fetchNowPlaying, searchMovies, mergeDedupe } from "./api/tmdb";
import "./App.css";

const App = () => {
  // --- List / fetch state (planning.md §2, App-owned) ---
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [mode, setMode] = useState("nowPlaying"); // 'nowPlaying' | 'search'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- UI / derived-view state ---
  const [sortOption, setSortOption] = useState("none");
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [sidebarFilter, setSidebarFilter] = useState("all");

  // Remembers the element that opened the modal, so focus can return to it on close.
  const lastTriggerRef = useRef(null);

  // --- Favorites / watched (Set<number>, toggled immutably) ---
  const [favorites, setFavorites] = useState(() => new Set());
  const [watched, setWatched] = useState(() => new Set());

  // Single fetch effect keyed on (mode, searchQuery, page). Branches on mode;
  // guards against an empty search query. Appends (de-duped) when paging.
  useEffect(() => {
    if (mode === "search" && !searchQuery) return;

    let ignore = false;
    setIsLoading(true);
    setError(null);

    const request =
      mode === "search"
        ? searchMovies(searchQuery, page)
        : fetchNowPlaying(page);

    request
      .then((data) => {
        if (ignore) return;
        const results = data.results ?? [];
        setMovies((prev) => (page > 1 ? mergeDedupe(prev, results) : results));
        setTotalPages(data.total_pages ?? 1);
      })
      .catch((err) => {
        if (ignore) return;
        setError(err.message || "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [mode, searchQuery, page]);

  // --- Search handlers ---
  const handleSearchSubmit = useCallback((query) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchQuery(trimmed);
    setMode("search");
    setPage(1);
    setMovies([]);
  }, []);

  const handleClearSearch = useCallback(() => {
    // Already showing Now Playing — nothing to clear (and wiping movies here
    // wouldn't change the fetch-effect deps, so the list would never refetch).
    if (mode === "nowPlaying") return;
    setSearchQuery("");
    setMode("nowPlaying");
    setPage(1);
    setMovies([]);
  }, [mode]);

  // --- Modal open/close (stable callbacks; focus returns to the opening card) ---
  const handleCardClick = useCallback((id) => {
    lastTriggerRef.current = document.activeElement;
    setSelectedMovieId(id);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedMovieId(null);
    // Restore focus to the card that opened the modal (WCAG 2.4.3).
    lastTriggerRef.current?.focus?.();
  }, []);

  // --- Favorites / watched toggles (new Set each time → re-render) ---
  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleWatched = useCallback((id) => {
    setWatched((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // Derived display list: filter by sidebar, then sort. Never stored as state.
  const displayedMovies = useMemo(() => {
    let list = movies;
    if (sidebarFilter === "favorites") {
      list = list.filter((m) => favorites.has(m.id));
    } else if (sidebarFilter === "watched") {
      list = list.filter((m) => watched.has(m.id));
    }

    if (sortOption !== "none") {
      list = [...list].sort((a, b) => {
        if (sortOption === "title-asc")
          return (a.title || "").localeCompare(b.title || "");
        if (sortOption === "release-desc")
          return (b.release_date || "").localeCompare(a.release_date || "");
        if (sortOption === "rating-desc")
          return (b.vote_average || 0) - (a.vote_average || 0);
        return 0;
      });
    }
    return list;
  }, [movies, sidebarFilter, sortOption, favorites, watched]);

  // More pages can always be loaded while they exist; sort/filter are client-side
  // over the loaded movies, so paging just gives them more to work with.
  const canLoadMore = page < totalPages;

  const emptyMessage = useMemo(() => {
    if (sidebarFilter === "favorites") return "You haven't favorited any movies yet.";
    if (sidebarFilter === "watched") return "You haven't marked any movies as watched yet.";
    if (mode === "search") return `No movies found for "${searchQuery}".`;
    return "No movies to show.";
  }, [sidebarFilter, mode, searchQuery]);

  return (
    <div className="app">
      <Header
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={handleClearSearch}
        sortOption={sortOption}
        onSortChange={setSortOption}
      />

      <main className="app__main">
        <Sidebar
          sidebarFilter={sidebarFilter}
          onFilterChange={setSidebarFilter}
          favoritesCount={favorites.size}
          watchedCount={watched.size}
        />

        <div className="app__content">
          <MovieList
            movies={displayedMovies}
            favorites={favorites}
            watched={watched}
            onCardClick={handleCardClick}
            onToggleFavorite={toggleFavorite}
            onToggleWatched={toggleWatched}
            isLoading={isLoading}
            error={error}
            emptyMessage={emptyMessage}
          />

          {canLoadMore && (
            <div className="app__load-more">
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={isLoading}
              >
                {isLoading ? "Loading…" : "Load More"}
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {selectedMovieId !== null && (
        <MovieModal
          key={selectedMovieId}
          movieId={selectedMovieId}
          onClose={handleCloseModal}
          isFavorite={favorites.has(selectedMovieId)}
          isWatched={watched.has(selectedMovieId)}
          onToggleFavorite={() => toggleFavorite(selectedMovieId)}
          onToggleWatched={() => toggleWatched(selectedMovieId)}
        />
      )}
    </div>
  );
};

export default App;
