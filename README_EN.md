<div align="center">
  <h1>🦙 hf-to-ollama</h1>
  <p><strong>A CLI tool to easily install and manage Hugging Face GGUF files in Ollama 🚀</strong></p>

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

> `hf-to-ollama` is a utility tool that lets you seamlessly download Hugging Face GGUF files via an interactive step-by-step selection process, and immediately create them as Ollama models.
>
> It also offers easy management of your installed models, including parameter modification and deletion.

<br />
<br />

## ✨ Features

<br />

- **📥 Intuitive Installation (Install)**  
  Supports selecting GGUF and ADAPTER files, configuring parameters, auto-downloading, and creating models seamlessly.
  <br />

- **⚙️ Simple Management (Config)**  
  Provides features to inspect the generated `Modelfile`, quickly regenerate models with updated parameters, and delete installed models with a single click.
  <br />

- **🤖 Fast Non-interactive Mode**  
  Supports passing configuration via CLI parameters directly, allowing you to bypass prompts entirely. Ideal for shell scripts and automated (CI/CD) pipelines.

<br />
<br />

---

<br />
<br />

## 📋 Prerequisites

<br />

Before using this tool, make sure you have the following installed:

- **[Node.js](https://nodejs.org/)** (Version 22 or higher)
- **[Ollama](https://ollama.com/)** (Must be pre-installed and running as a background service)
- *(Optional)* **[Hugging Face Access Token](https://huggingface.co/settings/tokens)**  
  (Required for private or gated models. Supply it via the `HF_TOKEN` environment variable or `--token` option)

<br />
<br />

---

<br />
<br />

## 📦 Installation

<br />

To build and run in your **local environment**:

```bash
npm install
npm run build
```

<br />

To install **globally** via NPM:

```bash
npm install -g hf-to-ollama
```

<br />
<br />

---

<br />
<br />

## 💻 Usage Guide

<br />

### 1️⃣ Interactive Install

Execute the installation command and follow the terminal prompts to easily install your models step-by-step.

```bash
hf-to-ollama install
```

**📌 Process:**
1. Enter the Hugging Face repository path (e.g., `username/repo`)
2. Select the main **GGUF file** from the list
3. Confirm and select an ADAPTER (e.g., LoRA) file if needed
4. Set hardware generation parameters (`temperature`, `top_p`, `top_k`, `num_ctx`)
5. Specify your **local save directory**
6. Watch the download progress, followed by automatic `Modelfile` generation and `ollama create`
   - ⚡ **Smart Download**: Redundant downloads are instantly skipped if the exact GGUF file already exists locally.

<br />
<br />

### 2️⃣ Configuration

Manage your locally installed Ollama models via `hf-to-ollama config`.

```bash
hf-to-ollama config
```

- View the list of currently installed Ollama models
- Inspect the internal structure of each model's `Modelfile` (**View**)
- **Change or Remove ADAPTERs**, update generation parameters and seamlessly recreate the model (**Edit**)
- **Remove** unused models and wipe local data (**Delete**)

<br />
<br />

### 3️⃣ Non-interactive Install (for Scripts)

Declare all parameters in a single command, skipping any user prompts entirely. Very useful when creating automated pipelines.

> 📢 **Security Notice:** Do not expose sensitive or hardcoded repository details in public scripts. Use variables or placeholder names according to your environment.

```bash
hf-to-ollama install \
  --repo <hf_repo_path> \
  --file <model_gguf.gguf> \
  --adapter <adapter_gguf.gguf> \
  --parameter temperature=1.0 \
  --parameter top_p=0.95 \
  --parameter top_k=64 \
  --parameter num_ctx=32768 \
  --dir <local_save_directory> \
  --name <ollama_model_name_to_create> \
  --non-interactive \
  --yes
```

*💡 Append `--token <your_access_token>` to the command if you're trying to download gated models.*

<br />
<br />

---

<br />
<br />

## 📝 Generated Modelfile Example

Based on your settings, the background engine writes a `Modelfile` similar to the one below, which is then fed into `ollama create`:

```text
FROM ./your-model.gguf
ADAPTER ./your-adapter.gguf
PARAMETER temperature 1.0
PARAMETER top_p 0.95
PARAMETER top_k 64
PARAMETER num_ctx 32768
```

<br />
