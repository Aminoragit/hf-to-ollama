/**
 * 커스텀 검색 프롬프트 — @inquirer/search의 화살표 키 버그 수정 버전
 *
 * 원본 문제: 방향키를 누르면 rl.clearLine(0)이 호출되어 입력 줄이 초기화됨.
 * 이후 타이핑 시 rl.line이 빈 상태에서 시작되어 기존 입력이 유실됨.
 *
 * 수정 내용: savedSearchTerm 변수에 방향키 진입 전의 검색어를 보관하고,
 *           사용자가 다시 타이핑하면 savedSearchTerm + 새 입력을 합쳐서 복원.
 */
import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  usePagination,
  useEffect,
  useMemo,
  useRef,
  isDownKey,
  isEnterKey,
  isTabKey,
  isUpKey,
  Separator,
  makeTheme,
} from "@inquirer/core";
import { styleText } from "node:util";
import figures from "@inquirer/figures";

import type { Theme } from "@inquirer/core";
import type { PartialDeep } from "@inquirer/type";

type SearchTheme = {
  icon: { cursor: string };
  style: {
    disabled: (text: string) => string;
    searchTerm: (text: string) => string;
    description: (text: string) => string;
    keysHelpTip: (keys: [key: string, action: string][]) => string | undefined;
  };
};

type Choice<Value> = {
  value: Value;
  name?: string;
  description?: string;
  short?: string;
  disabled?: boolean | string;
  type?: never;
};

type SearchConfig<Value> = {
  message: string;
  source: (
    term: string | undefined,
    opt: { signal: AbortSignal },
  ) =>
    | readonly (string | Separator)[]
    | readonly (Separator | Choice<Value>)[]
    | Promise<readonly (string | Separator)[]>
    | Promise<readonly (Separator | Choice<Value>)[]>;
  validate?: (value: Value) => boolean | string | Promise<string | boolean>;
  pageSize?: number;
  default?: Value;
  theme?: PartialDeep<Theme<SearchTheme>>;
};

const searchTheme: SearchTheme = {
  icon: { cursor: figures.pointer },
  style: {
    disabled: (text: string) => styleText("dim", `- ${text}`),
    searchTerm: (text: string) => styleText("cyan", text),
    description: (text: string) => styleText("cyan", text),
    keysHelpTip: (keys: [string, string][]) =>
      keys
        .map(([key, action]) => `${styleText("bold", key)} ${styleText("dim", action)}`)
        .join(styleText("dim", " • ")),
  },
};

function isSelectable(item: any): boolean {
  return !Separator.isSeparator(item) && !item.disabled;
}

function normalizeChoices(choices: readonly any[]): any[] {
  return choices.map((choice) => {
    if (Separator.isSeparator(choice)) return choice;
    if (typeof choice === "string") {
      return { value: choice, name: choice, short: choice, disabled: false };
    }
    const name = choice.name ?? String(choice.value);
    const normalizedChoice: any = {
      value: choice.value,
      name,
      short: choice.short ?? name,
      disabled: choice.disabled ?? false,
    };
    if (choice.description) {
      normalizedChoice.description = choice.description;
    }
    return normalizedChoice;
  });
}

