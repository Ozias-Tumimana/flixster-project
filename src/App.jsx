import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { X } from "lucide-react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import Hero from "./components/Hero";
import GenreChips from "./components/GenreChips";
import CategoryRows from "./components/CategoryRows";
import MovieList from "./components/MovieList";
import MovieModal from "./components/MovieModal";
import Footer from "./components/Footer";
import {
  fetchNowPlaying,
  searchMovies,
  mergeDedupe,
  fetchTopRated,
  fetchTrending,
  fetchPopular,
  fetchGenres,
} from "./api/tmdb";
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
  const [genreFilter, setGenreFilter] = useState(null); // null = all genres
  const [isMenuOpen, setIsMenuOpen] = useState(false); // mobile nav drawer

  // --- Discovery layers (rows + genre chips), fetched once on mount ---
  const [topRated, setTopRated] = useState([]);
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [rowsError, setRowsError] = useState(null);
  const [genres, setGenres] = useState([]);

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

  // Category rows — fetched once on mount, independent of the list effect.
  useEffect(() => {
    let ignore = false;
    setRowsLoading(true);
    setRowsError(null);

    Promise.all([fetchTrending(), fetchTopRated(), fetchPopular()])
      .then(([trend, top, pop]) => {
        if (ignore) return;
        setTrending(trend.results ?? []);
        setTopRated(top.results ?? []);
        setPopular(pop.results ?? []);
      })
      .catch((err) => {
        if (!ignore) setRowsError(err.message || "Couldn't load categories.");
      })
      .finally(() => {
        if (!ignore) setRowsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Genre list for the filter chips — fetched once on mount.
  useEffect(() => {
    let ignore = false;
    fetchGenres()
      .then((data) => {
        if (!ignore) setGenres(data.genres ?? []);
      })
      .catch(() => {
        if (!ignore) setGenres([]); // chips simply won't render
      });
    return () => {
      ignore = true;
    };
  }, []);

  // --- Search handlers ---
  const handleSearchSubmit = useCallback((query) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchQuery(trimmed);
    setMode("search");
    setPage(1);
    setMovies([]);
    setGenreFilter(null); // genre chips are a Now-Playing-only control
    setSidebarFilter("all"); // search shows all results, not a fav/watched subset
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

  // Picking a view (All/Favorites/Watched) is a top-level nav action. Unlike the
  // desktop sidebar (hidden during search), the drawer is reachable while
  // searching — so leave search first, then apply the filter, avoiding a
  // "Results for X" heading over a favorites/watched-filtered grid.
  const handleSelectView = useCallback(
    (key) => {
      if (mode === "search") handleClearSearch();
      setSidebarFilter(key);
    },
    [mode, handleClearSearch]
  );

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

  // --- Mobile nav drawer (same focus-return pattern as the modal) ---
  const openMenu = useCallback(() => {
    lastTriggerRef.current = document.activeElement;
    setIsMenuOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
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

  // Derived display list: filter by sidebar, then genre, then sort.
  // Never stored as state.
  const displayedMovies = useMemo(() => {
    let list = movies;
    if (sidebarFilter === "favorites") {
      list = list.filter((m) => favorites.has(m.id));
    } else if (sidebarFilter === "watched") {
      list = list.filter((m) => watched.has(m.id));
    }

    // Genre chips only exist in the Browse view, so only filter by genre there
    // (never invisibly narrow the favorites/watched/search lists).
    if (genreFilter !== null && sidebarFilter === "all" && mode === "nowPlaying") {
      list = list.filter((m) => m.genre_ids?.includes(genreFilter));
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
  }, [movies, mode, sidebarFilter, genreFilter, sortOption, favorites, watched]);

  // The sidebar acts as a view-switcher. The "Browse" view (all + not searching)
  // is the only place the discovery chrome (hero, rows, genre chips) and Load
  // More appear; favorites/watched are focused list views.
  const isSearching = mode === "search";
  const isBrowseView = sidebarFilter === "all" && !isSearching;

  // Load More only makes sense while browsing/searching the paginated source list,
  // not in the client-side favorites/watched views.
  const canLoadMore = page < totalPages && sidebarFilter === "all";

  // Counts shown next to the sidebar filters reflect what's actually displayed
  // (favorites/watched are scoped to the loaded movies), so the number always
  // matches the grid — including during a search.
  const displayedFavCount = useMemo(
    () => movies.filter((m) => favorites.has(m.id)).length,
    [movies, favorites]
  );
  const displayedWatchedCount = useMemo(
    () => movies.filter((m) => watched.has(m.id)).length,
    [movies, watched]
  );

  // Heading reflects the active view.
  const sectionTitle = isSearching
    ? `Results for "${searchQuery}"`
    : sidebarFilter === "favorites"
    ? "Your Favorites"
    : sidebarFilter === "watched"
    ? "Your Watchlist"
    : "In Theaters";

  const emptyMessage = useMemo(() => {
    if (sidebarFilter === "favorites") return "You haven't favorited any of these movies yet.";
    if (sidebarFilter === "watched") return "You haven't marked any of these movies as watched yet.";
    if (genreFilter !== null) return "No movies in this genre yet — try Load More.";
    if (mode === "search") return `No movies found for "${searchQuery}".`;
    return "No movies to show.";
  }, [sidebarFilter, genreFilter, mode, searchQuery]);

  return (
    <div className="app">
      <Header
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={handleClearSearch}
        sortOption={sortOption}
        onSortChange={setSortOption}
        onOpenMenu={openMenu}
      />

      {/* Discovery hero (full-bleed) — Browse view only. */}
      {isBrowseView && (
        <Hero
          movies={movies}
          isFavorite={(id) => favorites.has(id)}
          onViewDetails={handleCardClick}
          onToggleFavorite={toggleFavorite}
        />
      )}

      <main className={`app__main${isSearching ? " app__main--full" : ""}`}>
        {/* Sidebar is a browse-mode view switcher; hidden during search so its
            favorites/watched filters don't silently scope the search results. */}
        {!isSearching && (
          <Sidebar
            sidebarFilter={sidebarFilter}
            onFilterChange={handleSelectView}
            favoritesCount={displayedFavCount}
            watchedCount={displayedWatchedCount}
          />
        )}

        <div className="app__content">
          {/* Category rows — Browse view only; use different endpoints
              than the grid so no list is shown twice. */}
          {isBrowseView && (
            <CategoryRows
              topRated={topRated}
              trending={trending}
              popular={popular}
              isLoading={rowsLoading}
              error={rowsError}
              favorites={favorites}
              watched={watched}
              onCardClick={handleCardClick}
              onToggleFavorite={toggleFavorite}
              onToggleWatched={toggleWatched}
            />
          )}

          <div className="app__section-head">
            <h2 className="app__section-title">{sectionTitle}</h2>
            {isSearching && (
              <button
                type="button"
                className="app__clear-search"
                onClick={handleClearSearch}
              >
                <X size={16} aria-hidden="true" /> Clear search
              </button>
            )}
          </div>

          {/* Genre chips filter the grid in place — Browse view only. */}
          {isBrowseView && (
            <GenreChips
              genres={genres}
              activeGenre={genreFilter}
              onSelectGenre={setGenreFilter}
            />
          )}

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

      <MobileNav
        open={isMenuOpen}
        onClose={closeMenu}
        sidebarFilter={sidebarFilter}
        onFilterChange={handleSelectView}
        favoritesCount={displayedFavCount}
        watchedCount={displayedWatchedCount}
        sortOption={sortOption}
        onSortChange={setSortOption}
      />

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
