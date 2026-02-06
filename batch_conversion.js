// Batch DXF to STL Conversion Module
// This module handles batch conversion of DXF files to STL via SCAD

import * as path from "https://deno.land/std/path/mod.ts";
import { ensureDir } from "https://deno.land/std/fs/mod.ts";
import DxfParser from "npm:dxf-parser";

// Import functions from manual.module.h.js
// Note: We need to use dynamic import since it's an ES module
let manualModule = null;

async function loadManualModule() {
    if (!manualModule) {
        manualModule = await import("./httpserved/manual.module.h.js");
    }
    return manualModule;
}

// Directory paths
const S_DIR__BATCH = "./batch_convert";
const S_DIR__INPUT = `${S_DIR__BATCH}/input`;
const S_DIR__OUTPUT = `${S_DIR__BATCH}/output`;
const S_DIR__SCAD = `${S_DIR__BATCH}/scad`;
const S_DIR__PROFILE = "./httpserved/dxffiles";

// Parse DXF file content
function parseDxf(dxfText) {
    const parser = new DxfParser();
    return parser.parseSync(dxfText);
}

// Read a DXF file and return parsed content
async function readDxfFile(filePath) {
    const content = await Deno.readTextFile(filePath);
    return parseDxf(content);
}

// List DXF files in input directory
export async function listInputFiles() {
    try {
        await ensureDir(S_DIR__INPUT);
        const files = [];
        for await (const entry of Deno.readDir(S_DIR__INPUT)) {
            if (entry.isFile && entry.name.toLowerCase().endsWith('.dxf')) {
                files.push(entry.name);
            }
        }
        return files.sort();
    } catch (err) {
        console.error("Error listing input files:", err);
        return [];
    }
}

// List profile DXF files
export async function listProfiles() {
    try {
        await ensureDir(S_DIR__PROFILE);
        const files = [];
        for await (const entry of Deno.readDir(S_DIR__PROFILE)) {
            if (entry.isFile && entry.name.toLowerCase().endsWith('.dxf')) {
                files.push(entry.name);
            }
        }
        return files.sort();
    } catch (err) {
        console.error("Error listing profiles:", err);
        return [];
    }
}

// List profile combo presets (folders in profile_combinations/)
export async function listProfileCombo() {
    try {
        const s_combo_dir = `${S_DIR__PROFILE}/profile_combinations`;
        await ensureDir(s_combo_dir);
        const a_o_combo = [];

        for await (const entry of Deno.readDir(s_combo_dir)) {
            if (entry.isDirectory) {
                // scan folder for profile and remover files
                const s_folder = `${s_combo_dir}/${entry.name}`;
                let s_file__profile = null;
                let s_file__remover = null;

                for await (const file of Deno.readDir(s_folder)) {
                    if (file.isFile && file.name.toLowerCase().endsWith('.dxf')) {
                        const s_name_lower = file.name.toLowerCase();
                        // Remover: starts with 'pr' or 'pr_' or contains 'remover'
                        if (s_name_lower.startsWith('pr.') || s_name_lower.startsWith('pr_') || s_name_lower.includes('remover')) {
                            s_file__remover = file.name;
                        }
                        // Profile: starts with 'p' but not 'pr'
                        else if (s_name_lower.startsWith('p.') || s_name_lower.startsWith('p_')) {
                            s_file__profile = file.name;
                        }
                    }
                }

                if (s_file__profile && s_file__remover) {
                    // create readable name from folder
                    const s_name = entry.name
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, c => c.toUpperCase());

                    a_o_combo.push({
                        s_name,
                        s_folder: entry.name,
                        s_path__profile: `profile_combinations/${entry.name}/${s_file__profile}`,
                        s_path__remover: `profile_combinations/${entry.name}/${s_file__remover}`
                    });
                }
            }
        }
        return a_o_combo.sort((a, b) => a.s_name.localeCompare(b.s_name));
    } catch (err) {
        console.error("Error listing profile combos:", err);
        return [];
    }
}

// Generate SCAD content for a sketch with profile
async function generateScadContent(sketchDxfPath, profileDxfPath, removerDxfPath) {
    const mod = await loadManualModule();

    // Parse all DXF files
    const sketchDxf = await readDxfFile(sketchDxfPath);
    const profileDxf = await readDxfFile(profileDxfPath);
    const removerDxf = await readDxfFile(removerDxfPath);

    // Convert to sketch objects
    const sketchObj = await mod.f_o_sketch_from_o_dxf(sketchDxf);
    const profileObj = await mod.f_o_sketch_from_o_dxf(profileDxf);
    const removerObj = await mod.f_o_sketch_from_o_dxf(removerDxf);

    // Get names from file paths
    const sketchName = path.basename(sketchDxfPath, '.dxf').replace(/[^a-zA-Z0-9_]/g, '_');
    const profileName = path.basename(profileDxfPath, '.dxf').replace(/[^a-zA-Z0-9_]/g, '_');
    const removerName = path.basename(removerDxfPath, '.dxf').replace(/[^a-zA-Z0-9_]/g, '_');

    // Generate SCAD content
    const scadContent = mod.f_s_scad_path_sweep_sketch(
        sketchObj, sketchName,
        profileObj, profileName,
        removerObj, removerName
    );

    return scadContent;
}

