import fs from "fs";
import path from "path";

/** Get the Node project root directory containing node_modules. */
export function projectRoot(dir: string = process.cwd()) {
  while (!fs.existsSync(path.resolve(dir, "node_modules/"))) {
    dir = path.dirname(dir);
  }
  return dir;
}

/** Get the user's Vitest module path. (Not the one in this repo) */
export function vitestPath(dir: string = process.cwd()) {
  const vitestPath = (() => {
    while (!fs.existsSync(path.resolve(dir, "node_modules/vitest"))) {
      dir = path.dirname(dir);
    }
    return path.resolve(dir, "node_modules/vitest");
  })();

  const vitestPathNoLinks = fs.realpathSync(vitestPath);

  return vitestPathNoLinks;
}

/** Import a dependency of the user's project's Vitest module. */
export async function importVitestDep(dep: string, depFile: string) {
  const vPath = vitestPath();

  const depPath = (() => {
    let dir = vPath;
    while (!fs.existsSync(path.resolve(dir, `node_modules/${dep}`))) {
      dir = path.dirname(dir);
    }
    return path.resolve(dir, `node_modules/${depFile}`);
  })();

  const module = await import(depPath);

  return module;
}
