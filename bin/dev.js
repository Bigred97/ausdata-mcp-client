#!/usr/bin/env node
// Dev runner: builds then runs the server. Use `npm run dev`.
import { spawnSync } from "node:child_process";

const build = spawnSync("npx", ["tsc"], { stdio: "inherit" });
if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const run = spawnSync("node", ["./bin/run.js"], { stdio: "inherit" });
process.exit(run.status ?? 0);
