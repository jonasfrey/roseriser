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
const INPUT_DIR = "./input_dxf_files";
const OUTPUT_DIR = "./output_stl_files";
const SCAD_DIR = "./scad_files";
const PROFILES_DIR = "./httpserved/dxffiles";

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
        await ensureDir(INPUT_DIR);
        const files = [];
        for await (const entry of Deno.readDir(INPUT_DIR)) {
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
        await ensureDir(PROFILES_DIR);
        const files = [];
        for await (const entry of Deno.readDir(PROFILES_DIR)) {
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

// List profile combo presets (folders starting with profile_combo_)
export async function listProfileCombo() {
    try {
        await ensureDir(PROFILES_DIR);
        const a_o_combo = [];
        for await (const entry of Deno.readDir(PROFILES_DIR)) {
            if (entry.isDirectory && entry.name.startsWith('profile_combo_')) {
                // scan folder for profile and remover files
                const s_folder = `${PROFILES_DIR}/${entry.name}`;
                let s_file__profile = null;
                let s_file__remover = null;

                for await (const file of Deno.readDir(s_folder)) {
                    if (file.isFile && file.name.toLowerCase().endsWith('.dxf')) {
                        if (file.name.includes('remover')) {
                            s_file__remover = file.name;
                        } else {
                            s_file__profile = file.name;
                        }
                    }
                }

                if (s_file__profile && s_file__remover) {
                    // create readable name from folder (profile_combo_pyramid -> Pyramid)
                    const s_name = entry.name
                        .replace('profile_combo_', '')
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, c => c.toUpperCase());

                    a_o_combo.push({
                        s_name,
                        s_folder: entry.name,
                        s_path__profile: `${entry.name}/${s_file__profile}`,
                        s_path__remover: `${entry.name}/${s_file__remover}`
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
    const scadPath = path.join(SCAD_DIR, `${baseName}.scad`);
    const stlPath = path.join(OUTPUT_DIR, `${baseName}.stl`);

    yield {
        type: 'progress',
        current: fileIndex + 1,
        total: totalFiles,
        file: inputFile
    };

    try {
        // Generate SCAD
        const inputPath = path.join(INPUT_DIR, inputFile);
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
    await ensureDir(INPUT_DIR);
    await ensureDir(OUTPUT_DIR);
    await ensureDir(SCAD_DIR);

    // Check OpenSCAD
    const openscadCheck = await checkOpenScad();
    if (!openscadCheck.installed) {
        yield { type: 'error', file: '', message: 'OpenSCAD is not installed or not in PATH' };
        return;
    }

    // Get profile paths
    const profilePath = path.join(PROFILES_DIR, profileName);
    const removerPath = path.join(PROFILES_DIR, removerName);

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
        yield { type: 'error', file: '', message: 'No DXF files found in input_dxf_files/' };
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
    INPUT_DIR,
    OUTPUT_DIR,
    SCAD_DIR,
    PROFILES_DIR
};
