// Cloudflare Pages Function: GET /api/ig-status?username=<name>
// Reports whether an Instagram profile is reachable. Browsers can't do this
// directly (CORS, and instagram.com serves a login wall to normal visitors),
// but it serves link-preview crawlers a page whose <title> is
// "Name (@username) • Instagram ..." for live profiles and just "Instagram"
// for deactivated, deleted, or renamed ones.

type Status = "active" | "unavailable" | "unknown";

const USERNAME = /^[A-Za-z0-9._]{1,30}$/;
const CRAWLER_UA =
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";
// <title> sits ~100 KB into the document; stop reading well after that.
const SCAN_LIMIT = 400_000;

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, "&");
}

async function readTitle(body: ReadableStream<Uint8Array>): Promise<string | null> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let html = "";
  try {
    while (html.length < SCAN_LIMIT) {
      const { done, value } = await reader.read();
      if (done) break;
      // Re-scan a little before the new chunk so a split tag is still found.
      const from = Math.max(0, html.length - 16);
      html += decoder.decode(value, { stream: true });
      const end = html.indexOf("</title>", from);
      if (end !== -1) {
        const start = html.lastIndexOf("<title>", end);
        return start === -1 ? null : decodeEntities(html.slice(start + 7, end).trim());
      }
    }
    return null;
  } finally {
    reader.cancel().catch(() => {});
  }
}

async function lookup(username: string): Promise<Status> {
  const response = await fetch(`https://www.instagram.com/${username}/`, {
    headers: { "User-Agent": CRAWLER_UA, "Accept-Language": "en-US" },
    redirect: "manual",
  });
  if (response.status !== 200 || !response.body) {
    response.body?.cancel();
    return "unknown";
  }
  const title = await readTitle(response.body);
  if (title === null) return "unknown";
  if (title.toLowerCase().includes(`(@${username.toLowerCase()})`)) return "active";
  return title === "Instagram" ? "unavailable" : "unknown";
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
