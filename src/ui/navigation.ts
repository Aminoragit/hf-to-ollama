import { select } from "@inquirer/prompts";
import { formatBytes } from "./output.js";
import type { HfFileEntry } from "../types.js";
import { t } from "../i18n.js";

type NavChoice = { type: "back" } | { type: "dir"; name: string } | { type: "file"; file: HfFileEntry };

export async function navigateAndSelectFile(files: HfFileEntry[], message: string, requiredExtension?: ".gguf" | ".safetensors"): Promise<HfFileEntry> {
  const filteredFiles = requiredExtension ? files.filter(f => f.path.toLowerCase().endsWith(requiredExtension)) : files;
  
  if (filteredFiles.length === 0) {
    throw new Error(t("err.no_gguf")); // Will be replaced with generic error text.
  }

  let currentDir = "";

  while (true) {
    const choices = [];
    if (currentDir !== "") {
      choices.push({ name: "🔙 ..", value: { type: "back" } as NavChoice });
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

    const answer = await select<NavChoice>({
      message: `${message} [${currentDir === "" ? "/" : "/" + currentDir}]`,
      choices,
      pageSize: 15,
    });

    if (answer.type === "back") {
      const parts = currentDir.replace(/\/$/, "").split("/");
      parts.pop();
      currentDir = parts.length > 0 ? parts.join("/") + "/" : "";
    } else if (answer.type === "dir") {
      currentDir += answer.name + "/";
    } else if (answer.type === "file") {
      return answer.file;
    }
  }
}
