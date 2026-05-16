#!/usr/bin/env node
import { main } from "../dist/index.js";

main().catch((err) => {
  process.stderr.write(`[ausdata-mcp] fatal: ${err?.message ?? err}\n`);
  process.exit(1);
});
