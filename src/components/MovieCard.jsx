import { posterUrl } from "../api/tmdb";
import "./MovieCard.css";

// One movie tile: poster, title, rating, plus favorite/watched toggles.
// The card body is a button so the whole tile is clickable and keyboard-activatable.
const MovieCard = ({
  movie,
  isFavorite,
  isWatched,
  onClick,
  onToggleFavorite,
  onToggleWatched,
}) => {
  const poster = posterUrl(movie.poster_path);
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "—";

  // Toggle handlers stop propagation so clicking a toggle doesn't open the modal.
  const handleFavorite = (e) => {
    e.stopPropagation();
    onToggleFavorite();
  };
  const handleWatched = (e) => {
    e.stopPropagation();
    onToggleWatched();
  };

  return (
    <div className={`movie-card${isWatched ? " movie-card--watched" : ""}`}>
      <button
        type="button"
        className="movie-card__body"
        onClick={onClick}
        aria-label={`View details for ${movie.title}`}
      >
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
        <div className="movie-card__info">
          <h3 className="movie-card__title">{movie.title}</h3>
          <span className="movie-card__rating" aria-label={`Rating ${rating}`}>
            ★ {rating}
          </span>
        </div>
      </button>

      <div className="movie-card__actions">
        <button
          type="button"
          className={`movie-card__toggle${isFavorite ? " is-active" : ""}`}
          onClick={handleFavorite}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {isFavorite ? "♥" : "♡"} Favorite
        </button>
        <button
          type="button"
          className={`movie-card__toggle${isWatched ? " is-active" : ""}`}
          onClick={handleWatched}
          aria-pressed={isWatched}
          aria-label={isWatched ? "Mark as not watched" : "Mark as watched"}
        >
          {isWatched ? "✓" : "○"} Watched
        </button>
      </div>
    </div>
  );
};

export default MovieCard;
