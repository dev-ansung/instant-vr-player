import { serve } from "bun";
import mediaPage from "./media_page.html";
import library from "./library.html";
import { readdir } from "fs/promises";

const videoIdMap = new Map<string, string>();
const targetDir = process.env.MEDIA_DIR || "./videos";

function generateVideoId(filePath: string): string {
  for (const [id, path] of videoIdMap.entries()) {
    if (path === filePath) {
      return id;
    }
  }
  const id = videoIdMap.size + 1;
  videoIdMap.set(id.toString(), filePath);
  return id.toString();
}

const server = serve({
  routes: {
    "/": library,
    "/player/:id": mediaPage,

    "/api/videos": {
      async GET(req) {
        try {
          const files = await readdir(targetDir, { recursive: true });
          const videoFiles = files
            .filter(file => file.toLowerCase().endsWith(".mp4"))
            .map(file => ({
              id: generateVideoId(file),
              name: file
            }));
          return Response.json(videoFiles);
        } catch (error) {
          return Response.json({ error: "Failed to read video files" }, { status: 500 });
        }
      }
    },

    "/video/:id": {
      async GET(req) {
        const path = videoIdMap.get(req.params.id);
        if (!path) return new Response("Video not found", { status: 404 });

        const file = Bun.file(`${targetDir}/${path}`);
        const range = req.headers.get("range");

        if (range) {
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0] ?? "0", 10);
          const end = parts[1] ? parseInt(parts[1], 10) : file.size - 1;
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

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
  port: 3000,
});

// show local network IPs for easier testing on other devices
const os = require("os");
const interfaces = os.networkInterfaces();
for (const name of Object.keys(interfaces)) {
  for (const iface of interfaces[name]) {
    if (iface.family === "IPv4" && !iface.internal) {
      console.log(`Accessible on local network at http://${iface.address}:3000`);
    }
  }
}
