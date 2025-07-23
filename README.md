BOM mapping
=====

このプロジェクトはMaven BOMの比較を行うことを目的としています。
異なるバージョンのBOMが持つアーティファクトごとのバージョンを確認できます。

## 機能

- Maven CentralからBOMファイルを自動取得
- BOMに含まれるアーティファクトのバージョンを抽出してYAML形式で保存
- GitHub Pagesで動作するインタラクティブな比較UI
- バージョン間の追加・削除・更新されたアーティファクトを可視化

## セットアップ

### 必要な環境
- JDK 17以上
- Gradle 8.5以上

### ビルド
```bash
./gradlew build
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

`docs/index.html`をブラウザで開くか、GitHub Pagesでホストして利用します。

## 設定ファイル

`config.yaml`でBOMと対象バージョンを設定します：

```yaml
boms:
  - groupId: org.springframework.boot
    artifactId: spring-boot-dependencies
    versions:
      - 2.7.18
      - 3.0.13
      - 3.2.1

settings:
  mavenRepository: https://repo1.maven.org/maven2/
  snapshotDirectory: ./snapshots
  cacheEnabled: true
```

## ディレクトリ構造

```
bom-mapping/
├── config.yaml         # BOM設定ファイル
├── snapshots/         # YAML形式の中間ファイル
├── docs/              # GitHub Pages用ファイル
│   ├── index.html
│   ├── js/
│   ├── css/
│   └── data/
│       └── boms.json  # 生成されたBOMデータ
└── src/               # Kotlinソースコード
```
