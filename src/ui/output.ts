const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";

export function info(message: string): void {
  console.log(`${CYAN}info${RESET} ${message}`);
}

export function success(message: string): void {
  console.log(`${GREEN}success${RESET} ${message}`);
}

export function warn(message: string): void {
  console.warn(`${YELLOW}warn${RESET} ${message}`);
}

export function error(message: string): void {
  console.error(`${RED}error${RESET} ${message}`);
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "unknown";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function formatSpeed(bytesPerSecond: number): string {
  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) {
    return "0 B/s";
  }

  return `${formatBytes(bytesPerSecond)}/s`;
}

export function renderProgressBar(receivedBytes: number, totalBytes?: number, width = 28): string {
  if (!totalBytes || totalBytes <= 0) {
    const pulseWidth = Math.max(1, Math.floor(width / 4));
    const offset = Math.max(0, receivedBytes % Math.max(1, width - pulseWidth + 1));
    const bar = `${" ".repeat(offset)}${"=".repeat(pulseWidth)}`.padEnd(width, " ");
    return `[${bar}]`;
  }

  const ratio = Math.min(1, receivedBytes / totalBytes);
  const filled = Math.round(ratio * width);
  return `[${"=".repeat(filled)}${" ".repeat(width - filled)}]`;
}
