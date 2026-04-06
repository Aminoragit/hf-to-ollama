import { createPrompt, useState, useKeypress, usePrefix, makeTheme, isEnterKey, isDownKey, isUpKey, usePagination, Separator } from "@inquirer/core";
import figures from "@inquirer/figures";
import { styleText } from "node:util";
import { BACK } from "../types.js";
import { t } from "../i18n.js";
import { searchModels } from "../adapters/hf.js";
import patchedSearch from "./patched-search.js";
import type { HfFileEntry, InstallManifest } from "../types.js";
import { formatBytes } from "./output.js";

// --- Backable Prompt Helpers ---

export const backableInput = createPrompt<string | typeof BACK, { message: string; default?: string; validate?: (v: string) => boolean | string }>(
  (config, done) => {
    const [status, setStatus] = useState("idle");
    const [defaultValue] = useState(config.default || "");
    const [errorMsg, setErrorMsg] = useState<string | undefined>();
    const [currentInput, setCurrentInput] = useState("");
    const prefix = usePrefix({ status });

    useKeypress((key, rl) => {
      if (key.name === "escape") {
        done(BACK);
      } else if (isEnterKey(key)) {
        const answer = rl.line || defaultValue;
        const isValid = config.validate ? config.validate(answer) : true;
        if (isValid === true) {
          setStatus("done");
          done(answer);
        } else {
          setErrorMsg(typeof isValid === "string" ? isValid : "Invalid input");
          setCurrentInput(rl.line);
        }
      } else {
        setCurrentInput(rl.line);
      }
    });

    const message = styleText("bold", config.message);
    if (status === "done") {
      return `${prefix} ${message}`;
    }

    const hint = !currentInput && defaultValue ? styleText("dim", `(${defaultValue})`) : "";
    let out = `${prefix} ${message} ${hint}`;
    if (errorMsg) {
      out += `\n${styleText("red", ">> " + errorMsg)}`;
    }
    return out;
  }
);

interface Choice<V> {
  value: V;
  name?: string;
  description?: string;
  disabled?: boolean | string;
}

export const backableSelect = createPrompt<any | typeof BACK, { message: string; choices: Choice<any>[]; pageSize?: number }>(
  (config, done) => {
    const { pageSize = 7 } = config;
    const [status, setStatus] = useState("idle");
    const prefix = usePrefix({ status });
    const theme = makeTheme({
      style: {
        highlight: (text: string) => styleText("cyan", text),
        answer: (text: string) => styleText("cyan", text),
        message: (text: string) => styleText("bold", text),
      }
    } as any);

    const [active, setActive] = useState(0);

    useKeypress((key) => {
      if (key.name === "escape") {
        done(BACK);
      } else if (isEnterKey(key)) {
        setStatus("done");
        done(config.choices[active].value);
      } else if (isUpKey(key)) {
        setActive((active - 1 + config.choices.length) % config.choices.length);
      } else if (isDownKey(key)) {
        setActive((active + 1) % config.choices.length);
      }
    });

    const message = theme.style.message(config.message, status);
    if (status === "done") {
      const choice = config.choices[active];
      return `${prefix} ${message} ${theme.style.answer(choice.name || String(choice.value))}`;
    }

    const page = usePagination({
      items: config.choices,
      active,
      renderItem({ item, isActive }) {
        if (Separator.isSeparator(item)) return ` ${item.separator}`;
        const color = isActive ? theme.style.highlight : (x: string) => x;
        const cursor = isActive ? figures.pointer : " ";
        return color(`${cursor} ${item.name || String(item.value)}`);
      },
      pageSize,
    });

    return `${prefix} ${message}\n${page}${styleText("dim", "\n(Use arrow keys, ESC to go back)")}`;
  }
);

export const backableConfirm = createPrompt<boolean | typeof BACK, { message: string; default?: boolean }>(
  (config, done) => {
    const [status, setStatus] = useState("idle");
    const [value, setValue] = useState<boolean>(config.default ?? false);
    const prefix = usePrefix({ status });

    useKeypress((key) => {
      if (key.name === "escape") {
        done(BACK);
      } else if (isEnterKey(key)) {
        setStatus("done");
        done(value);
      } else if (key.name === "y") {
        setValue(true);
      } else if (key.name === "n") {
        setValue(false);
      }
    });

    const message = styleText("bold", config.message);
    if (status === "done") {
      return `${prefix} ${message} ${styleText("cyan", value ? "Yes" : "No")}`;
    }

    return `${prefix} ${message} ${value ? styleText("cyan", "Yes") : "No"} (y/n, ESC to go back)`;
  }
);

