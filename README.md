<h1 align="center"><img src="https://yallma3.org/yallma3.svg" alt="yaLLMa3 Logo"></h1>

# yaLLMa3 Studio

yaLLMa3 is a framework for building AI agents that are capable of learning from their environment and interacting with it. This project is inspired by the [Rivet](https://github.com/Ironclad/rivet) project, however it is taking a different approach to building agents, deployment and integration of agents into applications. More information about the project approach and goals can be found on the [website](https://yallma3.org).

This repo contains the IDE for yaLLMa3 (yaLLMa3 Studio), a visual IDE for building agents and packages.

## Prerequisites

- [Node >=24](https://nodejs.org/en/download/)
- [Rust](https://rustup.rs/)
- [Yarn](https://yarnpkg.com/getting-started/install)
- [Bun](https://bun.sh/) (for building the sidecar binary)

## Development

```bash
git clone git@github.com:yaLLMa3/studio.git
cd studio
yarn install
yarn dev
```

This starts the Tauri desktop app in dev mode. The first `yarn dev` builds the `yallma3-core` sidecar binary automatically via `pretauri:build`.

### Browser-only dev (no Tauri)

Set in `.env`:

```env
VITE_TAURI_MODE=false
```

Then run `yarn start` (Vite dev server at `http://localhost:3000`). The browser connects to `http://localhost:3001` by default.

### Using a remote yallma3 core

Create `.env.local` (gitignored, won't be committed):

```env
VITE_SPAWN_CORE=false
VITE_YALLMA3_URL=http://192.168.1.50:3001
```

This skips spawning the local sidecar binary and points the frontend at the remote core.

## Building for Distribution

### Local builds

```bash
yarn tauri-build
```

Output files use the convention `{product-name}_{version}_{arch}.{ext}` (e.g. `yallma3-studio_0.2.0_amd64.deb`).

### macOS universal builds

```bash
bash scripts/build-macos-both.sh   # separate Intel + ARM DMGs
bash scripts/build-universal.sh    # same, alternative script
```

### Release workflow

Push a tag matching `v*.*.*` to trigger the CI release workflow (`.github/workflows/release.yml`). The workflow builds for macOS, Linux, and Windows, then creates a GitHub Release with all artifacts.

## Environment Variables

| Var | File | Used in |
|---|---|---|
| `VITE_TAURI_MODE` | `.env` (shared) | Frontend — enables Tauri IPC path |
| `VITE_SPAWN_CORE` | `.env.local` (personal) | Rust — skips sidecar spawn when `false` |
| `VITE_YALLMA3_URL` | `.env.local` (personal) | Frontend — remote core URL fallback |

`.env` is committed and shared. `.env.local` is gitignored for personal overrides.

## Project Structure

```
src/
├── app/          — Root app component, initialization
├── modules/
│   ├── agents/   — Agent management UI
│   ├── api/      — Sidecar client, LLM API helpers
│   ├── flow/     — Node-based workflow editor
│   ├── projects/ — Project management UI
│   └── workspace/— Canvas and workspace state
├── components/   — Shared UI components
└── shared/       — Shared types and utilities
src-tauri/
├── src/lib.rs    — Tauri backend, sidecar process management
├── bin/          — Sidecar binary output (gitignored)
└── tauri.conf.json — Tauri configuration
scripts/
├── build-core.js      — Builds yallma3-core sidecar binary
├── build-macos-both.sh — macOS Intel + ARM DMG build
└── build-universal.sh  — Alternative macOS dual-arch build
```
