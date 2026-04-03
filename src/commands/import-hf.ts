import { access, mkdir, stat } from "node:fs/promises";
import path from "node:path";

import type { CliOptions, HfFileEntry, ParameterEntry } from "../types.js";
import { getRepoFiles } from "../adapters/hf.js";
import { getLocalRepoFiles } from "../adapters/local.js";
import { createModel, ensureOllamaServer, resolveOllamaCommand } from "../adapters/ollama.js";
import { CliError } from "../errors.js";
import { t } from "../i18n.js";
import { downloadGgufFile } from "../services/download.js";
import { saveInstallManifest } from "../services/manifest.js";
import { writeModelfile } from "../services/modelfile.js";
import { getDefaultTargetDir, sanitizeSegment } from "../services/paths.js";
import { confirmOverwrite, confirmUseAdapter, inputModelName, navigateAndSelectFile } from "../ui/prompts.js";
import { formatBytes, info, success, warn } from "../ui/output.js";

export function resolveAccessToken(cliToken?: string): string | undefined {
  return cliToken ?? process.env.HF_TOKEN ?? process.env.HUGGING_FACE_HUB_TOKEN;
}

function buildDefaultModelName(repoId: string, filePath: string, isLocal = false): string {
  if (isLocal) {
    const filePart = path.basename(filePath, path.extname(filePath)).split(".")[0] || "model";
    return `local-${sanitizeSegment(filePart)}`;
  }
  const repoPart = repoId.split("/").map(sanitizeSegment).join("-");
  const filePart = path.basename(filePath, path.extname(filePath)).split(".")[0] || "model";
  return `${repoPart}-${sanitizeSegment(filePart)}`;
}

function parseParameterEntries(rawParameters: string[] | undefined): ParameterEntry[] {
  if (!rawParameters || rawParameters.length === 0) {
    return [];
  }

  return rawParameters.map((entry) => {
    const separatorIndex = entry.indexOf("=");
    if (separatorIndex <= 0 || separatorIndex === entry.length - 1) {
      throw new CliError(t("err.parameter_format", { entry }));
    }

    const key = entry.slice(0, separatorIndex).trim();
    const value = entry.slice(separatorIndex + 1).trim();

    if (!key || !value) {
      throw new CliError(t("err.parameter_format", { entry }));
    }

    if (/\s/.test(key)) {
      throw new CliError(t("err.parameter_key_space", { key }));
    }

    return { key, value };
  });
}

async function ensureSafeWrite(pathLabel: string, nonInteractive: boolean, yes = false): Promise<void> {
  try {
    await access(pathLabel);
  } catch {
    return;
  }

  if (yes) {
    return;
  }

  if (nonInteractive) {
    throw new CliError(t("err.path_conflict", { path: pathLabel }));
  }

  const confirmed = await confirmOverwrite(pathLabel);
  if (!confirmed) {
    throw new CliError(t("err.overwrite_cancelled"));
  }
}

function findFileByPath(files: HfFileEntry[], filePath: string, label: string): HfFileEntry {
  const selected = files.find((file) => file.path === filePath);
  if (!selected) {
    throw new CliError(t("err.file_not_found", { label, path: filePath }));
  }

  return selected;
}

export async function importFromHuggingFace(repoId: string, options: CliOptions, files: HfFileEntry[]): Promise<void> {
  const accessToken = resolveAccessToken(options.token);
  const parameterEntries = parseParameterEntries(options.parameter);

  await importGgufFlow(repoId, options, files, accessToken, parameterEntries);
}

