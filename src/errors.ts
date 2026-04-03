export class CliError extends Error {
  constructor(message: string, readonly exitCode = 1) {
    // 보안: 에러 메시지가 출력될 때 사용자의 인증 토큰(HF Token)이 노출되지 않도록 마스킹 처리
    let safeMessage = message;
    if (typeof safeMessage === "string") {
      safeMessage = safeMessage.replace(/(hf_[a-zA-Z0-9]{3})[a-zA-Z0-9]+/g, "$1" + "*".repeat(15));
    }
    super(safeMessage);
    this.name = "CliError";

    if (this.stack) {
      this.stack = this.stack.replace(/(hf_[a-zA-Z0-9]{3})[a-zA-Z0-9]+/g, "$1" + "*".repeat(15));
    }
  }
}
