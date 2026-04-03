<div align="center">
  <h1>🦙 ollama-hf-install</h1>
  <p><strong>Hugging Face GGUF 파일을 쉽고 빠르게 Ollama에 설치하고 관리하는 CLI 도구 🚀</strong></p>

  <br />

  <p>
    <a href="./README.md" title="한국어 (Korean)"><img src="https://flagicons.lipis.dev/flags/4x3/kr.svg" width="24" height="18" alt="KR" style="vertical-align: middle; border-radius: 2px;" /> <strong>Korean</strong></a>
    &nbsp;&nbsp;|&nbsp;&nbsp;
    <a href="./README_EN.md" title="English"><img src="https://flagicons.lipis.dev/flags/4x3/us.svg" width="24" height="18" alt="US" style="vertical-align: middle; border-radius: 2px;" /> <strong>English</strong></a>
    &nbsp;&nbsp;|&nbsp;&nbsp;
    <a href="./README_JA.md" title="日本語 (Japanese)"><img src="https://flagicons.lipis.dev/flags/4x3/jp.svg" width="24" height="18" alt="JP" style="vertical-align: middle; border-radius: 2px;" /> <strong>Japanese</strong></a>
    &nbsp;&nbsp;|&nbsp;&nbsp;
    <a href="./README_ZH.md" title="中文 (Chinese)"><img src="https://flagicons.lipis.dev/flags/4x3/cn.svg" width="24" height="18" alt="CN" style="vertical-align: middle; border-radius: 2px;" /> <strong>Chinese</strong></a>
  </p>
</div>

<br />

---

<br />

> `ollama-hf-install`은 복잡한 설정 과정 없이, 대화형(Interactive) 단계별 선택을 통해 Hugging Face의 GGUF 파일을 다운로드하고 Ollama 모델로 즉시 생성할 수 있도록 돕는 유틸리티입니다.  
> 또한, 이미 설치된 모델의 파라미터 설정을 수정하거나 불필요한 모델을 간편하게 삭제할 수도 있습니다.

<br />
<br />

## ✨ 주요 기능 (Features)

<br />

- **📥 직관적인 모델 설치 (Install)**  
  GGUF 본체 및 ADAPTER 파일 선택, 시스템 파라미터값 설정, 파일 다운로드 및 모델 생성까지 모두 지원합니다.
  <br />

- **⚙️ 간편한 환경 관리 (Config)**  
  생성된 모델의 `Modelfile` 구조를 확인하고, 자유로운 파라미터 수정 및 즉각적인 재생성이 가능합니다. 원클릭 모델 삭제 기능도 제공합니다.
  <br />

- **🤖 비대화식 쾌속 설치 (Non-interactive)**  
  셸(Shell) 스크립트 작성 및 지속적 자동화(CI/CD)를 위해 사용자 개입 없이 명령줄(CLI 파라미터)에 옵션을 직접 입력하는 모드를 지원합니다.

<br />
<br />

---

<br />
<br />

## 📋 시스템 전제 조건 (Prerequisites)

<br />

본 도구를 사용하기 전에 다음 프로그램 및 권한이 필요합니다:

- **[Node.js](https://nodejs.org/)** (버전 22 이상)
- **[Ollama](https://ollama.com/)** (시스템 사전 설치 및 로컬 서버 백그라운드 실행 필수)
- *(선택)* **[Hugging Face Access Token](https://huggingface.co/settings/tokens)**  
  (비공개 리포지토리나 구독형 모델 접근 시 필요하며, `HF_TOKEN` 환경변수 또는 `--token` 옵션으로 사용)

<br />
<br />

---

<br />
<br />

## 📦 패키지 설치 (Installation)

<br />

개발을 위해 **로컬 환경**에서 직접 빌드 및 실행할 경우:

```bash
npm install
npm run build
```

<br />

시스템의 **NPM 전역(Global) 환경**에 설치하여 어디서나 바로 사용할 경우:

```bash
npm install -g ollama-hf-install
```

<br />
<br />

---

<br />
<br />

## 💻 사용 가이드 (Usage)

<br />

### 1️⃣ 대화형 설치 모드 (Interactive Install)

명령어 실행 직후 터미널에 나타나는 안내와 선택지에 따라 단계적으로 쉽게 모델을 설치할 수 있습니다.

```bash
ollama-hf-install install
```

**📌 진행 과정:**
1. Hugging Face 레포지토리 경로 입력 (예: `username/repo`)
2. 목록에서 모델 기본 본체가 될 **GGUF 파일 선택**
3. ADAPTER (LoRA 등) 파일 추가 적용 여부 결정 및 파일 선택
4. 모델 구동을 위한 생성 파라미터(`temperature`, `top_p`, `top_k`, `num_ctx`) 입력
5. 모델 GGUF 파일이 저장될 **로컬 디렉토리 경로 지정**
6. 파일 다운로드 및 `Modelfile` 자동 생성 완료 후 `ollama create` 자동 실행

<br />
<br />

### 2️⃣ 설정 및 환경 관리 (Configuration)

`ollama-hf-install`을 통해 로컬에 저장된 모델들을 손쉽게 관리하고 세부 설정을 갱신합니다.

```bash
ollama-hf-install config
```

- 현재 시스템에 설치된 로컬 Ollama 모델 리스트 출력
- 각 모델의 `Modelfile` 내부 작동 구조 및 파라미터 열람
- 특정 파라미터 수정 후 해당 모델의 간편 **재생성 (Update)**
- 더 이상 사용하지 않는 설치 모델 **삭제 (Remove)**

<br />
<br />

### 3️⃣ 자동화 스크립트 특화 비대화형 설치 (Non-interactive)

단일 명령어로 필요한 모든 파라미터를 작성하여 사용자 프롬프트 개입 없이 곧바로 설치를 완료합니다. 자동화 파이프라인이나 셸 스크립트 작성 시 매우 유용합니다.

> 📢 **보안 주의:** 아래 예시와 같이 특정 Hugging Face 저장소와 모델명이 스크립트 코드에 그대로 평문으로 노출되지 않도록, 실행 환경에 맞게 변수로 전달하거나 플레이스홀더를 변경해 사용하시길 권장합니다.

```bash
ollama-hf-install install \
  --repo <해당_허깅페이스_경로> \
  --file <모델_GGUF파일명.gguf> \
  --adapter <어댑터_GGUF파일명.gguf> \
  --parameter temperature=1.0 \
  --parameter top_p=0.95 \
  --parameter top_k=64 \
  --parameter num_ctx=32768 \
  --dir <저장될_로컬_디렉토리_경로> \
  --name <생성할_Ollama_모델명> \
  --non-interactive \
  --yes
```

*💡 인증 토큰이 필요한 모델일 경우 명령어 맨 끝에 `--token <huggingface_access_token>` 옵션을 함께 포함시켜야 합니다.*

<br />
<br />

---

<br />
<br />

## 📝 자동 생성되는 Modelfile 구조 (예시)

위 과정을 거쳐 백그라운드 환경에서 `ollama create` 명령 시 참조되는 생성된 모델의 `Modelfile` 내부 구조는 다음과 같습니다:

```text
FROM ./your-model.gguf
ADAPTER ./your-adapter.gguf
PARAMETER temperature 1.0
PARAMETER top_p 0.95
PARAMETER top_k 64
PARAMETER num_ctx 32768
```

<br />
