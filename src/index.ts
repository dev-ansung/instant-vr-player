import { serve } from "bun";
import mediaPage from "./media_page.html";
import library from "./library.html";
import { readdir } from "fs/promises";
import path from "node:path"; // Standard Node path module

const videoIdMap = new Map<string, string>();
const targetDir = process.env.MEDIA_DIR || "./videos";
const cert = process.env.SSL_CERT || "./cert.pem";
const key = process.env.SSL_KEY || "./key.pem";

/**
 * Normalizes any OS path to a POSIX (forward-slash) path for web consistency.
 */
function toPosixPath(osPath: string): string {
  return osPath.split(path.sep).join('/');
}

function generateVideoId(filePath: string): string {
  const normalized = toPosixPath(filePath);
  for (const [id, path] of videoIdMap.entries()) {
    if (path === normalized) return id;
  }
  const id = (videoIdMap.size + 1).toString();
  videoIdMap.set(id, normalized);
  return id;
}

const server = serve({
  routes: {
    "/": library,
    "/player/:id": mediaPage,

    "/api/videos": {
      async GET() {
        try {
          // Bun's readdir returns paths relative to targetDir
          const files = await readdir(targetDir, { recursive: true });
          const videoFiles = files
            .filter(file => file.toLowerCase().endsWith(".mp4"))
            .map(file => ({
              id: generateVideoId(file),
              name: toPosixPath(file) // Send normalized paths to frontend
            }));
          return Response.json(videoFiles);
        } catch (error) {
          return Response.json({ error: "Failed to read video files" }, { status: 500 });
        }
      }
    },

    "/video/:id": {
      async GET(req) {
        const relativePosixPath = videoIdMap.get(req.params.id);
        if (!relativePosixPath) return new Response("Video not found", { status: 404 });

        // path.join converts the posix path back to the OS-native format
        const fullPath = path.join(targetDir, relativePosixPath);
        const file = Bun.file(fullPath);
        const range = req.headers.get("range");

        if (range) {
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0] ?? "0", 10);
          const maxChunk = 20 * 1024 * 1024;
          let end = parts[1] ? parseInt(parts[1], 10) : file.size - 1;
          end = Math.min(end, start + maxChunk - 1, file.size - 1);
          const chunksize = (end - start) + 1;

          return new Response(file.slice(start, end + 1), {
            status: 206,
            headers: {
              "Content-Range": `bytes ${start}-${end}/${file.size}`,
              "Accept-Ranges": "bytes",
              "Content-Length": chunksize.toString(),
              "Content-Type": "video/mp4",
            },
          });
        }
        return new Response(file);
      },
    },
  },
  port: 3000,
  tls: { cert, key }
});