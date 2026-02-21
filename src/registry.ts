import { existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import os from "os";

const portname_DIR = join(os.homedir(), ".portname");
const REGISTRY_FILE = join(portname_DIR, "routes.json");

type Registry = Record<string, number>; // { "myapp": 5173, "api": 3001 }

function load(): Registry {
  if (!existsSync(REGISTRY_FILE)) return {};
  return JSON.parse(readFileSync(REGISTRY_FILE, "utf-8"));
}

async function save(registry: Registry) {
  if (!existsSync(portname_DIR)) mkdirSync(portname_DIR, { recursive: true });
  await Bun.write(REGISTRY_FILE, JSON.stringify(registry, null, 2));
}

export async function register(name: string, port: number) {
  const registry = load();
  registry[name] = port;
  await save(registry);
  console.log(`✓ Registered ${name} → port ${port}`);
}

export async function unregister(name: string) {
  const registry = load();
  if (!registry[name]) {
    console.error(`✗ No app registered as "${name}"`);
    process.exit(1);
  }
  delete registry[name];
  await save(registry);
  console.log(`✓ Unregistered ${name}`);
}

export function getPort(name: string): number | null {
  const registry = load();
  return registry[name] ?? null;
}

export function list() {
  const registry = load();
  const entries = Object.entries(registry);
  if (entries.length === 0) {
    console.log("No apps registered.");
    return;
  }
  for (const [name, port] of entries) {
    console.log(`  ${name} → localhost:${port}`);
  }
}
