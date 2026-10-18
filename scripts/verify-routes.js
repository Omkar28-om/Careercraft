import { readFile, readdir } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const appSource = await readFile(join(root, "client/src/App.jsx"), "utf8");
const routePaths = [...appSource.matchAll(/path="([^"]+)"/g)].map((match) => match[1]);
const files = [];

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) await collect(file);
    else if (/\.jsx?$/.test(entry.name)) files.push(file);
  }
}

await collect(join(root, "client/src"));

function routeMatches(destination, pattern) {
  const destinationParts = destination.split(/[?#]/, 1)[0].split("/").filter(Boolean);
  const patternParts = pattern.split("/").filter(Boolean);
  return destinationParts.length === patternParts.length && destinationParts.every((part, index) =>
    patternParts[index].startsWith(":") || patternParts[index] === "*" || part === patternParts[index]
  );
}

const references = [];
const referencePattern = /(?:to|href)\s*=\s*(?:"(\/[^"]*)"|\{\s*`(\/[^`]*)`\})|(?:navigate|window\.location\.assign)\(\s*(?:"(\/[^"]*)"|`(\/[^`]*)`)/g;

for (const file of files) {
  const source = await readFile(file, "utf8");
  for (const match of source.matchAll(referencePattern)) {
    const raw = match.slice(1).find(Boolean);
    if (!raw) continue;
    const destination = raw.replace(/\$\{[^}]+\}/g, ":param");
    references.push({ file: relative(root, file), destination });
  }
}

const unmatched = references.filter(({ destination }) => !routePaths.some((pattern) => routeMatches(destination, pattern)));
if (unmatched.length) {
  console.error("Navigation destinations without matching React Router routes:");
  for (const { file, destination } of unmatched) console.error(`- ${file}: ${destination}`);
  process.exitCode = 1;
} else {
  console.log(`Route check passed: ${references.length} navigation destinations match ${routePaths.length} declared routes.`);
}
