# 🦙 ollama-hf-install

<div align="center">
  <p><strong>轻松将 Hugging Face GGUF 文件安装到 Ollama 并进行管理的 CLI 工具 🚀</strong></p>
  <p>
    <a href="README.md">한국어</a> |
    <a href="README_EN.md">English</a> |
    <a href="README_JA.md">日本語</a> |
    🌍 <a href="README_ZH.md">中文</a>
  </p>
</div>

---

<br>

> `ollama-hf-install` 是一款省去繁杂配置，通过交互式(Interactive)选择引导，将 Hugging Face 上的 GGUF 格式文件下载并快速生成 Ollama 模型的实用工具。
>
> 此外，还可以便捷地对已安装模型进行参数调整或一键卸载（删除）。

<br>

## ✨ 核心功能 (Features)

<br>

- **📥 直观式下载安装 (Install)**  
  支持主 GGUF 及 ADAPTER 文件的勾选，各项生成参数的设置、自动下载及 Ollama 模型生成操作。

- **⚙️ 简易化环境管理 (Config)**  
  提供了对已创建记录的 `Modelfile` 结构的预览、快速修改设定后的模型重建(Update)，以及支持对不需要的模型进行删除剔除操作。

- **🤖 极速非交互模式自动部署 (Non-interactive)**  
  针对需要借助 Shell 脚本或是 CI/CD 进行自动配置的场景，支持免提示交互、直接于 CLI 指定命令行参数的功能。

<br>

---

<br>

## 📋 系统前置条件 (Prerequisites)

<br>

使用本工具前，须先准备并安装以下程序或权限:

- **[Node.js](https://nodejs.org/)** (版本要求 22 以上)
- **[Ollama](https://ollama.com/)** (必须已经预先安装并正在系统后台保持服务运行状态)
- *(可选)* **[Hugging Face Access Token](https://huggingface.co/settings/tokens)** 
  (在下载带有访问权限限制的私有仓库或限制申请类模型时必要，请配置至 `HF_TOKEN` 环境变量或利用 `--token` 选项声明)

<br>

---

<br>

## 📦 安装说明 (Installation)

<br>

**在本地环境开发**，或直接构建使用时：

```bash
npm install
npm run build
```
<br>

使用 NPM **全局(Global)安装** 以供任何路径下调用：

```bash
npm install -g ollama-hf-install
```

<br>

---

<br>

## 💻 使用指南 (Usage)

<br>

### 1️⃣ 交互式向导模式 (Interactive Install)

仅需在终端一次输入指令，便可依照屏幕抛出的表单清单，步步为营地顺畅完成安装。

```bash
ollama-hf-install install
```

**安装流程如下:**
1. 解析并传入 Hugging Face 的项目仓库名 (例：`username/repo`)
2. 在探测所得列表中，选择模型基础 **GGUF 主体文件**
3. 询问是否继续叠加挂载 ADAPTER (诸如 LoRA) 文件以及文件选择
4. 定制模型所需的预测生成参数 (如 `temperature`, `top_p`, `top_k`, `num_ctx` 等值)
5. 设定希望这些 GGUF 模型数据沉淀的 **本地存储硬盘目录**
6. 根据以上选项展开自动下载，完毕即会自行拼装 `Modelfile` 执行 `ollama create` 创建模型

<br>

### 2️⃣ 集中参数及环境管控 (Configuration)

依赖本工具 `ollama-hf-install` ，可以把本地所留存的大型模型妥善管辖、即时刷新配置。

```bash
ollama-hf-install config
```

- 将所在系统里预存的全部 Ollama 局部模型作以呈现
- 查看单一模型的 `Modelfile` 实际配置条目构成
- 修改任意指定的模型细节参数后对其施加 **重建(Update)**
- 彻底 **卸载(Remove)** 掉那些冗余弃用或废弃的模型


<br>

### 3️⃣ 定制化运维脚本专属 (Non-interactive 安装)

通过一条附带了各项指代的连贯超长命令行，不用接受途中向导拦截干预即可落实任务，最符合运维流水线的自动剧本编写方式。

> 📢 **安全注意警示:** 针对特定 Hugging Face 源或是敏感业务模型，不要在公开剧本里让其实际名称与凭证彻底暴露（建议替换采用环境变量读取填入的办法去避免信息赤裸）。

```bash
ollama-hf-install install \
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

<br>

---

<br>

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

<br>
