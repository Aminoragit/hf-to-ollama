<div align="center">
  <h1>🦙 hf-to-ollama</h1>
  <p><strong>轻松将 Hugging Face GGUF 文件安装到 Ollama 并进行管理的 CLI 工具 🚀</strong></p>

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

> `hf-to-ollama` 是一款省去繁杂配置，通过交互式(Interactive)选择引导，将 Hugging Face 上的 GGUF 格式文件下载并快速生成 Ollama 模型的实用工具。
>
> 此外，还可以便捷地对已安装模型进行参数调整或一键卸载（删除）。

<br />
<br />

## ✨ 核心功能 (Features)

<br />

- **📥 直观式下载安装 (Install)**  
  支持主 GGUF 及 ADAPTER 文件的勾选，各项生成参数的设置、自动下载及 Ollama 模型生成操作。
  <br />

- **⚙️ 简易化环境管理 (Config)**  
  提供了对已创建记录的 `Modelfile` 结构的预览、快速修改设定后的模型重建(Update)，以及支持对不需要的模型进行删除剔除操作。
  <br />

- **🤖 极速非交互模式自动部署 (Non-interactive)**  
  针对需要借助 Shell 脚本或是 CI/CD 进行自动配置的场景，支持免提示交互、直接于 CLI 指定命令行参数的功能。

<br />
<br />

---

<br />
<br />

## 📋 系统前置条件 (Prerequisites)

<br />

使用本工具前，须先准备并安装以下程序或权限:

- **[Node.js](https://nodejs.org/)** (版本要求 22 以上)
- **[Ollama](https://ollama.com/)** (必须已经预先安装并正在系统后台保持服务运行状态)
- *(可选)* **[Hugging Face Access Token](https://huggingface.co/settings/tokens)**  
  (在下载带有访问权限限制的私有仓库或限制申请类模型时必要，请配置至 `HF_TOKEN` 环境变量或利用 `--token` 选项声明)

<br />
<br />

---

<br />
<br />

## 📦 安装说明 (Installation)

<br />

**在本地环境开发**，或直接构建使用时：

```bash
npm install
npm run build
```

<br />

使用 NPM **全局(Global)安装** 以供任何路径下调用：

```bash
npm install -g hf-to-ollama
```

<br />
<br />

---

<br />
<br />

## 💻 使用指南 (Usage)

<br />

### 1️⃣ 交互式向导模式 (Interactive Install)

仅需在终端一次输入指令，便可依照屏幕抛出的表单清单，步步为营地顺畅完成安装。

```bash
hf-to-ollama install
```

**📌 安装流程如下:**
1. **选择输入方式**: 选择 `直接输入仓库路径` (例：`username/repo`) 或 `通过名称搜索模型`。
   - **(选择搜索时)**: 只需输入模型名称或关键字，工具将实时从 Hugging Face 服务器抓取并展示包含 GGUF 文件的热门模型。使用方向键在列表中轻松选择即可。
2. 在探测所得列表中，选择模型基础 **GGUF 主体文件**
3. 询问是否继续叠加挂载 ADAPTER (诸如 LoRA) 文件以及文件选择
4. 定制模型所需的预测生成参数 (如 `temperature`, `top_p`, `top_k`, `num_ctx` 等值)
5. 设定希望这些 GGUF 模型数据沉淀的 **本地存储硬盘目录**
6. 根据以上选项展开自动下载，完毕即会自行拼装 `Modelfile` 执行 `ollama create` 创建模型
   - ⚡ 智能下载机制：若本地已存在同等大小的GGUF文件，则直接跳过下载，进入模型创建阶段。

<br />
<br />

### 2️⃣ 集中参数及环境管控 (Configuration)

依赖本工具 `hf-to-ollama` ，可以把本地所留存的大型模型妥善管辖、即时刷新配置。

```bash
hf-to-ollama config
```

- 将所在系统里预存的全部 Ollama 局部模型作以呈现
- 查看单一模型的 `Modelfile` 实际配置条目构成 (**View**)
- **更换或卸载 ADAPTER**，修改任意指定的模型细节参数后对其施加 **重建 (Edit)**
- 彻底 **卸载 (Delete)** 那些冗余弃用或废弃的模型

<br />
<br />

### 3️⃣ 定制化运维脚本专属 (Non-interactive 安装)

通过一条附带了各项指代的连贯超长命令行，不用接受途中向导拦截干预即可落实任务，最符合运维流水线的自动剧本编写方式。

> 📢 **安全注意警示:** 针对特定 Hugging Face 源或是敏感业务模型，不要在公开剧本里让其实际名称与凭证彻底暴露（建议替换采用环境变量读取填入的办法去避免信息赤裸）。

```bash
hf-to-ollama install \
  --repo <指定HuggingFace目录路径> \
  --file <主基座_GGUF文件名.gguf> \
  --adapter <辅微调Adapter_GGUF文件名.gguf> \
  --parameter temperature=1.0 \
  --parameter top_p=0.95 \
  --parameter top_k=64 \
  --parameter num_ctx=32768 \
  --dir <预计储放该文件实体的本地路径> \
  --name <希望创建出Ollama内最终呈现的_模型名> \
  --non-interactive \
  --yes
```

*💡 倘属需请求验证权限模型的情形，请于整条命令行尾巴，将 `--token <所分配的访问Token>` 追加之上。*

<br />
<br />

---

<br />
<br />

## 📝 Modelfile 样例大纲构筑示范

承接前述全链工作，实际为系统底层 `ollama create` 跑动服务的骨干文件 `Modelfile` 生成格式样板结构大概形同如下:

```text
FROM ./your-model.gguf
ADAPTER ./your-adapter.gguf
PARAMETER temperature 1.0
PARAMETER top_p 0.95
PARAMETER top_k 64
PARAMETER num_ctx 32768
```

<br />
