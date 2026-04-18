#!/usr/bin/env bun
import { parseArgs } from "util"

const { values, positionals } = parseArgs({
    args: Bun.argv,
    strict: true,
    allowPositionals: true,
});

const mediaDir = positionals[2];

if (!mediaDir) {
    console.error("Usage: bun run cli <media_directory>");
    process.exit(1);
}

const mediaPath = Bun.file(mediaDir);
if (!mediaPath.exists()) {
    console.error(`Error: Directory "${mediaDir}" does not exist.`);
    process.exit(1);
}
if (!await mediaPath.stat().then(stat => stat.isDirectory()).catch(() => false)) {
    console.error(`Error: "${mediaDir}" is not a directory.`);
    process.exit(1);
}
process.env.MEDIA_DIR = mediaDir;

await import("./index.ts");