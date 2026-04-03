type Locale = "ko" | "en" | "ja" | "zh" | "hi" | "fr" | "ru" | "es" | "de" | "pt" | "ar" | "id";

type MessageParams = Record<string, string | number>;
type MessageValue = string | ((params: MessageParams) => string);
type MessageMap = Record<string, MessageValue>;

const ko: MessageMap = {
  "app.description": "Hugging Face GGUF 파일을 선택해 Ollama 모델을 단계적으로 설치/관리합니다.",
  "cmd.install.description": "단계형 입력으로 Hugging Face GGUF 모델을 설치합니다.",
  "cmd.config.description": "설치된 모델의 Modelfile 확인, 파라미터 수정, 삭제를 수행합니다.",
  "opt.repo": "Hugging Face 모델 경로",
  "opt.file": "다운로드할 본체 GGUF 파일 경로",
  "opt.adapter": "함께 적용할 ADAPTER GGUF 파일 경로",
  "opt.parameter": "Modelfile에 추가할 PARAMETER 항목",
  "opt.name": "생성할 Ollama 모델 이름",
  "opt.dir": "GGUF 및 Modelfile 저장 디렉터리",
  "opt.token": "Hugging Face access token",
  "opt.revision": "가져올 revision, branch, tag, commit",
  "opt.non_interactive": "대화형 입력 없이 실행",
  "opt.yes": "기존 파일이 있어도 자동 덮어쓰기",
  "opt.dry_run": "실제 다운로드와 ollama create 없이 계획만 출력",
  "error.unknown": "알 수 없는 오류가 발생했습니다.",
  "prompt.repo": "Hugging Face 경로를 입력하세요.",
  "prompt.repo.required": "Hugging Face 경로를 입력해야 합니다.",
  "prompt.save_dir": "모델 저장 경로를 입력하세요.",
  "prompt.save_dir.required": "저장 경로는 비워둘 수 없습니다.",
  "prompt.param_input": (params) => `${params.label} 값을 입력하세요. 비워두면 건너뜁니다.`,
  "prompt.model_file": "가져올 본체 GGUF 파일을 선택하세요.",
  "prompt.model_name": "Ollama 모델 이름을 입력하세요.",
  "prompt.model_name.required": "모델 이름은 비워둘 수 없습니다.",
  "prompt.overwrite": (params) => `${params.pathLabel} 가 이미 존재합니다. 덮어쓰시겠습니까?`,
  "prompt.use_adapter": "추가 ADAPTER GGUF를 함께 적용하시겠습니까?",
  "prompt.select_manifest": "설정할 설치 모델을 선택하세요.",
  "prompt.select_action": "실행할 작업을 선택하세요.",
  "prompt.delete_local": "로컬 GGUF/Modelfile 저장 디렉터리도 함께 삭제하시겠습니까?",
  "choice.show": "Modelfile 보기",
  "choice.update": "파라미터 수정 후 재생성",
  "choice.delete": "설치 모델 삭제",
  "info.found_gguf": (params) => `GGUF 파일 ${params.count}개를 찾았습니다.`,
  "info.adapter_candidates": (params) => `ADAPTER 후보 ${params.count}개를 찾았습니다.`,
  "info.selected_model": (params) => `선택된 본체 파일: ${params.path} (${params.size})`,
  "info.selected_adapter": (params) => `선택된 ADAPTER 파일: ${params.path} (${params.size})`,
  "info.parameters_applied": (params) => `사용자 PARAMETER ${params.count}개를 적용합니다.`,
  "info.parameter_line": (params) => `PARAMETER ${params.key} ${params.value}`,
  "info.target_dir": (params) => `저장 경로: ${params.path}`,
  "info.ollama_command": (params) => `Ollama 실행 파일: ${params.cmd}`,
  "info.download_model_start": "선택한 본체 GGUF 다운로드를 시작합니다. 아래 진행률 바를 확인하세요.",
  "info.download_adapter_start": "선택한 ADAPTER GGUF 다운로드를 시작합니다. 아래 진행률 바를 확인하세요.",
  "info.modelfile_created": (params) => `Modelfile 생성: ${params.path}`,
  "info.model_create_start": "Ollama 모델 생성을 시작합니다.",
  "info.run_command": (params) => `실행 명령: ollama run ${params.model}`,
  "info.model_label": (params) => `모델: ${params.model}`,
  "success.dry_run": (params) => `dry-run: ${params.file}${params.extra} -> ${params.out}, model=${params.model}`,
  "success.download_complete": (params) => `다운로드 완료: ${params.path} (${params.size})`,
  "success.adapter_download_complete": (params) => `ADAPTER 다운로드 완료: ${params.path} (${params.size})`,
  "success.model_created": (params) => `Ollama 모델 생성 완료: ${params.model}`,
  "success.model_deleted": (params) => `Ollama 모델 삭제 완료: ${params.model}`,
  "success.dir_deleted": (params) => `로컬 저장 디렉터리 삭제 완료: ${params.path}`,
  "success.model_recreated": (params) => `파라미터 수정 및 Ollama 모델 재생성 완료: ${params.model}`,
  "warn.file_check_failed": "다운로드된 파일 검증 중 크기 확인에 실패했습니다. 그대로 진행합니다.",
  "err.parameter_format": (params) => `잘못된 --parameter 형식입니다: ${params.entry}. key=value 형식을 사용하세요.`,
  "err.parameter_key_space": (params) => `PARAMETER 키에는 공백을 넣을 수 없습니다: ${params.key}`,
  "err.path_conflict": (params) => `이미 존재하는 파일 또는 디렉터리 때문에 진행할 수 없습니다: ${params.path}`,
  "err.overwrite_cancelled": "사용자가 덮어쓰기를 취소했습니다.",
  "err.no_gguf": "선택한 Hugging Face 리포지토리에 GGUF 파일이 없습니다.",
  "err.file_not_found": (params) => `지정한 ${params.label} 파일을 찾을 수 없습니다: ${params.path}`,
  "err.non_interactive_file": "비대화식 모드에서는 `--file` 옵션이 필요합니다.",
  "err.same_adapter": "ADAPTER 파일은 본체 GGUF와 같을 수 없습니다.",
  "err.zero_size": "다운로드된 GGUF 파일 크기가 0입니다.",
  "err.no_manifests": "설정 가능한 설치 이력이 없습니다. 먼저 install 명령으로 모델을 설치하세요.",
  "err.ollama_missing": "`ollama` 실행 파일을 찾을 수 없습니다. PATH 또는 기본 설치 경로를 확인하세요.",
  "err.ollama_server": "Ollama 서버에 연결할 수 없습니다. `ollama serve` 또는 Ollama 앱이 실행 중인지 확인하세요.",
  "err.ollama_create": (params) => `ollama create 실패: ${params.message}`,
  "err.ollama_create_unknown": "ollama create 실행 중 알 수 없는 오류가 발생했습니다.",
  "err.ollama_rm": (params) => `ollama rm 실패: ${params.message}`,
  "err.ollama_rm_unknown": "ollama rm 실행 중 알 수 없는 오류가 발생했습니다."
};

