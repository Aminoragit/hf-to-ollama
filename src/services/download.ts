import { once } from "node:events";
import { createWriteStream } from "node:fs";
import { mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";

import type { DownloadResult, DownloadTarget } from "../types.js";
import { getDownloadUrl } from "../adapters/hf.js";
import { CliError } from "../errors.js";
import { formatBytes, formatSpeed, renderProgressBar } from "../ui/output.js";

function authHeaders(accessToken?: string): HeadersInit | undefined {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
}

function drawProgress(receivedBytes: number, totalBytes: number, startedAt: number, forceNewline = false): void {
  const elapsedSeconds = Math.max((Date.now() - startedAt) / 1000, 0.001);
  const percent = totalBytes > 0 ? `${((receivedBytes / totalBytes) * 100).toFixed(1)}%` : "--.-%";
  const line = `${renderProgressBar(receivedBytes, totalBytes)} ${percent} ${formatBytes(receivedBytes)} / ${formatBytes(totalBytes)} ${formatSpeed(receivedBytes / elapsedSeconds)}`;

  if (process.stderr.isTTY) {
    readline.cursorTo(process.stderr, 0);
    readline.clearLine(process.stderr, 0);
    process.stderr.write(forceNewline ? `${line}\n` : line);
    return;
  }

  if (forceNewline) {
    process.stderr.write(`${line}\n`);
  }
}

export async function downloadGgufFile(target: DownloadTarget): Promise<DownloadResult> {
  await mkdir(target.targetDir, { recursive: true });

  const filename = path.basename(target.file.path);
  const outputPath = path.join(target.targetDir, filename);
  const partialPath = `${outputPath}.part`;

  const { url, size } = await getDownloadUrl(target.repoId, target.file.path, target.revision, target.accessToken);
  const response = await fetch(url, {
    headers: authHeaders(target.accessToken),
    redirect: "follow",
  });

  if (!response.ok || !response.body) {
    throw new CliError(`GGUF 다운로드 실패: HTTP ${response.status}`);
  }

  const totalBytes = size || Number(response.headers.get("content-length")) || 0;
  const startedAt = Date.now();
  const writer = createWriteStream(partialPath);
  const reader = response.body.getReader();
  let receivedBytes = 0;
  let lastDrawnAt = 0;

  try {
    await rm(partialPath, { force: true });

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      receivedBytes += value.byteLength;
      if (!writer.write(Buffer.from(value))) {
        await once(writer, "drain");
      }

      const now = Date.now();
      if (now - lastDrawnAt >= 120) {
        drawProgress(receivedBytes, totalBytes, startedAt);
        lastDrawnAt = now;
      }
    }

    writer.end();
    await once(writer, "finish");
    drawProgress(receivedBytes, totalBytes, startedAt, true);
    await rename(partialPath, outputPath);
  } catch (error) {
    writer.destroy();
    await rm(partialPath, { force: true });

    if (error instanceof Error) {
      throw new CliError(`GGUF 저장 실패: ${error.message}`);
    }

    throw new CliError("GGUF 저장 중 알 수 없는 오류가 발생했습니다.");
  }

  const fileStat = await stat(outputPath);
  return {
    filePath: outputPath,
    bytesWritten: fileStat.size,
  };
}
