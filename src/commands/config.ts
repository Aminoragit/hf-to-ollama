import { readFile } from "node:fs/promises";
import path from "node:path";

import { getRepoFiles } from "../adapters/hf.js";
import { createModel, deleteModel, ensureOllamaServer } from "../adapters/ollama.js";
import { CliError } from "../errors.js";
import { t } from "../i18n.js";
import { downloadGgufFile } from "../services/download.js";
import { loadInstallManifests, removeInstallDirectory, saveInstallManifest } from "../services/manifest.js";
import { writeModelfile } from "../services/modelfile.js";
import { confirmDeleteLocalFiles, inputOptionalParameter, selectConfigAction, selectManifest, selectAdapterAction, navigateAndSelectFile } from "../ui/prompts.js";
import { info, success, formatBytes } from "../ui/output.js";
import type { HfFileEntry, InstallManifest, ParameterEntry } from "../types.js";

function upsertParameter(parameters: ParameterEntry[], key: string, value: string | undefined): ParameterEntry[] {
  const remaining = parameters.filter((parameter) => parameter.key !== key);
  if (!value) {
    return remaining;
  }

  remaining.push({ key, value });
  return remaining;
}

async function updateManifestParameters(manifest: InstallManifest): Promise<InstallManifest> {
  const currentMap = new Map(manifest.parameters.map((parameter) => [parameter.key, parameter.value]));

  const temperature = await inputOptionalParameter("temperature", currentMap.get("temperature") ?? "1.0");
  const topP = await inputOptionalParameter("top_p", currentMap.get("top_p") ?? "");
  const topK = await inputOptionalParameter("top_k", currentMap.get("top_k") ?? "");
  const numCtx = await inputOptionalParameter("num_ctx", currentMap.get("num_ctx") ?? "");

  let parameters = [...manifest.parameters];
  parameters = upsertParameter(parameters, "temperature", temperature);
  parameters = upsertParameter(parameters, "top_p", topP);
  parameters = upsertParameter(parameters, "top_k", topK);
  parameters = upsertParameter(parameters, "num_ctx", numCtx);

  return {
    ...manifest,
    parameters,
  };
}

export async function runConfigCommand(): Promise<void> {
  const manifests = await loadInstallManifests();
  if (manifests.length === 0) {
    throw new CliError(t("err.no_manifests"));
  }

  const selectedManifest = await selectManifest(manifests);
  const action = await selectConfigAction();

  if (action === "show") {
    const modelfilePath = path.join(selectedManifest.targetDir, "Modelfile");
    const contents = await readFile(modelfilePath, "utf8");
    info(t("info.model_label", { model: selectedManifest.modelName }));
    console.log(contents);
    return;
  }

  if (action === "delete") {
    await ensureOllamaServer();
    await deleteModel(selectedManifest.modelName);
    success(t("success.model_deleted", { model: selectedManifest.modelName }));

    const shouldDeleteLocalFiles = await confirmDeleteLocalFiles();
    if (shouldDeleteLocalFiles) {
      await removeInstallDirectory(selectedManifest.targetDir);
      success(t("success.dir_deleted", { path: selectedManifest.targetDir }));
    }
    return;
  }

  const adapterAction = await selectAdapterAction(selectedManifest.adapterFilename);
  let updatedAdapterFilename = selectedManifest.adapterFilename;

  if (adapterAction === "remove") {
    updatedAdapterFilename = undefined;
  } else if (adapterAction === "change") {
    const accessToken = process.env.HF_TOKEN ?? process.env.HUGGING_FACE_HUB_TOKEN;
    const files = await getRepoFiles(selectedManifest.repoId, undefined, accessToken);
    const adapterCandidates = files.filter((file: HfFileEntry) => path.basename(file.path) !== selectedManifest.ggufFilename && Boolean(file.path.toLowerCase().endsWith(".gguf") || file.path.toLowerCase().endsWith(".safetensors")));
    if (adapterCandidates.length === 0) {
      throw new CliError(t("err.no_gguf"));
    }
    
    const newAdapterFile = await navigateAndSelectFile(adapterCandidates, t("prompt.use_adapter"));
    info(t("info.download_adapter_start"));
    const downloadResult = await downloadGgufFile({
      repoId: selectedManifest.repoId,
      file: newAdapterFile,
      accessToken,
      targetDir: selectedManifest.targetDir
    });
    updatedAdapterFilename = path.basename(downloadResult.filePath);
    
    if (downloadResult.alreadyExists) {
      success(t("success.already_downloaded", { path: downloadResult.filePath, size: formatBytes(downloadResult.bytesWritten) }));
    } else {
      success(t("success.adapter_download_complete", { path: downloadResult.filePath, size: formatBytes(downloadResult.bytesWritten) }));
    }
  }

  let updatedManifest: InstallManifest = { ...selectedManifest, adapterFilename: updatedAdapterFilename };
  updatedManifest = await updateManifestParameters(updatedManifest);
  const modelfilePath = await writeModelfile(updatedManifest.targetDir, {
    ggufFilename: updatedManifest.ggufFilename,
    adapterFilename: updatedManifest.adapterFilename,
    parameters: updatedManifest.parameters,
  });

  await ensureOllamaServer();
  await createModel({ modelName: updatedManifest.modelName, modelfilePath, cwd: updatedManifest.targetDir });
  await saveInstallManifest(updatedManifest);
  success(t("success.model_recreated", { model: updatedManifest.modelName }));
}
