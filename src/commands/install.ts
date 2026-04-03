import path from "node:path";
import { BACK, type CliOptions, type HfFileEntry, type ParameterEntry } from "../types.js";
import { 
  executeGgufImport, 
  resolveAccessToken, 
  parseParameterEntries, 
  buildDefaultModelName 
} from "./import-hf.js";
import { 
  selectInputMode, 
  inputRepoId, 
  inputLocalPath, 
  searchRepoId, 
  inputSaveDir, 
  inputOptionalParameter, 
  inputModelName, 
  confirmUseAdapter, 
  navigateAndSelectFile, 
  confirmOverwrite 
} from "../ui/prompts.js";
import { getRepoFiles } from "../adapters/hf.js";
import { getLocalRepoFiles } from "../adapters/local.js";
import { getDefaultTargetDir, sanitizeSegment } from "../services/paths.js";
import { error, info } from "../ui/output.js";
import { CliError } from "../errors.js";
import { t } from "../i18n.js";

type WizardStep = 
  | 'SELECT_INPUT_MODE'
  | 'REPO_INPUT'
  | 'FETCH_FILES'
  | 'MODEL_FILE_SELECT'
  | 'ADAPTER_CONFIRM'
  | 'ADAPTER_FILE_SELECT'
  | 'SAVE_DIR_INPUT'
  | 'PARAMETERS_INPUT'
  | 'MODEL_NAME_INPUT'
  | 'EXECUTE';

interface WizardState {
  step: WizardStep;
  inputMode?: "direct" | "search" | "local";
  repoId?: string;
  isLocalMode?: boolean;
  files?: HfFileEntry[];
  selectedFile?: HfFileEntry;
  selectedAdapter?: HfFileEntry;
  targetDir?: string;
  parameters?: ParameterEntry[];
  modelName?: string;
}

