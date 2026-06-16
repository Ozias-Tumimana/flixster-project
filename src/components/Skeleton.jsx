import "./Skeleton.css";

// Shimmer placeholders shown while data loads (feature G).
// variant "grid" → a grid of card-shaped skeletons (matches .movie-list layout).
// variant "row"  → a horizontal strip of card skeletons (for CategoryRow).
// variant "hero" → one large billboard-shaped block.
const Skeleton = ({ variant = "grid", count = 10 }) => {
  if (variant === "hero") {
    return <div className="skeleton skeleton--hero" aria-hidden="true" />;
  }

  const className =
    variant === "row" ? "skeleton-row" : "skeleton-grid movie-list";

  return (
    <div className={className} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton skeleton--card" key={i}>
          <div className="skeleton__poster" />
          <div className="skeleton__line skeleton__line--title" />
          <div className="skeleton__line skeleton__line--meta" />
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
