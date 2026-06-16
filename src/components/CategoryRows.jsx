import CategoryRow from "./CategoryRow";

// Container for the discovery rows (feature B). Keeps App lean by mapping the
// three category arrays into CategoryRow, passing through the shared callbacks.
const CategoryRows = ({
  topRated,
  trending,
  popular,
  isLoading,
  error,
  favorites,
  watched,
  onCardClick,
  onToggleFavorite,
  onToggleWatched,
}) => {
  const shared = {
    isLoading,
    error,
    favorites,
    watched,
    onCardClick,
    onToggleFavorite,
    onToggleWatched,
  };

  return (
    <div className="category-rows">
      <CategoryRow title="Trending This Week" movies={trending} ranked {...shared} />
      <CategoryRow title="Top Rated" movies={topRated} {...shared} />
      <CategoryRow title="Popular" movies={popular} {...shared} />
    </div>
  );
};

export default CategoryRows;