export async function runInstallCommand(options: CliOptions & { repo?: string }): Promise<void> {
  const accessToken = resolveAccessToken(options.token);
  const cliParameters = parseParameterEntries(options.parameter);

  let history: WizardState[] = [];
  let currentState: WizardState = {
    step: options.repo ? 'FETCH_FILES' : 'SELECT_INPUT_MODE',
    repoId: options.repo?.trim(),
  };

  while (currentState.step !== 'EXECUTE') {
    try {
      switch (currentState.step) {
        case 'SELECT_INPUT_MODE': {
          const mode = await selectInputMode();
          if (mode === BACK) {
             info(t("info.operation_cancelled"));
             return;
          }
          history.push({ ...currentState });
          currentState.inputMode = mode;
          currentState.step = 'REPO_INPUT';
          break;
        }

        case 'REPO_INPUT': {
          let nextRepoId: string | typeof BACK;
          if (currentState.inputMode === 'search') {
            nextRepoId = await searchRepoId();
          } else if (currentState.inputMode === 'local') {
            nextRepoId = await inputLocalPath();
          } else {
            nextRepoId = await inputRepoId();
          }

          if (nextRepoId === BACK) {
            currentState = history.pop()!;
            break;
          }

          history.push({ ...currentState });
          currentState.repoId = nextRepoId;
          currentState.isLocalMode = currentState.inputMode === 'local';
          currentState.step = 'FETCH_FILES';
          break;
        }

        case 'FETCH_FILES': {
          try {
            if (currentState.isLocalMode) {
              currentState.files = await getLocalRepoFiles(currentState.repoId!);
            } else {
              currentState.files = await getRepoFiles(currentState.repoId!, options.revision, accessToken);
            }

            const hasGguf = currentState.files.some((f) => f.path.toLowerCase().endsWith(".gguf"));
            if (!hasGguf) {
              error(t("err.no_gguf_found"));
              currentState = history.pop()!;
              break;
            }

            history.push({ ...currentState });
            currentState.step = 'MODEL_FILE_SELECT';
          } catch (err) {
            error(`${t("err.repo_access")}: ${err instanceof Error ? err.message : String(err)}`);
            currentState = history.pop()!;
          }
          break;
        }

        case 'MODEL_FILE_SELECT': {
          const ggufFiles = currentState.files!.filter(f => f.path.toLowerCase().endsWith(".gguf"));
          const selected = await navigateAndSelectFile(ggufFiles, t("prompt.model_file"), ".gguf");

          if (selected === BACK) {
            currentState = history.pop()!;
            // skip FETCH_FILES when going back from MODEL_FILE_SELECT to REPO_INPUT
            if (currentState.step === 'FETCH_FILES') {
                currentState = history.pop()!;
            }
            break;
          }

          history.push({ ...currentState });
          currentState.selectedFile = selected;
          currentState.step = 'ADAPTER_CONFIRM';
          break;
        }

        case 'ADAPTER_CONFIRM': {
          const adapterCandidates = currentState.files!.filter((file) => 
            file.path.toLowerCase().endsWith(".gguf") && file.path !== currentState.selectedFile!.path
          );

          if (adapterCandidates.length === 0) {
            currentState.step = 'SAVE_DIR_INPUT';
            break;
          }

          const useAdapter = await confirmUseAdapter();
          if (useAdapter === BACK) {
            currentState = history.pop()!;
            break;
          }

          history.push({ ...currentState });
          if (useAdapter) {
            currentState.step = 'ADAPTER_FILE_SELECT';
          } else {
            currentState.selectedAdapter = undefined;
            currentState.step = 'SAVE_DIR_INPUT';
          }
          break;
        }

        case 'ADAPTER_FILE_SELECT': {
          const adapterCandidates = currentState.files!.filter((file) => 
            file.path.toLowerCase().endsWith(".gguf") && file.path !== currentState.selectedFile!.path
          );
          const selected = await navigateAndSelectFile(adapterCandidates, "Select an ADAPTER GGUF file to apply.", ".gguf");

          if (selected === BACK) {
            currentState = history.pop()!;
            break;
          }

          history.push({ ...currentState });
          currentState.selectedAdapter = selected;
          currentState.step = 'SAVE_DIR_INPUT';
          break;
        }

        case 'SAVE_DIR_INPUT': {
          const defaultDir = currentState.repoId !== "local" 
            ? getDefaultTargetDir(currentState.repoId!) 
            : path.join(process.cwd(), ".hf-to-ollama", "local-models");
          
          const inputDir = await inputSaveDir(options.dir ?? defaultDir);
          if (inputDir === BACK) {
            currentState = history.pop()!;
            // If we came from ADAPTER_CONFIRM (no adapter used), history might point there
            break;
          }

          history.push({ ...currentState });
          currentState.targetDir = path.resolve(inputDir, sanitizeSegment(path.dirname(currentState.selectedFile!.path) || "root"));
          currentState.step = 'PARAMETERS_INPUT';
          break;
        }

        case 'PARAMETERS_INPUT': {
          const temp = await inputOptionalParameter("temperature", "1.0");
          if (temp === BACK) { currentState = history.pop()!; break; }
          
          const topP = await inputOptionalParameter("top_p");
          if (topP === BACK) { currentState = history.pop()!; break; }
          
          const topK = await inputOptionalParameter("top_k");
          if (topK === BACK) { currentState = history.pop()!; break; }
          
          const numCtx = await inputOptionalParameter("num_ctx");
          if (numCtx === BACK) { currentState = history.pop()!; break; }

          const interactiveParams: ParameterEntry[] = [];
          if (temp) interactiveParams.push({ key: "temperature", value: temp });
          if (topP) interactiveParams.push({ key: "top_p", value: topP });
          if (topK) interactiveParams.push({ key: "top_k", value: topK });
          if (numCtx) interactiveParams.push({ key: "num_ctx", value: numCtx });

          history.push({ ...currentState });
          currentState.parameters = [...cliParameters, ...interactiveParams];
          currentState.step = 'MODEL_NAME_INPUT';
          break;
        }

        case 'MODEL_NAME_INPUT': {
          const defaultName = buildDefaultModelName(currentState.repoId!, currentState.selectedFile!.path, currentState.isLocalMode);
          const name = await inputModelName(options.name ?? defaultName);

          if (name === BACK) {
            currentState = history.pop()!;
            break;
          }

          history.push({ ...currentState });
          currentState.modelName = name;
          currentState.step = 'EXECUTE';
          break;
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("User force closed")) {
        info(`\n${t("info.operation_cancelled")}`);
        process.exit(0);
      }
      error(`${t("err.unexpected")}: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
  }

  // 최종 실행 전 안전 확인 (Overwrite 등)
  const ggufPath = path.join(currentState.targetDir!, path.basename(currentState.selectedFile!.path));
  try {
    const fs = await import("node:fs/promises");
    await fs.access(ggufPath);
    if (!options.yes && !options.nonInteractive) {
      const confirm = await confirmOverwrite(ggufPath);
      if (confirm === BACK || !confirm) {
        info(t("err.overwrite_cancelled"));
        return;
      }
    }
  } catch {
    // 파일 없으면 진행
  }

  await executeGgufImport({
    repoId: currentState.repoId!,
    selectedFile: currentState.selectedFile!,
    selectedAdapterFile: currentState.selectedAdapter,
    targetDir: currentState.targetDir!,
    modelName: currentState.modelName!,
    parameters: currentState.parameters!,
    isLocalMode: currentState.isLocalMode,
    revision: options.revision,
    accessToken,
    dryRun: options.dryRun,
    nonInteractive: options.nonInteractive,
    yes: options.yes
  });
}
