import { useEffect, useRef, useState } from "react";
import { loadYouTubeApi } from "../api/youtube";
import "./YouTubePlayer.css";

// Plays a YouTube video via the IFrame Player API, kept visually hidden until
// playback actually starts so YouTube's load-time controls/spinner never flash.
// While hidden, an optional `poster` (or a plain dark box) covers the area.
//
// Props:
//   videoId   – YouTube video id (required)
//   muted     – start muted; toggling calls the API (no reload). Default true.
//   loop      – loop the single video. Default false.
//   controls  – show YouTube controls (modal=true for intentional viewing,
//               hero=false for ambient background). Default false.
//   poster    – image URL shown until the video is revealed.
//   posterPosition – background-position for the poster cover (e.g. "center 20%"
//               to bias a wide crop upward). Default "center".
//   title     – iframe title for accessibility.
//   revealDelay – ms to keep the poster up AFTER playback starts, so YouTube's
//               auto-hiding control overlay disappears behind the poster before
//               the video fades in. Default 0 (reveal as soon as it plays).
const YouTubePlayer = ({
  videoId,
  muted = true,
  loop = false,
  controls = false,
  poster = null,
  posterPosition = "center",
  title = "Trailer",
  revealDelay = 0,
}) => {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false); // PLAYING fired (drives mute)
  const [revealed, setRevealed] = useState(false); // poster handed off to video

  // Only the INITIAL mute state seeds the player; later changes are applied via
  // the API below (so toggling mute never recreates/restarts the iframe).
  const initialMutedRef = useRef(muted);

  // Create the player when the videoId changes.
  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current; // captured for a stable cleanup reference
    setPlaying(false);
    setRevealed(false);

    loadYouTubeApi().then((YT) => {
      if (cancelled || !host) return;

      // YT.Player REPLACES the target node with the iframe, so mount a throwaway
      // inner div — our positioned .yt-player__frame wrapper stays intact and is
      // safe for React to unmount.
      const mountNode = document.createElement("div");
      mountNode.style.width = "100%";
      mountNode.style.height = "100%";
      host.appendChild(mountNode);

      playerRef.current = new YT.Player(mountNode, {
        videoId,
        playerVars: {
          autoplay: 1,
          mute: initialMutedRef.current ? 1 : 0,
          controls: controls ? 1 : 0,
          loop: loop ? 1 : 0,
          playlist: loop ? videoId : undefined, // loop requires playlist=self
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          playsinline: 1,
          disablekb: controls ? 0 : 1,
          fs: controls ? 1 : 0,
        },
        events: {
          onStateChange: (e) => {
            if (cancelled) return;
            // 1 === YT.PlayerState.PLAYING — reveal only once truly playing.
            if (e.data === 1) setPlaying(true);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        // player may not be fully initialized yet; ignore.
      }
      playerRef.current = null;
      // Remove any leftover iframe the API left behind before React reuses the host.
      if (host) host.innerHTML = "";
    };
  }, [videoId, controls, loop]); // muted handled live below

  // Reveal the video `revealDelay` ms after it starts playing — long enough for
  // YouTube's control overlay to auto-hide behind the poster (used by the hero).
  useEffect(() => {
    if (!playing) return;
    if (revealDelay <= 0) {
      setRevealed(true);
      return;
    }
    const id = setTimeout(() => setRevealed(true), revealDelay);
    return () => clearTimeout(id);
  }, [playing, revealDelay]);

  // Toggle mute via the API instead of remounting the iframe.
  useEffect(() => {
    const p = playerRef.current;
    if (!p || typeof p.mute !== "function") return;
    if (muted) p.mute();
    else p.unMute();
  }, [muted, playing]);

  return (
    <div className={`yt-player${revealed ? " is-playing" : ""}`}>
      {/* Cover shown until the video is actually playing (no chrome flash). */}
      <div
        className="yt-player__cover"
        style={
          poster
            ? { backgroundImage: `url(${poster})`, backgroundPosition: posterPosition }
            : undefined
        }
        aria-hidden="true"
      />
      <div className="yt-player__frame" title={title} ref={hostRef} />
    </div>
  );
};

export default YouTubePlayer;
