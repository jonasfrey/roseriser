// Simple Deno web server for Roseriser
// Run with: deno run --allow-net --allow-read --allow-write --allow-run webserver.js

import DxfParser from "npm:dxf-parser";
import { listInputFiles, listProfiles, listProfileCombo, batchConvert, checkOpenScad } from "./batch_conversion.js";

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

    // API endpoint for listing input DXF files
    if (path === "/api/list-input-files" && request.method === "GET") {
        try {
            const files = await listInputFiles();
            return new Response(JSON.stringify(files), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        }
    }

    // API endpoint for listing profile DXF files
    if (path === "/api/list-profiles" && request.method === "GET") {
        try {
            const files = await listProfiles();
            return new Response(JSON.stringify(files), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        }
    }

    // API endpoint for listing profile combo presets
    if (path === "/api/list-profile-combo" && request.method === "GET") {
        try {
            const a_o_combo = await listProfileCombo();
            return new Response(JSON.stringify(a_o_combo), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        }
    }

    // API endpoint for checking OpenSCAD installation
    if (path === "/api/check-openscad" && request.method === "GET") {
        try {
            const result = await checkOpenScad();
            return new Response(JSON.stringify(result), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        }
    }

    // API endpoint for batch conversion (streaming response)
    if (path === "/api/batch-convert" && request.method === "POST") {
        try {
            const body = await request.json();
            const { profile, remover } = body;

            if (!profile || !remover) {
                return new Response(JSON.stringify({ error: "Missing profile or remover" }), {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                });
            }

            // Create a streaming response
            const stream = new ReadableStream({
                async start(controller) {
                    const encoder = new TextEncoder();
                    try {
                        for await (const event of batchConvert(profile, remover)) {
                            const line = JSON.stringify(event) + "\n";
                            controller.enqueue(encoder.encode(line));
                        }
                    } catch (e) {
                        const errorEvent = JSON.stringify({ type: 'error', message: e.message }) + "\n";
                        controller.enqueue(encoder.encode(errorEvent));
                    } finally {
                        controller.close();
                    }
                }
            });

            return new Response(stream, {
                status: 200,
                headers: {
                    "Content-Type": "application/x-ndjson",
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "no-cache",
                },
            });
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        }
    }

    // API endpoint for saving generated SCAD files with timestamp
    if (path === "/api/save-scad" && request.method === "POST") {
        try {
            let o_body = await request.json();
            let { s_scad, s_app } = o_body;

            if (!s_scad || !s_app) {
                return new Response(JSON.stringify({ error: "Missing s_scad or s_app" }), {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                });
            }

            // Create directory if it doesn't exist
            let s_dir = "./scad_generated";
            try {
                await Deno.mkdir(s_dir, { recursive: true });
            } catch (e) {
                if (!(e instanceof Deno.errors.AlreadyExists)) throw e;
            }

            // Generate timestamp filename: [appname]_yyyy-mm-dd-hh-mm-ss.scad
            let o_date = new Date();
            let s_timestamp = o_date.getFullYear() + "-" +
                String(o_date.getMonth() + 1).padStart(2, "0") + "-" +
                String(o_date.getDate()).padStart(2, "0") + "-" +
                String(o_date.getHours()).padStart(2, "0") + "-" +
                String(o_date.getMinutes()).padStart(2, "0") + "-" +
                String(o_date.getSeconds()).padStart(2, "0");
            let s_filename = `${s_app}_${s_timestamp}.scad`;
            let s_path__file = `${s_dir}/${s_filename}`;

            await Deno.writeTextFile(s_path__file, s_scad);

            console.log(`Saved SCAD: ${s_path__file}`);

            return new Response(JSON.stringify({ b_success: true, s_filename }), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), {
                status: 500,
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
