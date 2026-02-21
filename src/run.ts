import { basename } from "path";
import { detect } from "./detect";
import { patch, unpatch } from "./patcher";
import { register, unregister } from "./registry";
import { isRunning, LOG_FILE } from "./daemon";

interface RunOptions {
  name?: string;
  port?: number;
  cwd?: string;
}

export async function run(script: string, options: RunOptions = {}) {
  const cwd = options.cwd ?? process.cwd();
  const { framework, defaultPort, packageManager } = detect(cwd);
  const appName = options.name ?? basename(cwd);
  const port = options.port ?? defaultPort;

  if (!isRunning()) {
    console.log("↑ Starting portname daemon...");
    Bun.spawn([process.execPath, "__proxy"], {
      stdout: Bun.file(LOG_FILE),
      stderr: Bun.file(LOG_FILE),
      stdin: null,
    });
    await Bun.sleep(500);
  }

  await register(appName, port);

  const patchResult = patch(framework, appName, cwd);
  if (patchResult.patched) {
    console.log(`✓ Auto-configured ${framework} for portname`);
  }

  console.log(`\n✓ ${appName} → http://${appName}.localhost:1999\n`);

  const cmd =
    packageManager === "bun"
      ? ["bun", "run", script]
      : packageManager === "pnpm"
        ? ["pnpm", "run", script]
        : packageManager === "yarn"
          ? ["yarn", script]
          : ["npm", "run", script];

  const proc = Bun.spawn(cmd, {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });

  const cleanup = async () => {
    proc.kill();
    await unregister(appName).catch(() => {});
    unpatch(framework, cwd);
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  await proc.exited;
  await cleanup();
}
