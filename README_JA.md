# 🦙 ollama-hf-install

<div align="center">
  <p><strong>Hugging FaceのGGUFファイルを簡単にOllamaにインストール・管理できるCLIツール 🚀</strong></p>
  <p>
    <a href="README.md">한국어</a> |
    <a href="README_EN.md">English</a> |
    🌍 <a href="README_JA.md">日本語</a> |
    <a href="README_ZH.md">中文</a>
  </p>
</div>

---

<br>

> `ollama-hf-install`は複雑なマニュアル設定を省略し、対話型(Interactive)ステップバイステップの選択によってHugging FaceのGGUFファイルをダウンロードし、即座にOllamaモデルとして構築できるユーティリティです。
>
> また、既にインストールされているモデルのパラメータ設定を修正したり、不要なモデルをワンクリックで削除(アンインストール)することも可能です。

<br>

## ✨ 主な機能 (Features)

<br>

- **📥 直感的なモデルインストール (Install)**  
  GGUF本体およびADAPTERファイルの選択、システムパラメータの設定、ファイルのダウンロード、モデル生成までサポートします。

- **⚙️ 簡単な環境管理 (Config)**  
  生成済モデルの`Modelfile`の構造を確認したり、パラメータを修正して即座に再生成(Update)することが可能です。モデルの直接削除もサポートしています。

- **🤖 非対話型の高速インストール (Non-interactive)**  
  シェルスクリプトや継続的インテグレーション(CI/CD)のために、ユーザーの入力を必要としないコマンドラインパラメータモードをサポートしています。

<br>

---

<br>

## 📋 必須システム要件 (Prerequisites)

<br>

本ツールを使用する前に、以下のプログラムが必要です:

- **[Node.js](https://nodejs.org/)** (バージョン22以上)
- **[Ollama](https://ollama.com/)** (システムに事前インストールし、バックグラウンドのサーバーとして起動していること)
- *(オプション)* **[Hugging Face Access Token](https://huggingface.co/settings/tokens)** 
  (非公開のプライベートリポジトリや、利用申請が必要なモデルにアクセスする際に必要です。`HF_TOKEN`環境変数か`--token`オプションを指定してください)

<br>

---

<br>

## 📦 パッケージのインストール (Installation)

<br>

開発のために**ローカル環境**でビルド及び実行する場合:

```bash
npm install
npm run build
```
<br>

NPMを介して**グローバル環境**にインストールし、どこからでもすぐ利用する場合:

```bash
npm install -g ollama-hf-install
```

<br>

---

<br>

## 💻 使い方 (Usage)

<br>

### 1️⃣ 対話型インストール (Interactive Install)

コマンドを実行した直後にターミナルに表示されるウィザードに従い、手軽にモデルをインストールします。

```bash
ollama-hf-install install
```

**進行手順:**
1. Hugging Faceリポジトリへのパスを入力 (例: `username/repo`)
2. リストからベースとなる **GGUFファイル** を選択
3. ADAPTER (LoRA等) の追加適用可否の決定および該当ファイルの選択
4. モデル駆動のための生成パラメータ(`temperature`, `top_p`, `top_k`, `num_ctx`) の入力
5. モデルのGGUFファイルを保存する **ローカル保存先ディレクトリ** の指定
6. ファイルのダウンロード完了後に`Modelfile`を自動生成し、自動で`ollama create`を実行

<br>

### 2️⃣ 設定と環境管理 (Configuration)

`ollama-hf-install`を通してローカル端末に保存されたモデルを手軽に管理し、設定を更新できます。

```bash
ollama-hf-install config
```

- 現在のシステムにインストール済みのローカルOllamaモデル一覧を表示
- 各モデルの `Modelfile` 内での動作構造とパラメータの閲覧
- 特定パラメータを修正後に該当モデルを **再生成 (Update)**
- もう使用しないモデルの **削除 (Remove)**

<br>

### 3️⃣ スクリプト向けの自動インストール (Non-interactive)

一つのコマンドに必要な引数をすべてセットし、プロンプトへの入力なしにインストールを完結させます。パイプラインなどの自動化スクリプトで非常に役立ちます。

> 📢 **セキュリティ上の注意:** 以下の例のように特定のリポジトリやモデル名をコード内にベタ書きにして公開しないように、環境変数などのプレースホルダーへ変更してご利用ください。

```bash
ollama-hf-install install \
  --repo <対象のhuggingfaceパス> \
  --file <モデル_GGUFファイル名.gguf> \
  --adapter <アダプター_GGUFファイル名.gguf> \
  --parameter temperature=1.0 \
  --parameter top_p=0.95 \
  --parameter top_k=64 \
  --parameter num_ctx=32768 \
  --dir <保存先ディレクトリ> \
  --name <生成される_Ollama_モデル名> \
  --non-interactive \
  --yes
```

*💡 認証用トークンが必要なモデルの場合は、合わせて `--token <huggingface_access_token>` をコマンドの末尾へ指定してください。*

<br>

---

<br>

## 📝 自動生成される Modelfile の例

上記のステップに基づく設定値を背景に、 `ollama create` 時に使用される `Modelfile` の基本構造は以下のようになります。

```text
FROM ./your-model.gguf
ADAPTER ./your-adapter.gguf
PARAMETER temperature 1.0
PARAMETER top_p 0.95
PARAMETER top_k 64
PARAMETER num_ctx 32768
```

<br>