const en: MessageMap = {
  "app.description": "Step-by-step installation and management of Ollama models from Hugging Face GGUF files.",
  "cmd.install.description": "Install a Hugging Face GGUF model with guided prompts.",
  "cmd.config.description": "View Modelfile, update parameters, or delete installed models.",
  "opt.repo": "Hugging Face model path",
  "opt.file": "Path of the main GGUF file to download",
  "opt.adapter": "Path of the ADAPTER GGUF file to apply",
  "opt.parameter": "PARAMETER entry to add to the Modelfile",
  "opt.name": "Ollama model name to create",
  "opt.dir": "Directory to store GGUF and Modelfile",
  "opt.token": "Hugging Face access token",
  "opt.revision": "Revision, branch, tag, or commit to use",
  "opt.non_interactive": "Run without interactive prompts",
  "opt.yes": "Overwrite existing files automatically",
  "opt.dry_run": "Show the plan without downloading or running ollama create",
  "error.unknown": "An unknown error occurred.",
  "prompt.repo": "Enter the Hugging Face path.",
  "prompt.repo.required": "You must enter a Hugging Face path.",
  "prompt.save_dir": "Enter the model save directory.",
  "prompt.save_dir.required": "The save directory cannot be empty.",
  "prompt.param_input": (params) => `Enter ${params.label}. Leave blank to skip.`,
  "prompt.model_file": "Select the main GGUF file to import.",
  "prompt.model_name": "Enter the Ollama model name.",
  "prompt.model_name.required": "The model name cannot be empty.",
  "prompt.overwrite": (params) => `${params.pathLabel} already exists. Overwrite it?`,
  "prompt.use_adapter": "Would you like to apply an additional ADAPTER GGUF?",
  "prompt.select_manifest": "Select an installed model to configure.",
  "prompt.select_action": "Choose an action.",
  "prompt.delete_local": "Also delete the local GGUF/Modelfile directory?",
  "choice.show": "Show Modelfile",
  "choice.update": "Update parameters and recreate",
  "choice.delete": "Delete installed model",
  "info.found_gguf": (params) => `Found ${params.count} GGUF files.`,
  "info.adapter_candidates": (params) => `Found ${params.count} ADAPTER candidates.`,
  "info.selected_model": (params) => `Selected main file: ${params.path} (${params.size})`,
  "info.selected_adapter": (params) => `Selected ADAPTER file: ${params.path} (${params.size})`,
  "info.parameters_applied": (params) => `Applying ${params.count} user parameters.`,
  "info.parameter_line": (params) => `PARAMETER ${params.key} ${params.value}`,
  "info.target_dir": (params) => `Target directory: ${params.path}`,
  "info.ollama_command": (params) => `Ollama executable: ${params.cmd}`,
  "info.download_model_start": "Starting main GGUF download. Watch the progress bar below.",
  "info.download_adapter_start": "Starting ADAPTER GGUF download. Watch the progress bar below.",
  "info.modelfile_created": (params) => `Modelfile created: ${params.path}`,
  "info.model_create_start": "Starting Ollama model creation.",
  "info.run_command": (params) => `Run command: ollama run ${params.model}`,
  "info.model_label": (params) => `Model: ${params.model}`,
  "success.dry_run": (params) => `dry-run: ${params.file}${params.extra} -> ${params.out}, model=${params.model}`,
  "success.download_complete": (params) => `Download complete: ${params.path} (${params.size})`,
  "success.adapter_download_complete": (params) => `ADAPTER download complete: ${params.path} (${params.size})`,
  "success.model_created": (params) => `Ollama model created: ${params.model}`,
  "success.model_deleted": (params) => `Ollama model deleted: ${params.model}`,
  "success.dir_deleted": (params) => `Local directory deleted: ${params.path}`,
  "success.model_recreated": (params) => `Parameters updated and Ollama model recreated: ${params.model}`,
  "warn.file_check_failed": "Failed to verify the downloaded file size. Continuing anyway.",
  "err.parameter_format": (params) => `Invalid --parameter format: ${params.entry}. Use key=value.`,
  "err.parameter_key_space": (params) => `PARAMETER keys cannot contain spaces: ${params.key}`,
  "err.path_conflict": (params) => `Cannot continue because a file or directory already exists: ${params.path}`,
  "err.overwrite_cancelled": "Overwrite was cancelled by the user.",
  "err.no_gguf": "No GGUF files were found in the selected Hugging Face repository.",
  "err.file_not_found": (params) => `Could not find the specified ${params.label} file: ${params.path}`,
  "err.non_interactive_file": "`--file` is required in non-interactive mode.",
  "err.same_adapter": "The ADAPTER file cannot be the same as the main GGUF file.",
  "err.zero_size": "The downloaded GGUF file size is 0.",
  "err.no_manifests": "No installed model records were found. Run install first.",
  "err.ollama_missing": "Could not find the `ollama` executable. Check PATH or the default install location.",
  "err.ollama_server": "Could not connect to the Ollama server. Make sure `ollama serve` or the Ollama app is running.",
  "err.ollama_create": (params) => `ollama create failed: ${params.message}`,
  "err.ollama_create_unknown": "An unknown error occurred while running ollama create.",
  "err.ollama_rm": (params) => `ollama rm failed: ${params.message}`,
  "err.ollama_rm_unknown": "An unknown error occurred while running ollama rm."
};

