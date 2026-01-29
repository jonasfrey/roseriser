// Simple Deno web server for Roseriser
// Run with: deno run --allow-net --allow-read webserver.js

import DxfParser from "npm:dxf-parser";

const PORT = 8000;
const STATIC_DIR = "./httpserved";

const MIME_TYPES = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ico": "image/x-icon",
    ".dxf": "application/dxf",
};

function getMimeType(path) {
    const ext = path.substring(path.lastIndexOf("."));
    return MIME_TYPES[ext] || "application/octet-stream";
}

// Parse DXF content and return entities
function parseDxf(dxfText) {
    const parser = new DxfParser();
    const dxf = parser.parseSync(dxfText);
    return dxf;
}

async function handleRequest(request) {
    const url = new URL(request.url);
    let path = url.pathname;

    // API endpoint for parsing DXF
    if (path === "/api/parse-dxf" && request.method === "POST") {
        try {
            const dxfText = await request.text();
            const parsed = parseDxf(dxfText);
            return new Response(JSON.stringify(parsed), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), {
                status: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        }
    }

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });
    }

    // Default to index.html
    if (path === "/") {
        path = "/index.html";
    }

    // Resolve file path from httpserved directory (prevent directory traversal)
    const filePath = `${STATIC_DIR}${path}`;

    try {
        const file = await Deno.readFile(filePath);
        const mimeType = getMimeType(filePath);

        return new Response(file, {
            status: 200,
            headers: {
                "Content-Type": mimeType,
                "Cache-Control": "no-cache",
            },
        });
    } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
            return new Response("404 Not Found", { status: 404 });
        }
        return new Response("500 Internal Server Error", { status: 500 });
    }
}

console.log(`Roseriser server running at http://localhost:${PORT}/`);
console.log(`Serving static files from: ${STATIC_DIR}`);
Deno.serve({ port: PORT }, handleRequest);
