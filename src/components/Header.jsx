import SearchBar from "./SearchBar";
import SortControl from "./SortControl";
import "./Header.css";

// Presentational shell: app title + the search and sort controls.
const Header = ({ onSearchSubmit, onClearSearch, sortOption, onSortChange }) => (
  <header className="header">
    <div className="header__brand">
      <h1 className="header__title">🎬 Flixster</h1>
      <p className="header__tagline">Now playing in theaters</p>
    </div>
    <div className="header__controls">
      <SearchBar onSubmit={onSearchSubmit} onClear={onClearSearch} />
      <SortControl sortOption={sortOption} onChange={onSortChange} />
    </div>
  </header>
);

export default Header;