const ja: MessageMap = {
  ...en,
  "app.description": "Hugging Face の GGUF ファイルから Ollama モデルを段階的にインストール・管理します。",
  "cmd.install.description": "対話形式で Hugging Face GGUF モデルをインストールします。",
  "cmd.config.description": "Modelfile の表示、パラメータ更新、インストール済みモデルの削除を行います。",
  "opt.repo": "Hugging Face モデルパス",
  "opt.file": "ダウンロードするメイン GGUF ファイルのパス",
  "opt.adapter": "適用する ADAPTER GGUF ファイルのパス",
  "opt.parameter": "Modelfile に追加する PARAMETER 項目",
  "opt.name": "作成する Ollama モデル名",
  "opt.dir": "GGUF と Modelfile を保存するディレクトリ",
  "opt.non_interactive": "対話プロンプトなしで実行",
  "opt.yes": "既存ファイルを自動上書き",
  "opt.dry_run": "ダウンロードや ollama create を実行せず計画のみ表示",
  "prompt.repo": "Hugging Face パスを入力してください。",
  "prompt.save_dir": "モデル保存ディレクトリを入力してください。",
  "prompt.model_file": "インポートするメイン GGUF ファイルを選択してください。",
  "prompt.model_name": "Ollama モデル名を入力してください。",
  "prompt.use_adapter": "追加の ADAPTER GGUF を適用しますか？",
  "prompt.select_manifest": "設定するインストール済みモデルを選択してください。",
  "prompt.select_action": "実行する操作を選択してください。",
  "prompt.delete_local": "ローカルの GGUF/Modelfile ディレクトリも削除しますか？",
  "choice.show": "Modelfile を表示",
  "choice.update": "パラメータを更新して再作成",
  "choice.delete": "インストール済みモデルを削除",
  "info.found_gguf": (p) => `GGUF ファイルが ${p.count} 件見つかりました。`,
  "info.adapter_candidates": (p) => `ADAPTER 候補が ${p.count} 件見つかりました。`,
  "info.selected_model": (p) => `選択したメインファイル: ${p.path} (${p.size})`,
  "info.selected_adapter": (p) => `選択した ADAPTER ファイル: ${p.path} (${p.size})`,
  "info.parameters_applied": (p) => `ユーザーパラメータ ${p.count} 件を適用します。`,
  "info.target_dir": (p) => `保存先ディレクトリ: ${p.path}`,
  "info.ollama_command": (p) => `Ollama 実行ファイル: ${p.cmd}`,
  "info.download_model_start": "メイン GGUF のダウンロードを開始します。進行バーを確認してください。",
  "info.download_adapter_start": "ADAPTER GGUF のダウンロードを開始します。進行バーを確認してください。",
  "info.modelfile_created": (p) => `Modelfile を作成しました: ${p.path}`,
  "info.model_create_start": "Ollama モデルの作成を開始します。",
  "info.run_command": (p) => `実行コマンド: ollama run ${p.model}`,
  "success.download_complete": (p) => `ダウンロード完了: ${p.path} (${p.size})`,
  "success.adapter_download_complete": (p) => `ADAPTER ダウンロード完了: ${p.path} (${p.size})`,
  "success.model_created": (p) => `Ollama モデルを作成しました: ${p.model}`,
  "success.model_deleted": (p) => `Ollama モデルを削除しました: ${p.model}`
};

