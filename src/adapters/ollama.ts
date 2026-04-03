import { access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { execa } from "execa";

import { CliError } from "../errors.js";
import { t } from "../i18n.js";
import type { OllamaCreateInput } from "../types.js";

async function canExecute(command: string, args: string[]): Promise<boolean> {
  try {
    await execa(command, args);
    return true;
  } catch {
    return false;
  }
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function resolveOllamaCommand(): Promise<string> {
  if (await canExecute("ollama", ["--version"])) {
    return "ollama";
  }

  if (os.platform() === "win32") {
    const localAppData = process.env.LOCALAPPDATA;
    const candidates = [
      localAppData ? path.join(localAppData, "Programs", "Ollama", "ollama.exe") : undefined,
      "C:\\Program Files\\Ollama\\ollama.exe",
    ].filter((value): value is string => Boolean(value));

    for (const candidate of candidates) {
      if (await exists(candidate)) {
        return candidate;
      }
    }
  }

  throw new CliError(t("err.ollama_missing"));
}

export async function ensureOllamaServer(): Promise<void> {
  try {
    const response = await fetch("http://127.0.0.1:11434/api/tags");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch {
    throw new CliError(t("err.ollama_server"));
  }
}

export async function createModel({ modelName, modelfilePath, cwd }: OllamaCreateInput): Promise<void> {
  const ollamaCommand = await resolveOllamaCommand();

  try {
    const subprocess = execa(ollamaCommand, ["create", modelName, "-f", modelfilePath], {
      cwd,
      stdio: "inherit",
    });
    await subprocess;
  } catch (error) {
    if (error instanceof Error) {
      throw new CliError(t("err.ollama_create", { message: error.message }));
    }

    throw new CliError(t("err.ollama_create_unknown"));
  }
}

export async function deleteModel(modelName: string): Promise<void> {
  const ollamaCommand = await resolveOllamaCommand();

  try {
    await execa(ollamaCommand, ["rm", modelName], {
      stdio: "inherit",
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new CliError(t("err.ollama_rm", { message: error.message }));
    }

    throw new CliError(t("err.ollama_rm_unknown"));
  }
}
