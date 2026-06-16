import "./GenreChips.css";

// Genre filter chips (feature C). Controlled by App's genreFilter (null = All).
// Filters the displayed grid client-side via movie.genre_ids — no refetch.
const GenreChips = ({ genres, activeGenre, onSelectGenre }) => {
  if (!genres || genres.length === 0) return null;

  return (
    <div className="genre-chips" role="group" aria-label="Filter by genre">
      <button
        type="button"
        className={`genre-chip${activeGenre === null ? " is-active" : ""}`}
        aria-pressed={activeGenre === null}
        onClick={() => onSelectGenre(null)}
      >
        All
      </button>
      {genres.map((g) => (
        <button
          key={g.id}
          type="button"
          className={`genre-chip${activeGenre === g.id ? " is-active" : ""}`}
          aria-pressed={activeGenre === g.id}
          onClick={() => onSelectGenre(g.id)}
        >
          {g.name}
        </button>
      ))}
    </div>
  );
};

export default GenreChips;