const zh: MessageMap = {
  ...en,
  "app.description": "通过 Hugging Face 的 GGUF 文件分步安装和管理 Ollama 模型。",
  "cmd.install.description": "通过交互式步骤安装 Hugging Face GGUF 模型。",
  "cmd.config.description": "查看 Modelfile、更新参数或删除已安装模型。",
  "opt.repo": "Hugging Face 模型路径",
  "opt.file": "要下载的主 GGUF 文件路径",
  "opt.adapter": "要应用的 ADAPTER GGUF 文件路径",
  "opt.parameter": "添加到 Modelfile 的 PARAMETER 项",
  "opt.name": "要创建的 Ollama 模型名称",
  "opt.dir": "保存 GGUF 和 Modelfile 的目录",
  "prompt.repo": "请输入 Hugging Face 路径。",
  "prompt.save_dir": "请输入模型保存目录。",
  "prompt.model_file": "请选择要导入的主 GGUF 文件。",
  "prompt.model_name": "请输入 Ollama 模型名称。",
  "prompt.use_adapter": "是否应用额外的 ADAPTER GGUF？",
  "prompt.select_manifest": "请选择要配置的已安装模型。",
  "prompt.select_action": "请选择操作。",
  "choice.show": "查看 Modelfile",
  "choice.update": "更新参数并重新创建",
  "choice.delete": "删除已安装模型",
  "info.found_gguf": (p) => `找到 ${p.count} 个 GGUF 文件。`,
  "info.adapter_candidates": (p) => `找到 ${p.count} 个 ADAPTER 候选项。`,
  "info.selected_model": (p) => `已选择主文件: ${p.path} (${p.size})`,
  "info.selected_adapter": (p) => `已选择 ADAPTER 文件: ${p.path} (${p.size})`,
  "info.parameters_applied": (p) => `应用 ${p.count} 个用户参数。`,
  "info.target_dir": (p) => `目标目录: ${p.path}`,
  "info.download_model_start": "开始下载主 GGUF。请查看下面的进度条。",
  "info.download_adapter_start": "开始下载 ADAPTER GGUF。请查看下面的进度条。",
  "info.model_create_start": "开始创建 Ollama 模型。",
  "success.model_created": (p) => `Ollama 模型已创建: ${p.model}`,
  "success.model_deleted": (p) => `Ollama 模型已删除: ${p.model}`
};

