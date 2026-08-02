/**
 * Minimal ESM resolve hook so the verification harness can import the app's
 * TypeScript modules directly, resolving the same path aliases as tsconfig.json.
 */
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const repoRoot = path.resolve(import.meta.dirname, "..");

/** Mimics the bundler-style resolution Next.js uses: extensionless and directory imports. */
function resolveTsPath(basePath) {
  for (const candidate of [basePath, `${basePath}.ts`, `${basePath}.tsx`, path.join(basePath, "index.ts")]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

const ALIASES = {
  "@rencanangoding/shared": "packages/shared/src/index.ts",
  "@rencanangoding/db": "packages/db/src/index.ts",
  "@rencanangoding/ai": "packages/ai/src/index.ts"
};

export function resolve(specifier, context, nextResolve) {
  let target = null;

  if (ALIASES[specifier]) {
    target = path.join(repoRoot, ALIASES[specifier]);
  } else if (specifier.startsWith("@/")) {
    target = path.join(repoRoot, specifier.slice(2));
  } else if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
    target = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
  }

  if (target) {
    const resolved = resolveTsPath(target);
    if (resolved) {
      return { url: pathToFileURL(resolved).href, shortCircuit: true };
    }
  }

  return nextResolve(specifier, context);
}
