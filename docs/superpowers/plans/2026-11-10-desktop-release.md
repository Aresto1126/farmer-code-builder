# Windows Desktop Release Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for inline execution.

**Goal:** Publish a public GitHub repository and downloadable Windows exe applications that work locally without an installed Node.js runtime.

**Architecture:** Package the existing Blockly application in Electron. Serve bundled assets over a restricted custom local protocol; retain renderer sandboxing and deny external navigation. Use electron-builder for portable and per-user NSIS distribution.

**Tech Stack:** Electron, electron-builder, existing Vite/Blockly, Node test runner, GitHub Actions.

**Spec:** Existing specification.md plus user's request for GitHub publication and a local exe application.

## Global Constraints
- Work only in FarmerCodeBuilder; no changes to game saves.
- App works offline; no additional Node.js installation required for end users.
- Existing browser projects are transferable through JSON import/export.
- Public repo/release contains source and generic examples, no user projects or local machine logs.
- Source remains locally available. Windows build targets x64.

## Review Focus
- Custom protocol rejects path traversal and remote origins.
- Renderer cannot access Node.js or unrestricted filesystem APIs.
- Downloaded project/code files retain expected contents.
- Saved projects survive restarting the packaged application.
- Public Release contains actual executable artifacts and build instructions.

## Task 1: Desktop wrapper
- [x] Add failing tests for local URL resolution and navigation policy.
- [x] Add Electron main entry, protocol resolver, lifecycle and download handling.
- [x] Add packaging configuration and offline assets; run tests/build.

## Task 2: Distribution
- [x] Build portable and per-user installer executables.
- [x] Launch built portable exe, verify editing, export and restart persistence.
- [x] Update README, public-safe docs, third-party license information and reproducible Windows CI.

## Task 3: Publication
- [x] Review source and release allowlists; initialize Git and commit.
- [x] Create public Aresto1126/farmer-code-builder repo if absent; push main.
- [x] Publish versioned release and exe assets with hashes.
- [x] Verify repository visibility, release assets and download URLs.

## Decisions
- User explicitly authorized GitHub publication and exe delivery; proceed through concrete publication.
- Electron chosen to preserve Blockly behavior and bundle a runtime. Tradeoff: larger download.
- New dedicated directory has no Git repo; initialize there instead of modifying other projects.
- Executables will be unsigned unless a signing identity is already available. No credentials will be created.