// --- Exported Prompt Functions ---

export async function selectInputMode(): Promise<"direct" | "search" | "local" | typeof BACK> {
  return backableSelect({
    message: t("prompt.select_input_mode"),
    choices: [
      { name: t("choice.input_direct"), value: "direct" },
      { name: t("choice.input_search"), value: "search" },
      { name: t("choice.input_local"), value: "local" },
    ],
  });
}

export async function inputRepoId(): Promise<string | typeof BACK> {
  return backableInput({
    message: t("prompt.repo"),
    validate(value: string) {
      return value.trim().length > 0 ? true : t("prompt.repo.required");
    },
  });
}

export async function inputLocalPath(): Promise<string | typeof BACK> {
  return backableInput({
    message: t("prompt.local_path"),
    validate(value: string) {
      return value.trim().length > 0 ? true : t("prompt.local_path.required");
    },
  });
}

export async function searchRepoId(): Promise<string | typeof BACK> {
  return patchedSearch<string | typeof BACK>({
    message: t("prompt.search_query"),
    source: async (term: string | undefined, opt: any) => {
      if (!term || term.trim().length === 0) {
        return [];
      }
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(resolve, 300);
        opt.signal.addEventListener("abort", () => {
          clearTimeout(timeout);
          reject(new Error("aborted"));
        });
      });
      const models = await searchModels(term, 15);
      return models.map((model) => ({
        name: `${model.id} (⬇ ${model.downloads})`,
        value: model.id,
        description: `Likes: ${model.likes} | Downloads: ${model.downloads}`,
      }));
    },
  });
}

export async function inputSaveDir(defaultValue: string): Promise<string | typeof BACK> {
  return backableInput({
    message: t("prompt.save_dir"),
    default: defaultValue,
    validate(value: string) {
      return value.trim().length > 0 ? true : t("prompt.save_dir.required");
    },
  });
}

export async function inputOptionalParameter(label: string, defaultValue = ""): Promise<string | undefined | typeof BACK> {
  const value = await backableInput({
    message: t("prompt.param_input", { label }),
    default: defaultValue,
  });

  if (value === BACK) return BACK;
  const trimmed = (value as string).trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export { navigateAndSelectFile } from "./navigation.js";

export async function inputModelName(defaultValue: string): Promise<string | typeof BACK> {
  return backableInput({
    message: t("prompt.model_name"),
    default: defaultValue,
    validate(value: string) {
      return value.trim().length > 0 ? true : t("prompt.model_name.required");
    },
  });
}

export async function confirmOverwrite(pathLabel: string): Promise<boolean | typeof BACK> {
  return backableConfirm({
    message: t("prompt.overwrite", { pathLabel }),
    default: false,
  });
}

export async function confirmUseAdapter(): Promise<boolean | typeof BACK> {
  return backableConfirm({
    message: t("prompt.use_adapter"),
    default: false,
  });
}

export async function selectManifest(manifests: InstallManifest[]): Promise<InstallManifest | typeof BACK> {
  return backableSelect({
    message: t("prompt.select_manifest"),
    choices: manifests.map((manifest) => ({
      name: manifest.modelName,
      value: manifest,
      description: `${manifest.repoId} -> ${manifest.targetDir}`,
    })),
    pageSize: 15,
  });
}

export async function selectConfigAction(): Promise<"show" | "update" | "delete" | typeof BACK> {
  return backableSelect({
    message: t("prompt.select_action"),
    choices: [
      { name: t("choice.show"), value: "show" },
      { name: t("choice.update"), value: "update" },
      { name: t("choice.delete"), value: "delete" },
    ],
  });
}

export async function selectAdapterAction(currentAdapter?: string): Promise<"keep" | "remove" | "change" | typeof BACK> {
  const choices: any[] = [
    { name: t("choice.keep_adapter", { current: currentAdapter ?? "None" }), value: "keep" },
  ];
  if (currentAdapter) {
    choices.push({ name: t("choice.remove_adapter"), value: "remove" });
  }
  choices.push({ name: t("choice.change_adapter"), value: "change" });

  return backableSelect({
    message: t("prompt.adapter_action"),
    choices,
  });
}

export async function confirmDeleteLocalFiles(): Promise<boolean | typeof BACK> {
  return backableConfirm({
    message: t("prompt.delete_local"),
    default: false,
  });
}
