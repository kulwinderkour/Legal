#!/usr/bin/env node
/**
 * CI gate: fails the build if the compiled `.next` output contains any
 * key-shaped string. Run after `next build`, before any deploy step.
 *
 * Patterns cover common secret formats (Google/Gemini API keys, generic
 * long hex/base64 secrets assigned to KEY/SECRET/TOKEN-like identifiers)
 * without flagging ordinary minified code, which is why the generic rule
 * requires an assignment-like context, not just a long token anywhere.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const BUILD_DIR = join(process.cwd(), ".next");

const SECRET_PATTERNS = [
  { name: "Google/Gemini API key", pattern: /AIzaSy[0-9A-Za-z_-]{33}/g },
  {
    name: "Generic assigned secret",
    pattern: /(?:api[_-]?key|secret|token)["']?\s*[:=]\s*["'][A-Za-z0-9_\-]{20,}["']/gi,
  },
];

/** @param {string} dir @returns {string[]} */
function listFilesRecursive(dir) {
  // `dir` is only ever this file's own recursive walk of `.next/`, built
  // from `readdirSync` output, never from user/network input.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return listFilesRecursive(fullPath);
    if (/\.(js|mjs|cjs)$/.test(entry.name)) return [fullPath];
    return [];
  });
}

function main() {
  let stat;
  try {
    stat = statSync(BUILD_DIR);
  } catch {
    console.error(`No build output found at ${BUILD_DIR}. Run "npm run build" first.`);
    process.exit(1);
  }
  if (!stat.isDirectory()) {
    console.error(`${BUILD_DIR} is not a directory.`);
    process.exit(1);
  }

  const files = listFilesRecursive(BUILD_DIR);
  const findings = [];

  for (const file of files) {
    // `file` comes from `listFilesRecursive`'s own walk above, not
    // user/network input.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const content = readFileSync(file, "utf8");
    for (const { name, pattern } of SECRET_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        findings.push({ file, name, count: matches.length });
      }
    }
  }

  if (findings.length > 0) {
    console.error("Secret-shaped strings found in build output:");
    for (const f of findings) {
      console.error(`  ${f.file}: ${f.name} (${f.count} match(es))`);
    }
    process.exit(1);
  }

  console.log(`Scanned ${files.length} build files. No secret-shaped strings found.`);
}

main();
