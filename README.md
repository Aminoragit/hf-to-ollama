# 🦙 ollama-hf-install

<div align="center">
  <p><strong>Hugging Face GGUF 파일을 쉽고 빠르게 Ollama에 설치하고 관리하는 CLI 도구 🚀</strong></p>
</div>

---

`ollama-hf-install`은 복잡한 설정 없이 대화형 단계별 선택(Interactive mode)을 통해 Hugging Face의 GGUF 파일을 다운로드하고, Ollama 모델로 즉시 생성할 수 있도록 돕는 유틸리티입니다. 설치된 모델의 파라미터 설정 수정 및 삭제도 간편하게 지원합니다.

## ✨ 주요 기능 (Features)

- **📥 직관적인 설치 (Install):** GGUF 본체 및 ADAPTER 파일 선택, 파라미터값 설정, 자동 다운로드 및 모델 생성 지원
- **⚙️ 간편한 관리 (Config):** 생성된 Modelfile 확인, 파라미터 수정 후 즉각적인 재생성, 원클릭 모델 삭제 기능 제공
- **🤖 비대화식 쾌속 설치 (Non-interactive):** 셸(Shell) 스크립트 작성 및 자동화를 위해 한 줄 명령어(CLI 파라미터) 형태의 직접 입력 모드 지원

## 📋 시스템 전제 조건 (Prerequisites)

- **Node.js** 22 이상
- **Ollama** 시스템 사전 설치 및 서버 백그라운드 실행 중 필수
- *(선택)* 비공개/구독형 모델 접근이 요구될 경우 Hugging Face 계정 토큰(Token) 필요 (`HF_TOKEN` 환경변수 또는 `--token` 옵션 사용)

## 📦 패키지 설치 (Installation)

**로컬 환경에서 직접 빌드 후 실행 시:**
```bash
npm install
npm run build
```

**NPM 전역(Global) 환경에 설치하여 바로 사용 시:**
```bash
npm install -g ollama-hf-install
```

## 💻 사용 가이드 (Usage)

### 1️⃣ 대화형 설치 모드 (Interactive Install)
명령어 실행 직후 터미널에 나타나는 지시와 선택지에 따라 단계적으로 쉽게 모델을 설치할 수 있습니다.
```bash
ollama-hf-install install
```
**세부 진행 순서:**
1. Hugging Face 레포지토리 경로 입력 (예: `username/repo`)
2. 목록에서 모델 본체 GGUF 파일 선택
3. ADAPTER(LoRA 등) 파일 추가 적용 여부 확인 및 파일 선택
4. 생성 파라미터(`temperature`, `top_p`, `top_k`, `num_ctx`) 값 입력
5. 모델 GGUF가 저장될 로컬 저장 경로 입력
6. 파일 다운로드 및 `Modelfile` 자동 생성 완료 후 `ollama create` 자동 실행

### 2️⃣ 설정 및 환경 관리 (Configuration)
`ollama-hf-install`을 통해 설치된 모델들을 간편하게 관리하고 설정을 갱신합니다.
```bash
ollama-hf-install config
```
- 설치된 로컬 Ollama 모델 리스트 조회
- 개별 모델의 `Modelfile` 내부 구조 및 내용 확인
- 특정 파라미터 수정 후 해당 모델 간편 **재생성(Update)**
- 사용하지 않는 설치 모델 **삭제(Remove)**

### 3️⃣ 자동화 스크립트 특화 비대화형 자동 설치 (Non-interactive)
단일 명령어로 필요한 모든 파라미터를 선언하여 사용자 개입(프롬프트 질문) 없이 자동 설치를 완료합니다. 자동화된 파이프라인이나 스크립트 작성에 매우 유용합니다.

> 📢 **보안 주의:** 아래 예시와 같이 특정 Hugging Face 저장소와 모델명이 코드에 그대로 기입되어 노출되지 않도록, 사용 환경에 맞게 변수로 전달하거나 플레이스홀더를 변경해 사용하시길 권장합니다.

```bash
ollama-hf-install install \
  --repo <허깅페이스_경로> \
  --file <모델_GGUF파일명.gguf> \
  --adapter <어댑터_GGUF파일명.gguf> \
  --parameter temperature=1.0 \
  --parameter top_p=0.95 \
  --parameter top_k=64 \
  --parameter num_ctx=32768 \
  --dir <저장할_로컬_디렉토리_경로> \
  --name <생성할_Ollama_모델명> \
  --non-interactive \
  --yes
```
*💡 인증 토큰이 필요한 모델일 경우 명령어 마지막에 `--token <발급받은_토큰값>` 옵션을 함께 부여하세요.*

## 📝 자동 생성되는 Modelfile 예시
위 과정의 설정값들을 기반으로 내부에서 자동 생성되어 `ollama create`시 참조되는 `Modelfile`의 기본 골조는 다음과 같습니다:

```text
FROM ./your-model.gguf
ADAPTER ./your-adapter.gguf
PARAMETER temperature 1.0
PARAMETER top_p 0.95
PARAMETER top_k 64
PARAMETER num_ctx 32768
```
