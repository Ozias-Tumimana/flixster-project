import "./SortControl.css";

// Sort dropdown. Controlled by App's sortOption; sorting is a client-side
// derived view (no refetch). Note: Load More is hidden while a sort is active,
// since sorting only orders the currently-loaded movies.
const SortControl = ({ sortOption, onChange }) => (
  <div className="sort-control">
    <label htmlFor="sort-select" className="sort-control__label">
      Sort by
    </label>
    <select
      id="sort-select"
      className="sort-control__select"
      value={sortOption}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="none">None</option>
      <option value="title-asc">Title (A–Z)</option>
      <option value="release-desc">Release Date (Newest)</option>
      <option value="rating-desc">Vote Average (Highest)</option>
    </select>
  </div>
);

export default SortControl;