const hi: MessageMap = {
  ...en,
  "app.description": "Hugging Face GGUF फ़ाइलों से Ollama मॉडलों को चरणबद्ध तरीके से इंस्टॉल और प्रबंधित करें।",
  "cmd.install.description": "मार्गदर्शित चरणों के साथ Hugging Face GGUF मॉडल इंस्टॉल करें।",
  "cmd.config.description": "Modelfile देखें, पैरामीटर अपडेट करें, या इंस्टॉल किए गए मॉडल हटाएँ।",
  "prompt.repo": "Hugging Face पथ दर्ज करें।",
  "prompt.save_dir": "मॉडल सहेजने का पथ दर्ज करें।",
  "prompt.model_file": "आयात करने के लिए मुख्य GGUF फ़ाइल चुनें।",
  "prompt.model_name": "Ollama मॉडल नाम दर्ज करें।",
  "prompt.use_adapter": "क्या आप अतिरिक्त ADAPTER GGUF लागू करना चाहते हैं?",
  "prompt.select_manifest": "कॉन्फ़िगर करने के लिए इंस्टॉल किया गया मॉडल चुनें।",
  "prompt.select_action": "कार्रवाई चुनें।",
  "choice.show": "Modelfile दिखाएँ",
  "choice.update": "पैरामीटर अपडेट कर पुनर्निर्माण करें",
  "choice.delete": "इंस्टॉल किया गया मॉडल हटाएँ",
  "info.found_gguf": (p) => `${p.count} GGUF फ़ाइलें मिलीं।`,
  "info.selected_model": (p) => `चयनित मुख्य फ़ाइल: ${p.path} (${p.size})`,
  "info.selected_adapter": (p) => `चयनित ADAPTER फ़ाइल: ${p.path} (${p.size})`,
  "success.model_created": (p) => `Ollama मॉडल बनाया गया: ${p.model}`
};

const fr: MessageMap = {
  ...en,
  "app.description": "Installer et gérer pas à pas des modèles Ollama à partir de fichiers GGUF Hugging Face.",
  "cmd.install.description": "Installez un modèle GGUF Hugging Face via des invites guidées.",
  "cmd.config.description": "Afficher le Modelfile, mettre à jour les paramètres ou supprimer les modèles installés.",
  "prompt.repo": "Entrez le chemin Hugging Face.",
  "prompt.save_dir": "Entrez le répertoire d'enregistrement du modèle.",
  "prompt.model_file": "Sélectionnez le fichier GGUF principal à importer.",
  "prompt.model_name": "Entrez le nom du modèle Ollama.",
  "prompt.use_adapter": "Voulez-vous appliquer un fichier ADAPTER GGUF supplémentaire ?",
  "choice.show": "Afficher le Modelfile",
  "choice.update": "Mettre à jour les paramètres et recréer",
  "choice.delete": "Supprimer le modèle installé",
  "info.found_gguf": (p) => `${p.count} fichiers GGUF trouvés.`,
  "info.selected_model": (p) => `Fichier principal sélectionné : ${p.path} (${p.size})`,
  "success.model_created": (p) => `Modèle Ollama créé : ${p.model}`
};

