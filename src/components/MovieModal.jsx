import { useState, useEffect, useRef, useCallback } from "react";
import { X, Sparkles, Heart, Eye, Star } from "lucide-react";
import { fetchMovieDetails, pickTrailerKey, backdropUrl } from "../api/tmdb";
import { getMovieInsight } from "../api/openrouter";
import YouTubePlayer from "./YouTubePlayer";
import "./MovieModal.css";

// Formats TMDb runtime (minutes) as "2h 15m".
function formatRuntime(minutes) {
  if (!minutes) return "Runtime unknown";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

// Detail overlay for the selected movie. Owns its own fetch state; mounted only
// when App's selectedMovieId !== null, so closing unmounts and resets everything.
const MovieModal = ({
  movieId,
  onClose,
  isFavorite,
  isWatched,
  onToggleFavorite,
  onToggleWatched,
}) => {
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [detailsError, setDetailsError] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);

  const [aiInsight, setAiInsight] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);

  // Fetch details + videos. ignore-flag guards StrictMode double-invoke and
  // stale responses if movieId changes mid-flight.
  useEffect(() => {
    let ignore = false;
    setDetailsLoading(true);
    setDetailsError(null);
    setDetails(null);
    setTrailerKey(null);

    fetchMovieDetails(movieId)
      .then((data) => {
        if (ignore) return;
        setDetails(data);
        setTrailerKey(pickTrailerKey(data.videos));
      })
      .catch((err) => {
        if (ignore) return;
        setDetailsError(err.message || "Details unavailable.");
      })
      .finally(() => {
        if (!ignore) setDetailsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [movieId]);

  // On open: lock background scroll, move focus into the dialog, and trap Tab
  // within it. Escape closes. Cleanup restores scroll on unmount.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      // Focus trap: keep Tab cycling among the dialog's focusable elements.
      const focusable = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, iframe, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    closeBtnRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // Lazy AI fetch — only on button click (saves free-tier quota).
  const handleGetInsight = useCallback(async () => {
    if (!details) return;
    setLoadingInsight(true);
    const genres = (details.genres ?? []).map((g) => g.name).join(", ");
    const text = await getMovieInsight({
      title: details.title,
      genres,
      overview: details.overview,
    });
    setAiInsight(text);
    setLoadingInsight(false);
  }, [details]);

  // Click on the backdrop (outside the dialog) closes the modal.
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const backdrop = details ? backdropUrl(details.backdrop_path) : null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <button
          type="button"
          className="modal__close"
          onClick={onClose}
          ref={closeBtnRef}
          aria-label="Close details"
        >
          <X size={18} aria-hidden="true" />
        </button>

        {detailsLoading && <p className="modal__message">Loading details…</p>}

        {detailsError && (
          <p className="modal__message modal__message--error" role="alert">
            {detailsError}
          </p>
        )}

        {details && (
          <>
            {backdrop && (
              <div className="modal__backdrop-wrap">
                <img
                  className="modal__backdrop"
                  src={backdrop}
                  alt={`Backdrop for ${details.title}`}
                />
              </div>
            )}

            <div className="modal__content">
              <h2 id="modal-title" className="modal__title">
                {details.title}
              </h2>

              <div className="modal__meta">
                <span>{formatRuntime(details.runtime)}</span>
                <span>·</span>
                <span>{details.release_date || "Release date unknown"}</span>
                <span>·</span>
                <span className="modal__rating">
                  <Star size={15} fill="currentColor" aria-hidden="true" />{" "}
                  {details.vote_average?.toFixed(1) ?? "—"}
                </span>
              </div>

              {details.genres?.length > 0 && (
                <ul className="modal__genres">
                  {details.genres.map((g) => (
                    <li key={g.id} className="modal__genre">
                      {g.name}
                    </li>
                  ))}
                </ul>
              )}

              <div className="modal__toggles">
                <button
                  type="button"
                  className={`modal__toggle${isFavorite ? " is-active" : ""}`}
                  aria-pressed={isFavorite}
                  onClick={onToggleFavorite}
                >
                  <Heart
                    size={16}
                    fill={isFavorite ? "currentColor" : "none"}
                    aria-hidden="true"
                  />{" "}
                  Favorite
                </button>
                <button
                  type="button"
                  className={`modal__toggle${isWatched ? " is-active" : ""}`}
                  aria-pressed={isWatched}
                  onClick={onToggleWatched}
                >
                  <Eye size={16} aria-hidden="true" /> Watched
                </button>
              </div>

              <p className="modal__overview">
                {details.overview || "No overview available."}
              </p>

              {trailerKey ? (
                <div className="modal__trailer">
                  <YouTubePlayer
                    videoId={trailerKey}
                    muted
                    controls
                    poster={backdrop}
                    title={`${details.title} trailer`}
                  />
                </div>
              ) : (
                <p className="modal__no-trailer">No trailer available.</p>
              )}

              <section className="modal__ai" aria-label="AI watch recommendation">
                <h3 className="modal__ai-heading">
                  <Sparkles size={16} aria-hidden="true" /> Watch Recommendation
                </h3>
                {aiInsight ? (
                  <p className="modal__ai-text">{aiInsight}</p>
                ) : loadingInsight ? (
                  <p className="modal__ai-text modal__ai-text--loading">
                    Generating recommendation…
                  </p>
                ) : (
                  <button
                    type="button"
                    className="modal__ai-btn"
                    onClick={handleGetInsight}
                  >
                    Get AI Recommendation
                  </button>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MovieModal;
