import { writeFile } from "node:fs/promises";
import path from "node:path";

import type { ModelfileOptions } from "../types.js";

export async function writeModelfile(targetDir: string, options: ModelfileOptions): Promise<string> {
  const modelfilePath = path.join(targetDir, "Modelfile");
  
  const resolveGgufPath = (p: string) => path.isAbsolute(p) ? `"${p}"` : `"./${p}"`;
  const lines = [`FROM ${resolveGgufPath(options.ggufFilename)}`];

  if (options.adapterFilename) {
    lines.push(`ADAPTER ${resolveGgufPath(options.adapterFilename)}`);
  }

  for (const parameter of options.parameters ?? []) {
    lines.push(`PARAMETER ${parameter.key} ${parameter.value}`);
  }

  const contents = `${lines.join("\n")}\n`;
  await writeFile(modelfilePath, contents, "utf8");
  return modelfilePath;
}
