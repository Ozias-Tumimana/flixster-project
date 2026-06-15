import { useState } from "react";
import "./SearchBar.css";

// Controlled search input. Holds its own draft text locally; only commits the
// query up to App on submit (App owns the committed searchQuery + mode).
const SearchBar = ({ onSubmit, onClear }) => {
  const [term, setTerm] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(term);
  };

  const handleClear = () => {
    setTerm("");
    onClear();
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <input
        type="text"
        className="search-bar__input"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search movies…"
        aria-label="Search movies"
      />
      <button type="submit" className="search-bar__btn">
        Search
      </button>
      <button
        type="button"
        className="search-bar__btn search-bar__btn--ghost"
        onClick={handleClear}
      >
        Now Playing
      </button>
    </form>
  );
};

export default SearchBar;
