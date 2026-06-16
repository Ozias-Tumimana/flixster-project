import MovieCard from "./MovieCard";
import Skeleton from "./Skeleton";
import "./MovieList.css";

// Renders the already-derived (filtered + sorted) movie array as a responsive grid.
// Owns no state; surfaces loading / error / empty states passed down from App.
const MovieList = ({
  movies,
  favorites,
  watched,
  onCardClick,
  onToggleFavorite,
  onToggleWatched,
  isLoading,
  error,
  emptyMessage = "No movies to show.",
}) => {
  if (error) {
    return (
      <p className="movie-list__message movie-list__message--error" role="alert">
        {error}
      </p>
    );
  }

  if (isLoading && movies.length === 0) {
    return <Skeleton variant="grid" count={10} />;
  }

  if (movies.length === 0) {
    return <p className="movie-list__message">{emptyMessage}</p>;
  }

  return (
    <div className="movie-list">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          isFavorite={favorites.has(movie.id)}
          isWatched={watched.has(movie.id)}
          onClick={() => onCardClick(movie.id)}
          onToggleFavorite={() => onToggleFavorite(movie.id)}
          onToggleWatched={() => onToggleWatched(movie.id)}
        />
      ))}
    </div>
  );
};

export default MovieList;
