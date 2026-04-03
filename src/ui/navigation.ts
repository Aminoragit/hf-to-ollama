import { backableSelect } from "./prompts.js";
import { formatBytes } from "./output.js";
import { BACK, type HfFileEntry } from "../types.js";
import { t } from "../i18n.js";

type NavChoice = { type: "back_dir" } | { type: "dir"; name: string } | { type: "file"; file: HfFileEntry };

export async function navigateAndSelectFile(files: HfFileEntry[], message: string, requiredExtension?: ".gguf"): Promise<HfFileEntry | typeof BACK> {
  const filteredFiles = requiredExtension ? files.filter(f => f.path.toLowerCase().endsWith(requiredExtension)) : files;
  
  if (filteredFiles.length === 0) {
    throw new Error(t("err.no_gguf"));
  }

  let currentDir = "";

  while (true) {
    const choices: any[] = [];
    if (currentDir !== "") {
      choices.push({ name: "🔙 ..", value: { type: "back_dir" } as NavChoice });
    }

    const dirs = new Set<string>();
    const fileChoices = [];

    for (const file of filteredFiles) {
      if (currentDir === "" || file.path.startsWith(currentDir)) {
        const relativePath = currentDir === "" ? file.path : file.path.slice(currentDir.length);
        const parts = relativePath.split("/");

        if (parts.length > 1) {
          dirs.add(parts[0]);
        } else {
          fileChoices.push(file);
        }
      }
    }

    for (const d of Array.from(dirs).sort()) {
      choices.push({ name: `📁 ${d}`, value: { type: "dir", name: d } as NavChoice });
    }

    for (const f of fileChoices) {
      const fileName = currentDir === "" ? f.path : f.path.slice(currentDir.length);
      choices.push({
        name: `📄 ${fileName} (${formatBytes(f.size)})`,
        value: { type: "file", file: f } as NavChoice,
        description: f.revision ? `revision: ${f.revision}` : undefined,
      });
    }

    const answer = await backableSelect({
      message: `${message} [${currentDir === "" ? "/" : "/" + currentDir}]`,
      choices,
      pageSize: 15,
    });

    if (answer === BACK) {
      return BACK;
    }

    const navAnswer = answer as NavChoice;
    if (navAnswer.type === "back_dir") {
      const parts = currentDir.replace(/\/$/, "").split("/");
      parts.pop();
      currentDir = parts.length > 0 ? parts.join("/") + "/" : "";
    } else if (navAnswer.type === "dir") {
      currentDir += navAnswer.name + "/";
    } else if (navAnswer.type === "file") {
      return navAnswer.file;
    }
  }
}
