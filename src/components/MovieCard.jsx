import { Heart, Eye, Star, ChevronRight } from "lucide-react";
import { posterUrl } from "../api/tmdb";
import "./MovieCard.css";

// "NEW" if released within the last 45 days (feature F).
function isNewRelease(releaseDate) {
  if (!releaseDate) return false;
  const released = new Date(releaseDate);
  if (Number.isNaN(released.getTime())) return false;
  const days = (Date.now() - released.getTime()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 45;
}

// One movie tile: poster, title, rating, plus favorite/watched toggles.
// A single absolutely-positioned "stretched" button covers the card and opens
// the modal (kept empty so it holds only phrasing content — valid HTML). The
// toggle buttons sit above it via z-index. Hover/keyboard-focus reveals the
// overview overlay (feature E). `rank` renders a TOP-10 numeral (feature F).
const MovieCard = ({
  movie,
  isFavorite,
  isWatched,
  rank,
  onClick,
  onToggleFavorite,
  onToggleWatched,
}) => {
  const poster = posterUrl(movie.poster_path);
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "—";
  const showRank = typeof rank === "number" && rank <= 10;
  const showNew = isNewRelease(movie.release_date);
  const topRated = movie.vote_average >= 8;

  return (
    <div className={`movie-card${isWatched ? " movie-card--watched" : ""}`}>
      {/* Stretched click target — opens the modal; empty for valid HTML. */}
      <button
        type="button"
        className="movie-card__link"
        onClick={onClick}
        aria-label={`View details for ${movie.title}`}
      />

      <div className="movie-card__poster-wrap">
        {poster ? (
          <img
            className="movie-card__poster"
            src={poster}
            alt={`Poster for ${movie.title}`}
            loading="lazy"
          />
        ) : (
          <div className="movie-card__poster movie-card__poster--placeholder">
            No poster
          </div>
        )}

        {/* Badges (feature F) — non-interactive overlays. */}
        {showRank && <span className="movie-card__rank">{rank}</span>}
        <div className="movie-card__badges">
          {showNew && (
            <span className="movie-card__badge movie-card__badge--new">NEW</span>
          )}
          {topRated && (
            <span className="movie-card__badge movie-card__badge--top">
              TOP RATED
            </span>
          )}
        </div>

        {/* Hover/focus overlay (feature E) — overview + a details cue. */}
        <div className="movie-card__hover">
          <p className="movie-card__overview">
            {movie.overview || "No overview available."}
          </p>
          <span className="movie-card__cue">
            View Details <ChevronRight size={14} aria-hidden="true" />
          </span>
        </div>
      </div>

      <div className="movie-card__info">
        <h3 className="movie-card__title">{movie.title}</h3>
        <span className="movie-card__rating" aria-label={`Rating ${rating}`}>
          <Star size={14} fill="currentColor" aria-hidden="true" /> {rating}
        </span>
      </div>

      <div className="movie-card__actions">
        <button
          type="button"
          className={`movie-card__toggle${isFavorite ? " is-active" : ""}`}
          onClick={onToggleFavorite}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            size={15}
            fill={isFavorite ? "currentColor" : "none"}
            aria-hidden="true"
          />{" "}
          Favorite
        </button>
        <button
          type="button"
          className={`movie-card__toggle${isWatched ? " is-active" : ""}`}
          onClick={onToggleWatched}
          aria-pressed={isWatched}
          aria-label={isWatched ? "Mark as not watched" : "Mark as watched"}
        >
          <Eye size={15} aria-hidden="true" /> Watched
        </button>
      </div>
    </div>
  );
};

export default MovieCard;
