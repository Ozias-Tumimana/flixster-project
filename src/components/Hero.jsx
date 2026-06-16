import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  Plus,
  Check,
  Volume2,
  VolumeX,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { backdropUrl, fetchMovieDetails, pickTrailerKey } from "../api/tmdb";
import Skeleton from "./Skeleton";
import YouTubePlayer from "./YouTubePlayer";
import "./Hero.css";

const ROTATE_MS = 7000;

// Tracks the OS "reduce motion" setting and updates live if the user toggles it.
function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// Auto-rotating billboard (features A, J, L). Renders from the top few
// now-playing movies. Lazily fetches the active slide's trailer (cached per id)
// and autoplays it muted behind the scrim; rotation pauses on hover/focus,
// while a trailer plays, and entirely under reduced-motion.
const Hero = ({ movies, isFavorite, onViewDetails, onToggleFavorite }) => {
  const slides = movies.slice(0, 5);
  const reduceMotion = useReducedMotion();

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false); // hover/focus pause
  const [userPaused, setUserPaused] = useState(false); // explicit pause button
  const [isMuted, setIsMuted] = useState(true);
  const [trailerKey, setTrailerKey] = useState(null);
  const detailsCacheRef = useRef(new Map());

  // Clamp during render so a shrinking slide list can never deref undefined.
  const safeIndex = slides.length > 0 ? activeIndex % slides.length : 0;
  const active = slides[safeIndex];

  // Lazily load (and cache) the active slide's trailer key.
  useEffect(() => {
    if (!active || reduceMotion) {
      setTrailerKey(null);
      return;
    }
    let ignore = false;
    const cache = detailsCacheRef.current;

    if (cache.has(active.id)) {
      setTrailerKey(cache.get(active.id));
      return;
    }

    fetchMovieDetails(active.id)
      .then((data) => {
        if (ignore) return;
        const key = pickTrailerKey(data.videos);
        cache.set(active.id, key);
        setTrailerKey(key);
      })
      .catch(() => {
        if (!ignore) setTrailerKey(null); // fall back to backdrop image
      });

    return () => {
      ignore = true;
    };
  }, [active, reduceMotion]);

  const playingTrailer = Boolean(trailerKey) && !reduceMotion;

  // Auto-rotate, unless paused (hover/focus or explicit), reduced-motion,
  // or a trailer is playing.
  useEffect(() => {
    if (reduceMotion || paused || userPaused || playingTrailer || slides.length <= 1)
      return;
    const id = setTimeout(() => {
      setActiveIndex((i) => (i + 1) % slides.length);
    }, ROTATE_MS);
    return () => clearTimeout(id);
  }, [
    activeIndex,
    paused,
    userPaused,
    playingTrailer,
    reduceMotion,
    slides.length,
  ]);

  const goTo = useCallback((i) => setActiveIndex(i), []);
  const prev = useCallback(
    () => setActiveIndex((i) => (i - 1 + slides.length) % slides.length),
    [slides.length]
  );
  const next = useCallback(
    () => setActiveIndex((i) => (i + 1) % slides.length),
    [slides.length]
  );

  if (slides.length === 0) {
    return <Skeleton variant="hero" />;
  }

  // Full-res for the full-bleed billboard (w1280 visibly upscales on wide displays).
  const backdrop = backdropUrl(active.backdrop_path, "original");
  const rating = active.vote_average ? active.vote_average.toFixed(1) : "—";
  const favorited = isFavorite(active.id);

  return (
    <section
      className="hero"
      aria-roledescription="carousel"
      aria-label="Featured movies"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Media layer: muted ambient trailer if available, else backdrop image.
          The player stays hidden until it's truly playing, with the backdrop as
          its cover, so no YouTube chrome flashes on load. */}
      <div className="hero__media" aria-hidden="true">
        {playingTrailer ? (
          <YouTubePlayer
            videoId={trailerKey}
            muted={isMuted}
            loop
            controls={false}
            poster={backdrop}
            posterPosition="center 20%"
            title={`${active.title} trailer`}
            revealDelay={6000}
          />
        ) : (
          backdrop && <img className="hero__backdrop" src={backdrop} alt="" />
        )}
        <div className="hero__scrim" />
      </div>

      {/* Content layer. The text block is an aria-live region so slide changes
          are announced; interactive controls live outside it to avoid chatter. */}
      <div className="hero__content">
        <div className="hero__text" aria-live="polite">
          <h2 className="hero__title">{active.title}</h2>
          <div className="hero__meta">
            <span className="hero__rating">
              <Star size={16} fill="currentColor" aria-hidden="true" /> {rating}
            </span>
            {active.release_date && (
              <span>{active.release_date.slice(0, 4)}</span>
            )}
          </div>
          <p className="hero__overview">
            {active.overview || "No overview available."}
          </p>
        </div>

        <div className="hero__actions">
          <button
            type="button"
            className="hero__btn hero__btn--primary"
            onClick={() => onViewDetails(active.id)}
          >
            <Play size={18} fill="currentColor" aria-hidden="true" /> View Details
          </button>
          <button
            type="button"
            className={`hero__btn hero__btn--icon${favorited ? " is-active" : ""}`}
            aria-pressed={favorited}
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
            onClick={() => onToggleFavorite(active.id)}
          >
            {favorited ? (
              <Check size={20} aria-hidden="true" />
            ) : (
              <Plus size={20} aria-hidden="true" />
            )}
          </button>
          {playingTrailer && (
            <button
              type="button"
              className="hero__btn hero__btn--icon"
              aria-label={isMuted ? "Unmute trailer" : "Mute trailer"}
              onClick={() => setIsMuted((m) => !m)}
            >
              {isMuted ? (
                <VolumeX size={18} aria-hidden="true" />
              ) : (
                <Volume2 size={18} aria-hidden="true" />
              )}
            </button>
          )}
          {/* Pause/stop control for the auto-rotation (WCAG 2.2.2). */}
          {slides.length > 1 && !reduceMotion && (
            <button
              type="button"
              className="hero__btn hero__btn--icon"
              aria-label={userPaused ? "Resume slideshow" : "Pause slideshow"}
              onClick={() => setUserPaused((p) => !p)}
            >
              {userPaused ? (
                <Play size={18} aria-hidden="true" />
              ) : (
                <Pause size={18} aria-hidden="true" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Large prev/next navigation (feature B fix — easier than the dots). */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="hero__nav hero__nav--prev"
            aria-label="Previous featured movie"
            onClick={prev}
          >
            <ChevronLeft size={32} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="hero__nav hero__nav--next"
            aria-label="Next featured movie"
            onClick={next}
          >
            <ChevronRight size={32} aria-hidden="true" />
          </button>
        </>
      )}

      {/* Slide indicators. */}
      {slides.length > 1 && (
        <div className="hero__dots">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`hero__dot${i === safeIndex ? " is-active" : ""}`}
              aria-label={`Show ${s.title}`}
              aria-current={i === safeIndex}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default Hero;
