import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const CLIENT_DIR = path.join(__dirname, "dist", "client");
const PUBLIC_DIR = path.join(__dirname, "public");

// Import the compiled TanStack Start server handler
const serverModule = await import("./dist/server/server.js");
const appHandler = serverModule.default?.fetch || serverModule.fetch;

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = decodeURIComponent(url.pathname);

    // 1. Check if static file exists in dist/client, dist/client/assets, or public/
    if (pathname !== "/" && !pathname.endsWith("/")) {
      let filePath = path.join(CLIENT_DIR, pathname);
      
      // If not directly found, check inside dist/client/assets
      if (!fs.existsSync(filePath) && !pathname.startsWith("/assets/")) {
        const altPath = path.join(CLIENT_DIR, "assets", pathname);
        if (fs.existsSync(altPath)) {
          filePath = altPath;
        }
      }

      // If not found in dist/client, check in public directory (e.g. public/uploads)
      if (!fs.existsSync(filePath)) {
        const publicPath = path.join(PUBLIC_DIR, pathname);
        if (fs.existsSync(publicPath)) {
          filePath = publicPath;
        }
      }

      // If still not found and requesting a CSS file (e.g. stale hash), find the current CSS bundle
      if (!fs.existsSync(filePath) && pathname.endsWith(".css")) {
        const assetsDir = path.join(CLIENT_DIR, "assets");
        if (fs.existsSync(assetsDir)) {
          const cssFiles = fs.readdirSync(assetsDir).filter(f => f.startsWith("styles-") && f.endsWith(".css"));
          if (cssFiles.length > 0) {
            filePath = path.join(assetsDir, cssFiles[0]);
          }
        }
      }

      // Prevent path traversal and serve file
      const isSafe = filePath.startsWith(CLIENT_DIR) || filePath.startsWith(PUBLIC_DIR);
      if (isSafe && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";
        res.writeHead(200, {
          "Content-Type": contentType,
          "Cache-Control": "no-cache, no-store, must-revalidate",
        });
        fs.createReadStream(filePath).pipe(res);
        return;
      }
    }

    // 2. Forward to TanStack Start fetch handler
    const fullUrl = `http://${req.headers.host || "localhost"}${req.url}`;
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        if (Array.isArray(value)) {
          for (const v of value) headers.append(key, v);
        } else {
          headers.set(key, value);
        }
      }
    }

    let body = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks);
    }

    const webRequest = new Request(fullUrl, {
      method: req.method,
      headers,
      body,
      // @ts-ignore
      duplex: "half",
    });

    const response = await appHandler(webRequest);

    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));

    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (err) {
    console.error("Server request error:", err);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain" });
    }
    res.end("Internal Server Error");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 SARPRAS Production Server listening on http://0.0.0.0:${PORT}`);
});
