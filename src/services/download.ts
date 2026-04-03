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

  // 보안: 경로 탐색(Path Traversal) 방지 — targetDir 바깥으로 쓰기 차단
  const resolvedOutput = path.resolve(outputPath);
  const resolvedTarget = path.resolve(target.targetDir);
  if (!resolvedOutput.startsWith(resolvedTarget + path.sep) && resolvedOutput !== resolvedTarget) {
    throw new CliError(`보안 오류: 파일 경로가 저장 디렉터리 범위를 벗어납니다: ${filename}`);
  }

  const partialPath = `${outputPath}.part`;

  const { url, size } = await getDownloadUrl(target.repoId, target.file.path, target.revision, target.accessToken);

  try {
    const existingStat = await stat(outputPath);
    if (size > 0 && existingStat.size === size) {
      return {
        filePath: outputPath,
        bytesWritten: size,
        alreadyExists: true,
      };
    }
  } catch {
    // ignore
  }

  const response = await fetch(url, {
    headers: authHeaders(target.accessToken),
    redirect: "follow",
  });

  if (!response.ok || !response.body) {
    throw new CliError(`GGUF 다운로드 실패: HTTP ${response.status}`);
  }

  const totalBytes = size || Number(response.headers.get("content-length")) || 0;
  const startedAt = Date.now();

  // 이전 다운로드 실패로 남아있을 수 있는 .part 파일을 먼저 정리
  await rm(partialPath, { force: true });

  // 보안: 다중 사용자 환경에서 임시 파일을 바꿔치기하는 TOCTOU 공격 방어를 위해 권한을 0o600(-rw-------)으로 못 박음
  const writer = createWriteStream(partialPath, { mode: 0o600 });
  const reader = response.body.getReader();
  let receivedBytes = 0;
  let lastDrawnAt = 0;

  // Magic Byte Check Variables
  let magicChecked = false;
  let magicBuffer: Buffer | null = null;
  const MAX_DOWNLOAD_SIZE = 150 * 1024 * 1024 * 1024; // 150GB 최대 용량 제한 퓨즈

  try {

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      receivedBytes += value.byteLength;

      // 보안: 악의적인 파일 폭탄(Disk Exhaustion / Zip Bomb) 차단 (150GB 퓨즈)
      if (receivedBytes > MAX_DOWNLOAD_SIZE) {
        throw new CliError("보안 오류: 지정된 다운로드 최대 용량(150GB)을 초과하는 특대형 파일이 감지되어 시스템 보호를 위해 스트림을 차단합니다.");
      }

      // 보안: 확장자 위장 방지 GGUF Magic Header 시그니처 (첫 4바이트) 검증
      if (!magicChecked) {
        magicBuffer = magicBuffer ? Buffer.concat([magicBuffer, Buffer.from(value)]) : Buffer.from(value);
        if (magicBuffer.length >= 4) {
          const magicStr = magicBuffer.toString("utf8", 0, 4);
          if (magicStr !== "GGUF") {
            throw new CliError(`보안 오류: 이 파일은 GGUF 모델 구조가 아닌 위장 파일로 의심됩니다. (시그니처 불일치: ${magicStr})`);
          }
          magicChecked = true;
          magicBuffer = null; // 메모리 해제
        }
      }

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
