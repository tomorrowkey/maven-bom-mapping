BOM mapping
=====

このプロジェクトはMaven BOMの比較を行うことを目的としています。
異なるバージョンのBOMが持つアーティファクトごとのバージョンを確認できます。

🌐 URL: https://maven-bom-mapping.onrender.com/

## 機能

- Maven CentralやGoogle MavenからBOMファイルを自動取得
- BOMに含まれるアーティファクトのバージョンを抽出してYAML形式で保存
- React製のインタラクティブな比較UI
- バージョン間の追加・削除・更新されたアーティファクトをGitHub風のdiff表示で可視化
- URLパラメータによるパーマリンク機能
- 選択内容に応じた自動比較実行

## セットアップ

### 必要な環境
- JDK 17以上
- Gradle 8.5以上
- Node.js 20以上（UIビルド用）

### ビルド

#### バックエンド（Kotlin）
```bash
./gradlew build
```

#### フロントエンド（React）
```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# 本番ビルド
npm run build
```

## 使い方

### 1. BOMデータの生成

設定ファイル（`config.yaml`）に基づいてBOMデータを取得し、JSONファイルを生成します：

```bash
./gradlew run --args="generate"
```

特定のBOMのみを処理する場合：
```bash
./gradlew run --args="generate --bom=spring-boot-dependencies"
```

キャッシュを無視して強制的に再生成する場合：
```bash
./gradlew run --args="generate --force"
```

### 2. 比較UIの確認

#### ローカルでの確認（Docker Compose）

開発サーバー（React + Vite）：
```bash
# 開発サーバーを起動（ホットリロード対応）
docker compose up dev

# http://localhost:5173 にアクセス
```

本番プレビュー（静的ファイル）：
```bash
# まずビルドを実行
npm run build

# Nginxサーバーを起動
docker compose up web

# http://localhost:8080 にアクセス
```

#### GitHub Pagesでの公開
リポジトリの設定でGitHub Pagesを有効にし、`docs`フォルダを公開ディレクトリとして設定します。

## 設定ファイル

`config.yaml`でBOMと対象バージョンを設定します：

```yaml
boms:
  - groupId: androidx.compose
    artifactId: compose-bom
    versions:
      - 2024.11.00
      - 2024.12.01
      - 2025.01.00
      - 2025.01.01

  - groupId: com.google.firebase
    artifactId: firebase-bom
    versions:
      - 33.5.1
      - 33.6.0

settings:
  mavenRepository: https://maven.google.com/
  snapshotDirectory: ./snapshots
  cacheEnabled: true
```

## ディレクトリ構造

```
bom-mapping/
├── config.yaml         # BOM設定ファイル
├── snapshots/         # YAML形式の中間ファイル
├── docs/              # GitHub Pages用ファイル（ビルド出力）
│   ├── index.html
│   ├── assets/       # JS/CSSバンドル
│   └── data/
│       └── boms.json  # 生成されたBOMデータ
├── src/               # ソースコード
│   ├── main/         # Kotlinソースコード
│   ├── index.html    # React開発用HTML
│   ├── App.tsx       # Reactメインコンポーネント
│   ├── components/   # Reactコンポーネント
│   └── types/        # TypeScript型定義
├── package.json       # Node.js設定
├── tsconfig.json     # TypeScript設定
└── vite.config.ts    # Vite設定
```
