export interface CliOptions {
  file?: string;
  name?: string;
  dir?: string;
  token?: string;
  revision?: string;
  adapter?: string;
  parameter?: string[];
  nonInteractive?: boolean;
  yes?: boolean;
  dryRun?: boolean;
}

export interface HfFileEntry {
  path: string;
  size: number;
  revision?: string;
}

export interface DownloadTarget {
  repoId: string;
  file: HfFileEntry;
  revision?: string;
  accessToken?: string;
  targetDir: string;
}

export interface DownloadResult {
  filePath: string;
  bytesWritten: number;
  alreadyExists?: boolean;
}

export interface OllamaCreateInput {
  modelName: string;
  modelfilePath: string;
  cwd: string;
}

export interface ParameterEntry {
  key: string;
  value: string;
}

export interface ModelfileOptions {
  ggufFilename: string;
  adapterFilename?: string;
  parameters?: ParameterEntry[];
}

export interface InstallManifest {
  modelName: string;
  repoId: string;
  targetDir: string;
  ggufFilename: string;
  adapterFilename?: string;
  parameters: ParameterEntry[];
  createdAt: string;
}
export const BACK = Symbol("BACK");
