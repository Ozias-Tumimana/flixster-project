// Loads the YouTube IFrame Player API once and resolves with the global `YT`
// namespace when it's ready. Using the API (instead of a raw <iframe>) lets us
// listen for the real PLAYING state so we can hide the player until playback
// actually starts — avoiding YouTube's load-time control/spinner flash.

let apiPromise = null;

export function loadYouTubeApi() {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }
    // YouTube calls this global once the script finishes loading.
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevCallback?.();
      resolve(window.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });

  return apiPromise;
}
