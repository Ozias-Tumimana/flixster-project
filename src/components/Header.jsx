import { useState, useEffect } from "react";
import { Clapperboard, Menu } from "lucide-react";
import SearchBar from "./SearchBar";
import SortControl from "./SortControl";
import "./Header.css";

// Presentational shell: app title + the search and sort controls.
// Sticky header (feature D): transparent over the hero, solid once scrolled.
// On mobile a hamburger (left, Prime-style) opens the MobileNav drawer and the
// inline SortControl is hidden (the drawer carries it).
const Header = ({
  onSearchSubmit,
  onClearSearch,
  sortOption,
  onSortChange,
  onOpenMenu,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    onScroll(); // sync initial state (e.g. on reload mid-page)
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`header${isScrolled ? " header--scrolled" : ""}`}>
      <button
        type="button"
        className="header__menu-btn"
        onClick={onOpenMenu}
        aria-label="Open menu"
      >
        <Menu size={24} aria-hidden="true" />
      </button>

      <div className="header__brand">
        <h1 className="header__title">
          <Clapperboard size={26} aria-hidden="true" /> Flixster
        </h1>
        <p className="header__tagline">Now playing in theaters</p>
      </div>
      <div className="header__controls">
        <SearchBar onSubmit={onSearchSubmit} onClear={onClearSearch} />
        <SortControl sortOption={sortOption} onChange={onSortChange} />
      </div>
    </header>
  );
};

export default Header;
