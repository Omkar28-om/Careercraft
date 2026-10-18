import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const commands = [
  {
    name: "API",
    cwd: resolve(root, "server"),
    script: resolve(root, "server/node_modules/nodemon/bin/nodemon.js"),
    args: ["src/server.js"],
  },
  {
    name: "Web",
    cwd: resolve(root, "client"),
    script: resolve(root, "client/node_modules/vite/bin/vite.js"),
    args: ["--host", "0.0.0.0"],
  },
];

const children = commands.map(({ name, cwd, script, args }) => {
  const child = spawn(process.execPath, [script, ...args], {
    cwd,
    stdio: "inherit",
    windowsHide: true,
  });
  child.on("error", (error) => {
    console.error(`[${name}] Could not start: ${error.message}`);
  });
  child.on("exit", (code) => {
    if (code && code !== 0) console.error(`[${name}] exited with code ${code}`);
  });
  return child;
});

function stopAll() {
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
}

process.on("SIGINT", stopAll);
process.on("SIGTERM", stopAll);
