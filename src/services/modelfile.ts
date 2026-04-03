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
    const key = parameter.key.trim();
    const value = parameter.value.trim();
    if (/[\r\n]/.test(key) || /[\r\n]/.test(value)) {
      throw new Error(`보안 오류: Modelfile 파라미터에 줄바꿈 문자를 사용할 수 없습니다 (key: ${key}, value: ${value})`);
    }
    lines.push(`PARAMETER ${key} ${value}`);
  }

  const contents = `${lines.join("\n")}\n`;
  await writeFile(modelfilePath, contents, "utf8");
  return modelfilePath;
}