async function importGgufFlow(repoId: string, options: CliOptions, files: HfFileEntry[], accessToken?: string, parameterEntries: ParameterEntry[] = []) {
  info(t("info.found_gguf", { count: files.filter(f => f.path.toLowerCase().endsWith(".gguf")).length }));

  const ggufFiles = files.filter(f => f.path.toLowerCase().endsWith(".gguf"));

  let selectedFile: HfFileEntry;
  if (options.file) {
    selectedFile = findFileByPath(ggufFiles, options.file, "GGUF");
  } else if (options.nonInteractive) {
    throw new CliError(t("err.non_interactive_file"));
  } else {
    selectedFile = await navigateAndSelectFile(ggufFiles, t("prompt.model_file"), ".gguf");
  }

  let selectedAdapterFile: HfFileEntry | undefined;
  const adapterCandidates = ggufFiles.filter((file) => file.path !== selectedFile.path);

  if (options.adapter) {
    if (options.adapter === selectedFile.path) {
      throw new CliError(t("err.same_adapter"));
    }
    selectedAdapterFile = findFileByPath(adapterCandidates, options.adapter, "ADAPTER GGUF");
  } else if (adapterCandidates.length > 0 && !options.nonInteractive) {
    const shouldUseAdapter = await confirmUseAdapter();
    if (shouldUseAdapter) {
      info(t("info.adapter_candidates", { count: adapterCandidates.length }));
      selectedAdapterFile = await navigateAndSelectFile(adapterCandidates, "Select an ADAPTER GGUF file to apply.", ".gguf");
    }
  }

  const targetDir = path.resolve(options.dir ?? getDefaultTargetDir(repoId), sanitizeSegment(path.dirname(selectedFile.path) || "root"));
  await mkdir(targetDir, { recursive: true });

  info(t("info.selected_model", { path: selectedFile.path, size: formatBytes(selectedFile.size) }));
  if (selectedAdapterFile) {
    info(t("info.selected_adapter", { path: selectedAdapterFile.path, size: formatBytes(selectedAdapterFile.size) }));
  }
  if (parameterEntries.length > 0) {
    info(t("info.parameters_applied", { count: parameterEntries.length }));
    parameterEntries.forEach((parameter) => info(t("info.parameter_line", { key: parameter.key, value: parameter.value })));
  }
  info(t("info.target_dir", { path: targetDir }));

  const defaultModelName = buildDefaultModelName(repoId, selectedFile.path, Boolean(options.local));
  const modelName = options.name ? options.name : options.nonInteractive ? defaultModelName : await inputModelName(defaultModelName);

  const ggufPath = path.join(targetDir, path.basename(selectedFile.path));
  await ensureSafeWrite(ggufPath, Boolean(options.nonInteractive), options.yes);

  const adapterPath = selectedAdapterFile ? path.join(targetDir, path.basename(selectedAdapterFile.path)) : undefined;
  if (adapterPath) {
    await ensureSafeWrite(adapterPath, Boolean(options.nonInteractive), options.yes);
  }

  if (options.dryRun) {
    const adapterMessage = selectedAdapterFile ? `, adapter=${selectedAdapterFile.path}` : "";
    const parameterMessage = parameterEntries.length > 0 ? `, parameters=${parameterEntries.map((entry) => `${entry.key}=${entry.value}`).join(",")}` : "";
    success(t("success.dry_run", { file: selectedFile.path, extra: `${adapterMessage}${parameterMessage}`, out: ggufPath, model: modelName }));
    return;
  }

  const ollamaCommand = await resolveOllamaCommand();
  await ensureOllamaServer();
  info(t("info.ollama_command", { cmd: ollamaCommand }));

  let ggufFilename: string;
  let adapterFilename: string | undefined;

  if (options.local) {
    ggufFilename = selectedFile.path;
    if (selectedAdapterFile) {
      adapterFilename = selectedAdapterFile.path;
    }
  } else {
    info(t("info.download_model_start"));
    const downloadResult = await downloadGgufFile({ repoId, file: selectedFile, revision: options.revision, accessToken, targetDir });
    ggufFilename = path.basename(downloadResult.filePath);
    if (downloadResult.alreadyExists) {
      success(t("success.already_downloaded", { path: downloadResult.filePath, size: formatBytes(downloadResult.bytesWritten) }));
    } else {
      success(t("success.download_complete", { path: downloadResult.filePath, size: formatBytes(downloadResult.bytesWritten) }));
    }

    if (selectedAdapterFile) {
      info(t("info.download_adapter_start"));
      const adapterDownloadResult = await downloadGgufFile({ repoId, file: selectedAdapterFile, revision: options.revision, accessToken, targetDir });
      adapterFilename = path.basename(adapterDownloadResult.filePath);
      
      if (adapterDownloadResult.alreadyExists) {
        success(t("success.already_downloaded", { path: adapterDownloadResult.filePath, size: formatBytes(adapterDownloadResult.bytesWritten) }));
      } else {
        success(t("success.adapter_download_complete", { path: adapterDownloadResult.filePath, size: formatBytes(adapterDownloadResult.bytesWritten) }));
      }
    }
  }

  const modelfilePath = await writeModelfile(targetDir, {
    ggufFilename,
    adapterFilename,
    parameters: parameterEntries,
  });
  info(t("info.modelfile_created", { path: modelfilePath }));
  info(t("info.model_create_start"));

  if (!options.local) {
    try {
      const stats = await stat(path.join(targetDir, ggufFilename));
      if (stats.size === 0) {
        throw new CliError(t("err.zero_size"));
      }
    } catch (error) {
      if (error instanceof CliError) throw error;
      warn(t("warn.file_check_failed"));
    }
  }

  await createModel({ modelName, modelfilePath, cwd: targetDir });

  await saveInstallManifest({
    modelName,
    repoId,
    targetDir,
    ggufFilename,
    adapterFilename,
    parameters: parameterEntries,
    createdAt: new Date().toISOString(),
  });

  success(t("success.model_created", { model: modelName }));
  info(t("info.run_command", { model: modelName }));
}


