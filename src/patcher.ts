import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { Framework } from "./detect";

// marker we add to configs so we can find and remove our changes later
const portname_MARKER = "// portname:managed";

interface PatchResult {
  patched: boolean;
  message: string;
}

// ─── Vite ───────────────────────────────────────────────────────────────────
function patchVite(cwd: string, appName: string): PatchResult {
  const configPath = existsSync(join(cwd, "vite.config.ts"))
    ? join(cwd, "vite.config.ts")
    : existsSync(join(cwd, "vite.config.js"))
      ? join(cwd, "vite.config.js")
      : null;

  if (!configPath) {
    return { patched: false, message: "No vite config found" };
  }

  const content = readFileSync(configPath, "utf-8");
  const hostname = `${appName}.localhost`;

  if (content.includes(portname_MARKER)) {
    return { patched: true, message: "Already patched" };
  }

  const serverBlockExists = content.includes("server:");

  let patched: string;

  if (serverBlockExists) {
    patched = content.replace(
      "server:",
      `server:\n    allowedHosts: ["${hostname}"], ${portname_MARKER}`,
    );
  } else {
    patched = content.replace(
      /export default defineConfig\(\{/,
      `export default defineConfig({\n  server: {\n    allowedHosts: ["${hostname}"], ${portname_MARKER}\n  },`,
    );
  }

  writeFileSync(configPath, patched);
  return { patched: true, message: `Patched ${configPath}` };
}

// ─── Next.js ────────────────────────────────────────────────────────────────
function patchNext(cwd: string, appName: string): PatchResult {
  const configPath = existsSync(join(cwd, "next.config.ts"))
    ? join(cwd, "next.config.ts")
    : existsSync(join(cwd, "next.config.js"))
      ? join(cwd, "next.config.js")
      : existsSync(join(cwd, "next.config.mjs"))
        ? join(cwd, "next.config.mjs")
        : null;

  if (!configPath) {
    return { patched: false, message: "No next config found" };
  }

  const content = readFileSync(configPath, "utf-8");
  const hostname = `${appName}.localhost`;

  if (content.includes(portname_MARKER)) {
    return { patched: true, message: "Already patched" };
  }

  const patched = content.replace(
    /const nextConfig[^=]*=\s*\{/,
    `const nextConfig = {\n  allowedDevOrigins: ["${hostname}"], ${portname_MARKER}`,
  );

  writeFileSync(configPath, patched);
  return { patched: true, message: `Patched ${configPath}` };
}

// ─── Main patch function ─────────────────────────────────────────────────────
export function patch(
  framework: Framework,
  appName: string,
  cwd: string = process.cwd(),
): PatchResult {
  switch (framework) {
    case "vite":
    case "sveltekit":
      return patchVite(cwd, appName);
    case "next":
      return patchNext(cwd, appName);
    default:
      return { patched: false, message: `No patcher for ${framework}` };
  }
}

// ─── Unpatch ─────────────────────────────────────────────────────────────────
export function unpatch(framework: Framework, cwd: string = process.cwd()) {
  const configFiles = [
    "vite.config.ts",
    "vite.config.js",
    "next.config.ts",
    "next.config.js",
    "next.config.mjs",
  ];

  for (const file of configFiles) {
    const filePath = join(cwd, file);
    if (!existsSync(filePath)) continue;

    const content = readFileSync(filePath, "utf-8");
    if (!content.includes(portname_MARKER)) continue;

    // Remove any line that contains our marker
    const cleaned = content
      .split("\n")
      .filter((line) => !line.includes(portname_MARKER))
      .join("\n");

    writeFileSync(filePath, cleaned);
    console.log(`✓ Unpatched ${filePath}`);
  }
}