const ru: MessageMap = {
  ...en,
  "app.description": "Пошаговая установка и управление моделями Ollama из файлов GGUF Hugging Face.",
  "cmd.install.description": "Установить модель Hugging Face GGUF с пошаговыми подсказками.",
  "cmd.config.description": "Просмотр Modelfile, обновление параметров или удаление установленных моделей.",
  "prompt.repo": "Введите путь Hugging Face.",
  "prompt.save_dir": "Введите каталог для сохранения модели.",
  "prompt.model_file": "Выберите основной GGUF-файл для импорта.",
  "prompt.model_name": "Введите имя модели Ollama.",
  "prompt.use_adapter": "Применить дополнительный ADAPTER GGUF?",
  "choice.show": "Показать Modelfile",
  "choice.update": "Обновить параметры и пересоздать",
  "choice.delete": "Удалить установленную модель",
  "info.found_gguf": (p) => `Найдено файлов GGUF: ${p.count}.`,
  "info.selected_model": (p) => `Выбран основной файл: ${p.path} (${p.size})`,
  "success.model_created": (p) => `Модель Ollama создана: ${p.model}`
};

const es: MessageMap = {
  ...en,
  "app.description": "Instala y administra paso a paso modelos de Ollama desde archivos GGUF de Hugging Face.",
  "cmd.install.description": "Instala un modelo GGUF de Hugging Face con pasos guiados.",
  "cmd.config.description": "Ver Modelfile, actualizar parámetros o eliminar modelos instalados.",
  "prompt.repo": "Introduce la ruta de Hugging Face.",
  "prompt.save_dir": "Introduce el directorio donde guardar el modelo.",
  "prompt.model_file": "Selecciona el archivo GGUF principal que deseas importar.",
  "prompt.model_name": "Introduce el nombre del modelo de Ollama.",
  "prompt.use_adapter": "¿Quieres aplicar un ADAPTER GGUF adicional?",
  "choice.show": "Mostrar Modelfile",
  "choice.update": "Actualizar parámetros y recrear",
  "choice.delete": "Eliminar modelo instalado",
  "info.found_gguf": (p) => `Se encontraron ${p.count} archivos GGUF.`,
  "success.model_created": (p) => `Modelo de Ollama creado: ${p.model}`
};

const de: MessageMap = {
  ...en,
  "app.description": "Ollama-Modelle aus Hugging Face GGUF-Dateien schrittweise installieren und verwalten.",
  "cmd.install.description": "Installiert ein Hugging Face GGUF-Modell mit geführten Eingaben.",
  "cmd.config.description": "Modelfile anzeigen, Parameter aktualisieren oder installierte Modelle löschen.",
  "prompt.repo": "Geben Sie den Hugging Face-Pfad ein.",
  "prompt.save_dir": "Geben Sie das Speicherverzeichnis für das Modell ein.",
  "prompt.model_file": "Wählen Sie die Haupt-GGUF-Datei zum Importieren aus.",
  "prompt.model_name": "Geben Sie den Ollama-Modellnamen ein.",
  "prompt.use_adapter": "Möchten Sie eine zusätzliche ADAPTER-GGUF anwenden?",
  "choice.show": "Modelfile anzeigen",
  "choice.update": "Parameter aktualisieren und neu erstellen",
  "choice.delete": "Installiertes Modell löschen",
  "info.found_gguf": (p) => `${p.count} GGUF-Dateien gefunden.`,
  "success.model_created": (p) => `Ollama-Modell erstellt: ${p.model}`
};

