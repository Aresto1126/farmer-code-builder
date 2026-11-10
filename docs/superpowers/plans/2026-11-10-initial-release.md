# Farmer Code Builder 初期版 Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 日本語の接続ブロックからゲーム用コードを作成し、保存・復元・出力できるローカルアプリを作る。

**Architecture:** Blocklyを編集面に使い、専用の変換・検査器を分離する。ローカルブラウザーで動くViteアプリを採用し、公開は行わない。

**Tech Stack:** JavaScript ES Modules、Blockly、Vite、Node test runner。

**Spec:** ../../../specification.md

## Global Constraints
- 日本語UI、単一ドローン、ブロックを唯一の編集元とする。
- ゲームのセーブデータを書き換えない。生成コードを実行しない。
- 実機資料と照合できたAPIをカタログ化し、実際のゲーム動作検証とは区別する。
- 初期版は単一の `.py` ファイルに出力する。

## Review Focus
- 未接続ブロックを実行順へ混ぜない。
- 言語全解放がゲームAPIの研究制約を解除しない。
- 不正JSON、未知ブロック、ファイルバージョン不一致で現在の作業を破壊しない。
- 空の条件・本体、不正な変数・関数、未定義呼び出しを出力前に止める。
- 保存失敗を保存成功と表示しない。

## Task 1: 互換性資料と生成器
Files: src/catalog.js, src/compiler.js, tests/compiler.test.js
- [x] ローカルにゲーム資料があれば読み取り、出典を記録する。
- [x] Blockly状態を入力とする compile(workspaceState, profile) のテストを書く。入れ子、研究制約、未接続、名前と型を検証し、失敗を確認する。
- [x] コード、問題、行→ブロックIDを返す専用生成器を実装する。
- [x] npm testで合格を確認する。

## Task 2: プロジェクト保存とブロック定義
Files: src/project.js, src/blocks.js, src/samples.js, tests/project.test.js
- [x] validateProject(input) と保存復元テストを書き、失敗を確認する。
- [x] バージョン、ブロック種類、構造の検査とワークスペース復元を実装する。
- [x] 日本語ブロック、型接続、関数引数、変数、サンプルを定義する。
- [x] npm testで合格を確認する。

## Task 3: 編集アプリ
Files: index.html, src/main.js, src/style.css
- [x] パレット・ワークスペース・コード・問題一覧・説明・設定を実装する。
- [x] 元に戻す、検索、整列、保存復元、新規、複製、JSON入出力、PY出力を接続する。
- [x] 破損データは一時ワークスペースで検証し、現在の作業を維持する。
- [x] 自動保存・手動保存の失敗表示、未保存変更の保護を実装する。

## Task 4: 検証と受け渡し
Files: README.md, Start-FarmerCodeBuilder.cmd, docs/verification.md
- [x] npm test、npm run buildを実行する。
- [x] ブラウザーで編集・生成・保存復元・出力・設定を確認する。
- [x] 起動方法、対応範囲、実機未確認部分を記録する。
- [x] 完成画面を開き、最終レビューを行う。

## Decisions
- ユーザーの実装依頼を仕様書の初期版着手への承認として進める。
- 新規専用ディレクトリでありGit管理外なので、他プロジェクトのworktreeは作らない。
- ブラウザー版をローカル起動し、Windowsランチャーを付ける。ゲームへの直接保存・自動実行は対象外。