const patchedSearch = createPrompt(<Value,>(config: SearchConfig<Value>, done: (value: Value) => void) => {
  const { pageSize = 7, validate = () => true } = config;
  const theme = makeTheme(searchTheme, config.theme);
  const [status, setStatus] = useState<string>("loading");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchError, setSearchError] = useState<string | undefined>();
  const defaultApplied = useRef(false);

  // ★ 핵심 수정: 화살표 키 진입 전 검색어를 보관하는 Ref
  const savedSearchTerm = useRef<string>("");
  const isNavigating = useRef(false);

  const prefix = usePrefix({ status, theme });
  const bounds = useMemo(() => {
    const first = searchResults.findIndex(isSelectable);
    const last = searchResults.findLastIndex(isSelectable);
    return { first, last };
  }, [searchResults]);
  const [active = bounds.first, setActive] = useState<number | undefined>();

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setSearchError(undefined);
    const fetchResults = async () => {
      try {
        const results = await config.source(searchTerm || undefined, {
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          const normalized = normalizeChoices(results);
          let initialActive: number | undefined;
          if (!defaultApplied.current && "default" in config) {
            const defaultIndex = normalized.findIndex(
              (item: any) => isSelectable(item) && item.value === config.default,
            );
            initialActive = defaultIndex === -1 ? undefined : defaultIndex;
            defaultApplied.current = true;
          }
          setActive(initialActive);
          setSearchError(undefined);
          setSearchResults(normalized);
          setStatus("idle");
        }
      } catch (error) {
        if (!controller.signal.aborted && error instanceof Error) {
          setSearchError(error.message);
        }
      }
    };
    void fetchResults();
    return () => {
      controller.abort();
    };
  }, [searchTerm]);

  const selectedChoice = searchResults[active!] as any;

  useKeypress(async (key: any, rl: any) => {
    if (isEnterKey(key)) {
      isNavigating.current = false;
      if (selectedChoice) {
        setStatus("loading");
        const isValid = await validate(selectedChoice.value);
        setStatus("idle");
        if (isValid === true) {
          setStatus("done");
          done(selectedChoice.value);
        } else if (selectedChoice.name === searchTerm) {
          setSearchError(typeof isValid === "string" ? isValid : "You must provide a valid value");
        } else {
          rl.write(selectedChoice.name);
          setSearchTerm(selectedChoice.name);
        }
      } else {
        rl.write(searchTerm);
      }
    } else if (isTabKey(key) && selectedChoice) {
      isNavigating.current = false;
      rl.clearLine(0);
      rl.write(selectedChoice.name);
      setSearchTerm(selectedChoice.name);
    } else if (status !== "loading" && (isUpKey(key) || isDownKey(key))) {
      // ★ 수정: 처음 화살표를 누르는 순간 현재 검색어를 저장
      if (!isNavigating.current) {
        savedSearchTerm.current = searchTerm;
        isNavigating.current = true;
      }
      rl.clearLine(0);
      if (
        (isUpKey(key) && active !== bounds.first) ||
        (isDownKey(key) && active !== bounds.last)
      ) {
        const offset = isUpKey(key) ? -1 : 1;
        let next = active!;
        do {
          next = (next + offset + searchResults.length) % searchResults.length;
        } while (!isSelectable(searchResults[next]));
        setActive(next);
      }
    } else {
      // ★ 수정: 방향키 탐색 후 다시 타이핑하면 저장된 검색어 + 새 입력을 복원
      if (isNavigating.current) {
        isNavigating.current = false;
        const restored = savedSearchTerm.current + rl.line;
        rl.clearLine(0);
        rl.write(restored);
        setSearchTerm(restored);
      } else {
        setSearchTerm(rl.line);
      }
    }
  });

  const message = theme.style.message(config.message, status);
  const helpLine = (theme.style as any).keysHelpTip([
    ["↑↓", "navigate"],
    ["⏎", "select"],
  ]);

  const page = usePagination({
    items: searchResults,
    active: active!,
    renderItem({ item, isActive }: { item: any; isActive: boolean }) {
      if (Separator.isSeparator(item)) {
        return ` ${item.separator}`;
      }
      if (item.disabled) {
        const disabledLabel = typeof item.disabled === "string" ? item.disabled : "(disabled)";
        return (theme.style as any).disabled(`${item.name} ${disabledLabel}`);
      }
      const color = isActive ? theme.style.highlight : (x: string) => x;
      const cursor = isActive ? theme.icon.cursor : " ";
      return color(`${cursor} ${item.name}`);
    },
    pageSize,
    loop: false,
  });

  let error;
  if (searchError) {
    error = theme.style.error(searchError);
  } else if (searchResults.length === 0 && searchTerm !== "" && status === "idle") {
    error = theme.style.error("No results found");
  }

  let searchStr;
  if (status === "done" && selectedChoice) {
    return [prefix, message, theme.style.answer(selectedChoice.short)]
      .filter(Boolean)
      .join(" ")
      .trimEnd();
  } else {
    searchStr = (theme.style as any).searchTerm(searchTerm);
  }

  const description = selectedChoice?.description;
  const header = [prefix, message, searchStr].filter(Boolean).join(" ").trimEnd();
  const body = [
    error ?? page,
    " ",
    description ? (theme.style as any).description(description) : "",
    helpLine,
  ]
    .filter(Boolean)
    .join("\n")
    .trimEnd();

  return [header, body];
});

export default patchedSearch;
export { Separator } from "@inquirer/core";