const pt: MessageMap = {
  ...en,
  "app.description": "Instale e gerencie modelos Ollama passo a passo a partir de arquivos GGUF do Hugging Face.",
  "cmd.install.description": "Instale um modelo GGUF do Hugging Face com etapas guiadas.",
  "cmd.config.description": "Ver Modelfile, atualizar parâmetros ou excluir modelos instalados.",
  "prompt.repo": "Digite o caminho do Hugging Face.",
  "prompt.save_dir": "Digite o diretório para salvar o modelo.",
  "prompt.model_file": "Selecione o arquivo GGUF principal para importar.",
  "prompt.model_name": "Digite o nome do modelo Ollama.",
  "prompt.use_adapter": "Deseja aplicar um ADAPTER GGUF adicional?",
  "choice.show": "Mostrar Modelfile",
  "choice.update": "Atualizar parâmetros e recriar",
  "choice.delete": "Excluir modelo instalado",
  "info.found_gguf": (p) => `${p.count} arquivos GGUF encontrados.`,
  "success.model_created": (p) => `Modelo Ollama criado: ${p.model}`
};

const ar: MessageMap = {
  ...en,
  "app.description": "تثبيت وإدارة نماذج Ollama خطوة بخطوة من ملفات GGUF الخاصة بـ Hugging Face.",
  "cmd.install.description": "تثبيت نموذج GGUF من Hugging Face باستخدام خطوات موجهة.",
  "cmd.config.description": "عرض Modelfile أو تحديث المعلمات أو حذف النماذج المثبتة.",
  "prompt.repo": "أدخل مسار Hugging Face.",
  "prompt.save_dir": "أدخل مجلد حفظ النموذج.",
  "prompt.model_file": "اختر ملف GGUF الرئيسي للاستيراد.",
  "prompt.model_name": "أدخل اسم نموذج Ollama.",
  "prompt.use_adapter": "هل تريد تطبيق ملف ADAPTER GGUF إضافي؟",
  "choice.show": "عرض Modelfile",
  "choice.update": "تحديث المعلمات وإعادة الإنشاء",
  "choice.delete": "حذف النموذج المثبت",
  "info.found_gguf": (p) => `تم العثور على ${p.count} ملف GGUF.`,
  "success.model_created": (p) => `تم إنشاء نموذج Ollama: ${p.model}`
};

const id: MessageMap = {
  ...en,
  "app.description": "Instal dan kelola model Ollama langkah demi langkah dari file GGUF Hugging Face.",
  "cmd.install.description": "Instal model GGUF Hugging Face dengan langkah terpandu.",
  "cmd.config.description": "Lihat Modelfile, perbarui parameter, atau hapus model yang terpasang.",
  "prompt.repo": "Masukkan path Hugging Face.",
  "prompt.save_dir": "Masukkan direktori penyimpanan model.",
  "prompt.model_file": "Pilih file GGUF utama untuk diimpor.",
  "prompt.model_name": "Masukkan nama model Ollama.",
  "prompt.use_adapter": "Apakah Anda ingin menerapkan ADAPTER GGUF tambahan?",
  "choice.show": "Tampilkan Modelfile",
  "choice.update": "Perbarui parameter dan buat ulang",
  "choice.delete": "Hapus model terpasang",
  "info.found_gguf": (p) => `Ditemukan ${p.count} file GGUF.`,
  "success.model_created": (p) => `Model Ollama dibuat: ${p.model}`
};

const messages: Record<Locale, MessageMap> = { ko, en, ja, zh, hi, fr, ru, es, de, pt, ar, id };

function normalizeLocale(input?: string): Locale {
  const value = (input ?? "").toLowerCase();
  if (value.startsWith("ko")) return "ko";
  if (value.startsWith("ja")) return "ja";
  if (value.startsWith("zh")) return "zh";
  if (value.startsWith("hi")) return "hi";
  if (value.startsWith("fr")) return "fr";
  if (value.startsWith("ru")) return "ru";
  if (value.startsWith("es")) return "es";
  if (value.startsWith("de")) return "de";
  if (value.startsWith("pt")) return "pt";
  if (value.startsWith("ar")) return "ar";
  if (value.startsWith("id")) return "id";
  return "en";
}

function detectLocale(): Locale {
  return normalizeLocale(
    process.env.OLLAMA_HF_IMPORT_LANG ??
      process.env.LC_ALL ??
      process.env.LC_MESSAGES ??
      process.env.LANG ??
      Intl.DateTimeFormat().resolvedOptions().locale,
  );
}

export function t(key: string, params: MessageParams = {}): string {
  const locale = detectLocale();
  const value = messages[locale][key] ?? messages.en[key] ?? key;
  return typeof value === "function" ? value(params) : value;
}
