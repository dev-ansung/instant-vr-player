#!/usr/bin/env bun
import { parseArgs } from "util"

function getLocalIp() {
    const os = require("os");
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    return "localhost";
}

async function generateSelfSignedCert() {
    const selfsigned = require("selfsigned");
    const attrs = [{ name: "commonName", value: getLocalIp() }];
    const pems = await selfsigned.generate(attrs, { days: 365 });
    return {
        cert: pems.cert,
        key: pems.private
    };
}

const { cert, key } = await generateSelfSignedCert();
process.env.SSL_CERT = cert;
process.env.SSL_KEY = key;


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