// Run OpenSCAD to convert SCAD to STL
async function runOpenScad(scadPath, stlPath) {
    const cmd = new Deno.Command("openscad", {
        args: [
            "-o", stlPath,
            scadPath
        ],
        stdout: "piped",
        stderr: "piped"
    });

    const process = await cmd.output();
    const stdout = new TextDecoder().decode(process.stdout);
    const stderr = new TextDecoder().decode(process.stderr);

    // Combine stdout and stderr for logging
    const log = (stdout + "\n" + stderr).trim();

    if (!process.success) {
        throw new Error(`OpenSCAD failed: ${stderr}`);
    }

    return { success: true, log };
}

// Check if OpenSCAD is installed
export async function checkOpenScad() {
    try {
        const cmd = new Deno.Command("openscad", {
            args: ["--version"],
            stdout: "piped",
            stderr: "piped"
        });
        const process = await cmd.output();
        const version = new TextDecoder().decode(process.stdout || process.stderr);
        return { installed: true, version: version.trim() };
    } catch (err) {
        return { installed: false, error: err.message };
    }
}

// Process a single file and yield progress events
async function* processFile(inputFile, profilePath, removerPath, fileIndex, totalFiles) {
    const baseName = path.basename(inputFile, '.dxf');
    const scadPath = path.join(S_DIR__SCAD, `${baseName}.scad`);
    const stlPath = path.join(S_DIR__OUTPUT, `${baseName}.stl`);

    yield {
        type: 'progress',
        current: fileIndex + 1,
        total: totalFiles,
        file: inputFile
    };

    try {
        // Generate SCAD
        const inputPath = path.join(S_DIR__INPUT, inputFile);
        const scadContent = await generateScadContent(inputPath, profilePath, removerPath);

        await Deno.writeTextFile(scadPath, scadContent);
        yield { type: 'scad_generated', file: `${baseName}.scad` };

        // Convert to STL
        const result = await runOpenScad(scadPath, stlPath);
        yield { type: 'stl_generated', file: `${baseName}.stl`, log: result.log };

        return true;
    } catch (err) {
        yield { type: 'error', file: inputFile, message: err.message };
        return false;
    }
}

// Main batch conversion function - yields progress events
export async function* batchConvert(profileName, removerName) {
    // Ensure directories exist
    await ensureDir(S_DIR__INPUT);
    await ensureDir(S_DIR__OUTPUT);
    await ensureDir(S_DIR__SCAD);

    // Check OpenSCAD
    const openscadCheck = await checkOpenScad();
    if (!openscadCheck.installed) {
        yield { type: 'error', file: '', message: 'OpenSCAD is not installed or not in PATH' };
        return;
    }

    // Get profile paths
    const profilePath = path.join(S_DIR__PROFILE, profileName);
    const removerPath = path.join(S_DIR__PROFILE, removerName);

    // Verify profile files exist
    try {
        await Deno.stat(profilePath);
        await Deno.stat(removerPath);
    } catch (err) {
        yield { type: 'error', file: '', message: `Profile file not found: ${err.message}` };
        return;
    }

    // List input files
    const inputFiles = await listInputFiles();
    if (inputFiles.length === 0) {
        yield { type: 'error', file: '', message: 'No DXF files found in batch_convert/input/' };
        return;
    }

    let successCount = 0;
    let failCount = 0;

    // Process each file
    for (let i = 0; i < inputFiles.length; i++) {
        const file = inputFiles[i];

        for await (const event of processFile(file, profilePath, removerPath, i, inputFiles.length)) {
            yield event;

            if (event.type === 'stl_generated') {
                successCount++;
            } else if (event.type === 'error') {
                failCount++;
            }
        }
    }

    yield {
        type: 'complete',
        success: successCount,
        failed: failCount,
        total: inputFiles.length
    };
}

// Export for use in webserver
export {
    S_DIR__BATCH,
    S_DIR__INPUT,
    S_DIR__OUTPUT,
    S_DIR__SCAD,
    S_DIR__PROFILE
};
