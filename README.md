# ollama-hf-install

`ollama-hf-install`은 Hugging Face GGUF 파일을 단계적으로 선택해 Ollama 모델을 설치하고, 이후 설정을 수정하거나 삭제할 수 있는 npm CLI입니다.

## 명령 구조

- `ollama-hf-install install`
  - Hugging Face 경로 입력
  - GGUF 본체 선택
  - ADAPTER 선택 여부 확인 및 선택
  - `temperature`, `top_p`, `top_k`, `num_ctx` 입력
  - 저장 경로 입력
  - 다운로드 및 `ollama create` 진행
- `ollama-hf-install config`
  - 설치된 모델 선택
  - `Modelfile 보기`
  - `파라미터 수정 후 재생성`
  - `설치 모델 삭제`

## 전제 조건

- Node.js 22+
- Ollama 설치 및 서버 실행 중
- 필요한 경우 Hugging Face 토큰 보유

## 설치

로컬 개발:

```bash
npm install
npm run build
```

npm 배포본 설치:

```bash
npm install -g ollama-hf-install
```

## 사용 예시

단계형 설치:

```bash
ollama-hf-install install
```

설정 관리:

```bash
ollama-hf-install config
```

비대화식 설치도 일부 지원합니다.

```bash
ollama-hf-install install --repo HauhauCS/Gemma-4-E4B-Uncensored-HauhauCS-Aggressive --file Gemma-4-E4B-Uncensored-HauhauCS-Aggressive-Q4_K_M.gguf --adapter mmproj-Gemma-4-E4B-Uncensored-HauhauCS-Aggressive-f16.gguf --parameter temperature=1.0 --parameter top_p=0.95 --parameter top_k=64 --parameter num_ctx=32768 --dir C:\\Models\\Gemma4 --name gemma4-mmproj-test --non-interactive --yes
```

토큰이 필요하면 `--token` 옵션 또는 `HF_TOKEN` 환경 변수를 사용할 수 있습니다.

## install 동작 순서

1. Hugging Face 경로 입력
2. GGUF 선택창에서 본체 선택
3. ADAPTER 적용 여부 질문 및 선택
4. `temperature`, `top_p`, `top_k`, `num_ctx` 값 입력
5. 저장 경로 입력
6. 다운로드 진행률 표시
7. `Modelfile` 생성
8. `ollama create` 실행

## 생성되는 Modelfile 예시

```text
FROM ./your-model.gguf
ADAPTER ./your-adapter.gguf
PARAMETER temperature 1.0
PARAMETER top_p 0.95
PARAMETER top_k 64
PARAMETER num_ctx 32768
```
