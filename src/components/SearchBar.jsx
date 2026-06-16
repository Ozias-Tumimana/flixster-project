import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import "./SearchBar.css";

// Search affordance modeled on Prime Video: a search icon that expands into a
// field. Holds its own draft text + expanded state locally; only the committed
// query bubbles up to App on submit (App owns searchQuery + mode).
const SearchBar = ({ onSubmit, onClear }) => {
  const [term, setTerm] = useState("");
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef(null);
  const toggleRef = useRef(null);
  const didMount = useRef(false);

  // Move focus with the disclosure: into the field when it opens, back to the
  // search icon when it closes — but never steal focus on the first render.
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    if (expanded) inputRef.current?.focus();
    else toggleRef.current?.focus();
  }, [expanded]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(term);
  };

  // Collapse + clear the draft; also returns to Now Playing if a search is active
  // (onClear is a no-op in App when already on Now Playing).
  const collapse = () => {
    setTerm("");
    setExpanded(false);
    onClear();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") collapse();
  };

  if (!expanded) {
    return (
      <button
        type="button"
        className="search-bar__toggle"
        onClick={() => setExpanded(true)}
        aria-label="Search movies"
        aria-expanded={false}
        ref={toggleRef}
      >
        <Search size={20} aria-hidden="true" />
      </button>
    );
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <input
        type="text"
        className="search-bar__input"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search movies…"
        aria-label="Search movies"
        ref={inputRef}
      />
      <button type="submit" className="search-bar__btn">
        Search
      </button>
      <button
        type="button"
        className="search-bar__close"
        onClick={collapse}
        aria-label="Close search"
      >
        <X size={18} aria-hidden="true" />
      </button>
    </form>
  );
};

export default SearchBar;
