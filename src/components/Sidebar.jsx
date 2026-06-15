import "./Sidebar.css";

// Filter panel: narrows the displayed list to all / favorites / watched.
// Controlled by App's sidebarFilter; filtering is client-side (no refetch).
const FILTERS = [
  { key: "all", label: "All Movies" },
  { key: "favorites", label: "Favorites" },
  { key: "watched", label: "Watched" },
];

const Sidebar = ({ sidebarFilter, onFilterChange, favoritesCount, watchedCount }) => {
  const countFor = (key) =>
    key === "favorites" ? favoritesCount : key === "watched" ? watchedCount : null;

  return (
    <aside className="sidebar" aria-label="Filter movies">
      <h2 className="sidebar__heading">Filter</h2>
      <nav className="sidebar__nav">
        {FILTERS.map(({ key, label }) => {
          const count = countFor(key);
          const active = sidebarFilter === key;
          return (
            <button
              key={key}
              type="button"
              className={`sidebar__btn${active ? " is-active" : ""}`}
              aria-pressed={active}
              onClick={() => onFilterChange(key)}
            >
              {label}
              {count !== null && <span className="sidebar__count">{count}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
