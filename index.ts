import { join } from "path";
import { writeFileSync } from "fs";
import { cac } from "cac";
import { register, unregister, list } from "./src/registry";
import {
  stopDaemon,
  status,
  isRunning,
  LOG_FILE,
  PID_FILE,
} from "./src/daemon";
import { run } from "./src/run";

if (Bun.argv[2] === "__proxy") {
  const { startProxy } = await import("./src/proxy");
  startProxy();
  process.exit = () => process.exit(0); // prevent accidental exits
}

process.on("uncaughtException", (err) => {
  console.error(`✗ Error: ${err.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  console.error(`✗ Error: ${msg}`);
  process.exit(1);
});

const cli = cac("portname");

// ─── start
cli.command("start", "Start the proxy daemon").action(() => {
  if (isRunning()) {
    console.log("portname is already running. Use: portname status");
    process.exit(0);
  }

  // process.execPath = path to current binary (works compiled or via bun)
  const proc = Bun.spawn([process.execPath, "__proxy"], {
    stdout: Bun.file(LOG_FILE),
    stderr: Bun.file(LOG_FILE),
    stdin: null,
  });

  writeFileSync(PID_FILE, proc.pid.toString());
  console.log(`✓ portname started (pid ${proc.pid}) → http://*.localhost:1999`);
  console.log(`  logs: ${LOG_FILE}`);
});

// ─── stop
cli.command("stop", "Stop the proxy daemon").action(() => stopDaemon());

// ─── status
cli.command("status", "Show daemon status").action(() => status());

// ─── run
cli
  .command("run <script>", "Run a dev server with portname proxy")
  .option("--name <name>", "App name (defaults to folder name)")
  .option("--port <port>", "Port override")
  .action(async (script: string, options: { name?: string; port?: string }) => {
    await run(script, {
      name: options.name,
      port: options.port ? parseInt(options.port) : undefined,
    });
  });

// ─── register
cli
  .command("register <name> <port>", "Manually register an app")
  .action(async (name: string, port: string) => {
    const parsed = parseInt(port);
    if (isNaN(parsed)) {
      console.error(`✗ Invalid port: "${port}"`);
      process.exit(1);
    }
    await register(name, parsed);
    console.log(`  Access at: http://${name}.localhost:1999`);
  });

// ─── unregister
cli
  .command("unregister <name>", "Remove a registered app")
  .action(async (name: string) => await unregister(name));

// ─── list
cli.command("list", "List all registered apps").action(() => list());

// ─── open
cli
  .command("open <name>", "Open an app in the browser")
  .action((name: string) => {
    const url = `http://${name}.localhost:1999`;
    const opener =
      process.platform === "win32"
        ? ["cmd", "/c", "start", url]
        : process.platform === "darwin"
          ? ["open", url]
          : ["xdg-open", url];
    Bun.spawn(opener);
    console.log(`Opening ${url}...`);
  });

cli.help();
cli.version("0.1.0");
cli.parse();
