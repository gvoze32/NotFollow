// Cloudflare Pages Function: GET /api/ig-status?username=<name>
// Reports whether an Instagram profile is reachable. Browsers can't do this
// directly (CORS), and Instagram answers profile pages requested from
// Cloudflare's IPs with a login redirect, so three signals that still work
// from here are combined:
//
// 1. `/<name>/feed/` 301-redirects to `/<name>/` only when the username
//    belongs to a live account (public or private).
// 2. Otherwise the profile embed (`/<name>/embed/`) is a normal "Embed" for a
//    live public profile and "EmbedIsBroken" for a missing, deactivated, or
//    private/embed-disabled one.
// 3. A broken embed alone can't tell private from gone, so "unavailable" also
//    requires the feed redirect to work for a known account right now;
//    otherwise Instagram is throttling us and the answer is "unknown".

type Status = "active" | "unavailable" | "unknown";

const USERNAME = /^[A-Za-z0-9._]{1,30}$/;
const CRAWLER_UA =
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";
const CONTROL_USERNAME = "instagram";
// The embed's root `<div class="Embed…">` sits ~28 KB into the document.
const SCAN_LIMIT = 200_000;
const EMBED_CLASS = /<div class="(Embed[^"]*)"/;

function instagram(path: string) {
  return fetch(`https://www.instagram.com/${path}`, {
    headers: { "User-Agent": CRAWLER_UA, "Accept-Language": "en-US" },
    redirect: "manual",
  });
}

/** True when `/<username>/feed/` redirects to the profile, i.e. the account exists. */
async function feedResolves(username: string): Promise<boolean> {
  const response = await instagram(`${username}/feed/`);
  response.body?.cancel();
  const location = response.headers.get("location");
  if (response.status !== 301 || !location) return false;
  const path = new URL(location, "https://www.instagram.com").pathname;
  return path.toLowerCase() === `/${username.toLowerCase()}/`;
}

/** Class list of the profile embed's root element; null if it wasn't found. */
async function embedClass(username: string): Promise<string | null> {
  const response = await instagram(`${username}/embed/`);
  if (response.status !== 200 || !response.body) {
    response.body?.cancel();
    return null;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let html = "";
  try {
    while (html.length < SCAN_LIMIT) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      const match = EMBED_CLASS.exec(html);
      if (match) return match[1];
    }
    return null;
  } finally {
    reader.cancel().catch(() => {});
  }
}

async function lookup(username: string): Promise<Status> {
  if (await feedResolves(username)) return "active";
  const embed = await embedClass(username);
  if (embed === "Embed") return "active";
  if (embed === null || !embed.split(" ").includes("EmbedIsBroken")) return "unknown";
  return (await feedResolves(CONTROL_USERNAME)) ? "unavailable" : "unknown";
}

function json(body: unknown, status = 200, cache = "no-store") {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": cache },
  });
}

export async function onRequestGet({ request }: { request: Request }) {
  const username = new URL(request.url).searchParams.get("username") ?? "";
  if (!USERNAME.test(username)) return json({ error: "invalid username" }, 400);

  let status: Status;
  try {
    status = await lookup(username);
  } catch {
    status = "unknown";
  }
  // Definite answers can be cached briefly; "unknown" should be retried.
  return json(
    { username, status },
    200,
    status === "unknown" ? "no-store" : "public, max-age=3600"
  );
}
