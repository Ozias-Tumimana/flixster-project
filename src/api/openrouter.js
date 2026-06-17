// OpenRouter "Watch Recommendation" helper (planning.md §5).
// Browser-side call — the VITE_ key is exposed in the bundle, which is fine for
// this dev assignment but not production. Use the free-tier model.

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

// Pinned free *instruct* models in priority order. OpenRouter's `models` array
// auto-falls-through to the next entry when one is down or rate-limited.
// NOTE: do NOT use the `openrouter/free` pool slug — it routes to whatever free
// model is up, including reasoning and content-safety models that return empty or
// junk content (e.g. "User Safety: safe"), which silently degrades to the fallback.
// Instruct models are the only ones that reliably produce the chat response we want.
// Slugs verified live against https://openrouter.ai/api/v1/models; if one is
// retired the array degrades to the next, then to FALLBACK_INSIGHT.
// OpenRouter caps this array at 3 entries — keep it at 3 or fewer.
const FREE_MODELS = [
  "liquid/lfm-2.5-1.2b-instruct:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

export const FALLBACK_INSIGHT =
  "We couldn't generate a recommendation right now — but the trailer and overview above should help you decide.";

const SYSTEM_PROMPT =
  "You are a concise film concierge. Given a movie's title, genres, and overview, " +
  "write a recommendation explaining who would enjoy it and why. " +
  "Rules: 2-3 sentences of plain text only (no markdown, lists, or quotes). " +
  "No spoilers, plot twists, or endings. No first person ('I'). " +
  "Avoid hype like 'must-see', 'masterpiece', or '10/10'. " +
  "Base your answer only on the supplied genres and overview; do not invent cast, awards, or sequels. " +
  "No preamble like 'Here is' or 'Sure'.";

const buildUserPrompt = ({ title, genres, overview }) =>
  `Title: ${title}\n` +
  `Genres: ${genres || "Unknown"}\n` +
  `Overview: ${overview || "No overview available."}\n\n` +
  `Write the recommendation now.`;

// Returns the AI text on success, or FALLBACK_INSIGHT on any failure.
export async function getMovieInsight({ title, genres, overview }) {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!key) {
    console.error("VITE_OPENROUTER_API_KEY is missing");
    return FALLBACK_INSIGHT;
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        // OpenRouter uses this for request attribution; reflect the real origin
        // (localhost in dev, the Render URL in prod) instead of a hardcoded host.
        "HTTP-Referer": window.location.origin,
        "X-Title": "Flixster",
      },
      body: JSON.stringify({
        models: FREE_MODELS,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt({ title, genres, overview }) },
        ],
        temperature: 0.7,
        max_tokens: 160,
      }),
    });

    if (!res.ok) {
      console.error("OpenRouter error:", res.status, await res.text());
      return FALLBACK_INSIGHT;
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      // 2xx but empty content (e.g. a reasoning/safety model that put everything
      // in `reasoning` and left `content` blank). Log so it's not a silent fallback.
      console.error("OpenRouter returned empty content from", data?.model, data);
      return FALLBACK_INSIGHT;
    }
    return text;
  } catch (err) {
    console.error("OpenRouter request failed:", err);
    return FALLBACK_INSIGHT;
  }
}
