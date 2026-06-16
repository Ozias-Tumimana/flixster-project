import { FILTERS } from "./filters";
import "./Sidebar.css";

// View switcher: "All Movies" is the browse view; favorites/watched are focused
// list views. Controlled by App's sidebarFilter; filtering is client-side.
const Sidebar = ({ sidebarFilter, onFilterChange, favoritesCount, watchedCount }) => {
  const countFor = (key) =>
    key === "favorites" ? favoritesCount : key === "watched" ? watchedCount : null;

  return (
    <aside className="sidebar" aria-label="Filter movies">
      <h2 className="sidebar__heading">Browse</h2>
      <nav className="sidebar__nav">
        {FILTERS.map(({ key, label, Icon }) => {
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
              <span className="sidebar__label">
                <Icon size={16} aria-hidden="true" /> {label}
              </span>
              {count !== null && <span className="sidebar__count">{count}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
