import { getPort } from "./registry";
import { portname_PORT } from "./daemon";

export function startProxy() {
  process.on("SIGTERM", () => {
    process.exit(0);
  });

  Bun.serve<{ port: number; url: string; target?: WebSocket }>({
    port: portname_PORT,

    async fetch(req, server) {
      const host = req.headers.get("host") ?? "";
      const appName = host.split(".")[0] ?? "";
      const port = getPort(appName);

      if (!port) {
        return new Response(
          `<h1>No app registered as "${appName}"</h1><p>Run: portname register ${appName} &lt;port&gt;</p>`,
          { status: 404, headers: { "content-type": "text/html" } },
        );
      }

      if (req.headers.get("upgrade") === "websocket") {
        const upgraded = server.upgrade(req, { data: { port, url: req.url } });
        if (upgraded) return undefined;
        return new Response("WebSocket upgrade failed", { status: 500 });
      }

      const url = new URL(req.url);
      const targetUrl = `http://localhost:${port}${url.pathname}${url.search}`;

      const reqHeaders = new Headers(req.headers);
      reqHeaders.delete("accept-encoding");

      try {
        const response = await fetch(targetUrl, {
          method: req.method,
          headers: reqHeaders,
          body:
            req.method !== "GET" && req.method !== "HEAD"
              ? req.body
              : undefined,
        });

        const resHeaders = new Headers(response.headers);
        resHeaders.delete("content-encoding");

        return new Response(response.body, {
          status: response.status,
          headers: resHeaders,
        });
      } catch {
        return new Response(
          `<h1>"${appName}" is registered but not running</h1><p>Expected it on port ${port}</p>`,
          { status: 502, headers: { "content-type": "text/html" } },
        );
      }
    },

    websocket: {
      async open(ws) {
        const { port, url } = ws.data as { port: number; url: string };
        const parsedUrl = new URL(url);
        const target = new WebSocket(
          `ws://localhost:${port}${parsedUrl.pathname}${parsedUrl.search}`,
        );
        ws.data = { ...ws.data, target } as any;
        target.onmessage = (event) => ws.send(event.data);
        target.onclose = () => ws.close();
        target.onerror = () => ws.close();
      },

      message(ws, message) {
        const { target } = ws.data as { target: WebSocket };
        if (target.readyState === WebSocket.OPEN) target.send(message);
      },

      close(ws) {
        const { target } = ws.data as { target: WebSocket };
        target?.close();
      },
    },
  });
}
