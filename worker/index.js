const INDEX_PATH = "/index.html";

function assetRequest(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  return new Request(url, request);
}

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    if (!env?.ASSETS?.fetch) return new Response("Static asset binding unavailable", { status: 503 });
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }

    const url = new URL(request.url);
    const pathname = url.pathname === "/" ? INDEX_PATH : url.pathname;
    let response = await env.ASSETS.fetch(assetRequest(request, pathname));
    if (response.status === 404 && !pathname.split("/").pop().includes(".")) {
      response = await env.ASSETS.fetch(assetRequest(request, INDEX_PATH));
    }
    return withSecurityHeaders(response);
  },
};

