import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MovieCard from "./MovieCard";
import Skeleton from "./Skeleton";
import "./CategoryRow.css";

// One horizontally-scrolling category row (feature B). Reuses MovieCard and the
// shared modal/favorites callbacks. `ranked` shows TOP-10 numerals (e.g. Trending).
const CategoryRow = ({
  title,
  movies,
  isLoading,
  error,
  favorites,
  watched,
  ranked = false,
  onCardClick,
  onToggleFavorite,
  onToggleWatched,
}) => {
  const scrollerRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateArrows();
  }, [movies, updateArrows]);

  const scrollBy = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="category-row" aria-label={title}>
      <h2 className="category-row__title">{title}</h2>

      {error ? (
        <p className="category-row__message" role="alert">
          {error}
        </p>
      ) : isLoading ? (
        <Skeleton variant="row" count={8} />
      ) : movies.length === 0 ? (
        <p className="category-row__message">Nothing to show.</p>
      ) : (
        <div className="category-row__viewport">
          <button
            type="button"
            className={`category-row__arrow category-row__arrow--left${
              canLeft ? "" : " is-hidden"
            }`}
            aria-label={`Scroll ${title} left`}
            onClick={() => scrollBy(-1)}
          >
            <ChevronLeft size={28} aria-hidden="true" />
          </button>

          <div
            className="category-row__scroller"
            ref={scrollerRef}
            onScroll={updateArrows}
          >
            {movies.map((movie, i) => (
              <div className="category-row__item" key={movie.id}>
                <MovieCard
                  movie={movie}
                  isFavorite={favorites.has(movie.id)}
                  isWatched={watched.has(movie.id)}
                  rank={ranked ? i + 1 : undefined}
                  onClick={() => onCardClick(movie.id)}
                  onToggleFavorite={() => onToggleFavorite(movie.id)}
                  onToggleWatched={() => onToggleWatched(movie.id)}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            className={`category-row__arrow category-row__arrow--right${
              canRight ? "" : " is-hidden"
            }`}
            aria-label={`Scroll ${title} right`}
            onClick={() => scrollBy(1)}
          >
            <ChevronRight size={28} aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
};

export default CategoryRow;
