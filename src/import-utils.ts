import fs from "fs";
import path from "path";

export async function vitestPath() {
  const vitestPath = (() => {
    let dir = process.cwd();
    while (!fs.existsSync(path.resolve(dir, "node_modules/vitest")))
      dir = path.dirname(dir);
    return path.resolve(dir, "node_modules/vitest");
  })();

  const vitestPathNoLinks = fs.realpathSync(vitestPath);

  return vitestPathNoLinks;
}

export async function importVitest(): Promise<typeof import("vitest")> {
  const vPath = `${await vitestPath()}/dist/index.js`;
  return await import(vPath);
}

export async function importVitestDep(dep: string, depFile: string) {
  const vPath = await vitestPath();

  const depPath = (() => {
    let dir = vPath;
    while (!fs.existsSync(path.resolve(dir, `node_modules/${dep}`)))
      dir = path.dirname(dir);
    return path.resolve(dir, `node_modules/${depFile}`);
  })();

  const module = await import(depPath);

  return module;
}
