#!/usr/bin/env node
/**
 * Zero-dependency HTTP Server for Super Starlight Bros.
 * Reads BABY_GENDER (or GENDER) from environment variables or .env
 * and serves /config.js dynamically.
 *
 * Usage:
 *   BABY_GENDER=boy node server.js
 *   BABY_GENDER=girl npm start
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { resolveGenderFromEnv, generateConfigJsContent } = require("./build.js");

const PORT = Number(process.env.PORT) || 8080;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const server = http.createServer((req, res) => {
  const reqUrl = (req.url || "/").split("?")[0];

  if (reqUrl === "/config.js") {
    const gender = resolveGenderFromEnv();
    const jsBody = generateConfigJsContent(gender);
    res.writeHead(200, {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store"
    });
    res.end(jsBody);
    return;
  }

  const safePath = path.normalize(reqUrl === "/" ? "/index.html" : reqUrl).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(__dirname, safePath);

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(err.code === "ENOENT" ? 404 : 500);
      res.end(err.code === "ENOENT" ? "Not Found" : "Server Error");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(content);
  });
});

server.listen(PORT, () => {
  const gender = resolveGenderFromEnv();
  console.log(`🍄 Super Starlight Bros. running at http://localhost:${PORT}`);
  console.log(`🔒 Configured via environment variable: BABY_GENDER="${gender}"`);
});
