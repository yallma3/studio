# yaLLMa3 Studio

## Overview

yaLLMa3 Studio is a visual IDE for building AI agents using a modular, desktop application architecture. Built with Tauri (Rust backend) and React (TypeScript frontend), it provides a framework for creating AI agents capable of learning from their environment and interacting with it.

## Project Architecture

### Technology Stack

- React 19 + TypeScript + Vite + TailwindCSS 4.1
- Tauri 2.x (Rust-based)
- i18next (Arabic/English support with RTL)
- Yarn as package manager

## Current Directory Structure

```
studio/
├── public/                          # Static assets
├── release/                         # Release artifacts
├── scripts/                         # Build and deployment scripts
│   ├── build-macos-both.sh         # macOS universal binary build
│   └── build-universal.sh          # Universal build script
├── src/                            # Frontend source code
│   ├── app/                    # Main application files
│   │   ├── App.tsx/            # Main application component
│   │   └── App.css/            # Global styles
│   ├── Shared/                 # Shared components
│   │   ├── settings/              # Settings-related components
│   │   └── components/            # Reusable UI components
│   ├── i18n/                      # Internationalization
│   │   ├── locales/              # Translation files
│   │   │   ├── ar/               # Arabic translations
│   │   │   └── en/               # English translations
│   │   ├── i18n.ts              # i18n configuration
│   │   ├── json.d.ts            # TypeScript definitions
│   │   ├── rtl.css              # RTL styling
│   │   └── i18n.md              # i18n documentation
│   ├── modules/                   # Feature modules (core architecture)
│   │   ├── agent/               # AI agent management
│   │   │
│   │   ├── flow/               # Workflow/flow management
│   │   │   ├── components/      # Flow UI components
│   │   │   ├── hooks/           # Flow-related React hooks
│   │   │   ├── types/           # Flow type definitions
│   │   │   │   ├── Example/     # Example custom node
│   │   │   │   └── Nodes/       # Node type definitions
│   │   │   ├── utils/           # Flow utilities
│   │   │   ├── index.ts         # Module exports
│   │   │   ├── NodeCanvas.tsx # Flow Canvas component
│   │   │   ├── NodeCanvas.css # Flow Canvas styles
│   │   │   ├── initFlowSystem.ts # Flow system initialization
│   │   │   └── vars.ts          # Flow-specific variables
│   │   ├── task/               # Workflow/flow management
│   │   │   ├── TaskCanvas.tsx      # Task Canvas Component
│   │   │   └── vars.ts          # Task-specific variables
│   │   └── workspace/            # Workspace management
│   │       ├── components/      # Workspace UI components
│   │       ├── tabs/            # Tab-related components
│   │       ├── types/           # Workspace type definitions
│   │       ├── utils/           # Workspace utilities
│   │       ├── WorkspaceCanvas.tsx          # Workspace Canvas component
│   │       ├── WorkspaceCreationWizard.tsx  # Workspace Creation wizard component
│   │       ├── WorkspaceHome.tsx           # Workspace Home view
│   │       └── index.ts         # Module exports
│   ├── index.css                  # Base styles
│   ├── main.tsx                   # Application entry point
│   └── vite-env.d.ts             # Vite type definitions
├── src-tauri/                     # Tauri backend (Rust)
│   ├── capabilities/             # Tauri capabilities/permissions
│   ├── gen/                      # Generated files
│   ├── icons/                    # Application icons
│   ├── src/                      # Rust source code
│   │   ├── lib.rs               # Library entry point
│   │   └── main.rs              # Application entry point
│   ├── target/                   # Rust build artifacts
│   └── Cargo.toml               # Rust dependencies
├── eslint.config.js              # ESLint configuration
├── index.html                    # HTML entry point
├── package.json                  # Node.js dependencies
├── tailwind.config.js            # TailwindCSS configuration
├── tsconfig.json                 # TypeScript configuration
├── tsconfig.app.json            # App-specific TypeScript config
├── tsconfig.node.json           # Node-specific TypeScript config
├── vite.config.ts               # Vite build configuration
└── yarn.lock                    # Yarn lock file
```

## Module Architecture

The application follows a modular architecture with three core modules:

Here's your updated **Module Architecture** section to match the new project structure you've shared:

---

## Module Architecture

The application follows a modular architecture with **four** primary modules, each encapsulating a core feature of the yaLLMa3 Studio.

---

### 1. **Workspace Module** (`src/modules/workspace/`)

- **Purpose**: Manage the lifecycle and UI of user workspaces.
- **Key Components**:

  - `WorkspaceCanvas.tsx`: The main canvas where workspace content is rendered.
  - `WorkspaceCreationWizard.tsx`: Step-by-step UI for creating a new workspace.
  - `WorkspaceHome.tsx`: Home screen UI for managing and selecting workspaces.
  - `components/`: Reusable UI elements related to workspace features.
  - `tabs/`: Tab system for navigating between workspace views.

- **Responsibilities**:

  - Creating, editing, and persisting workspaces.
  - Organizing the user’s workspace environment.
  - Managing tabs and workspace-level state.

---

### 2. **Agent Module** (`src/modules/agent/`)

- **Purpose**: Handle creation, configuration, and behavior of AI agents.
- **Key Components**:

  - Agent logic and configuration UI (under development).

- **Responsibilities**:

  - Defining AI agent types, properties, and capabilities.
  - Saving/loading agent configurations.
  - Enabling agents to interact with flows and tasks.

---

### 3. **Flow Module** (`src/modules/flow/`)

- **Purpose**: Enable visual creation and management of logic flows using nodes.
- **Key Components**:

  - `NodeCanvas.tsx`: Visual editor for node-based workflows.
  - `initFlowSystem.ts`: Initializes the flow system and its dependencies.
  - `components/`: UI elements specific to flow editor.
  - `hooks/`: React hooks for managing flow state.
  - `types/`: Custom node types and flow definitions.
  - `utils/`: Flow-related utility functions.
  - `vars.ts`: Flow-specific constants and config.

- **Responsibilities**:

  - Designing and rendering interactive node flows.
  - Managing flow execution logic.
  - Providing an extensible structure for custom node types.

---

### 4. **Task Module** (`src/modules/task/`)

- **Purpose**: Manage background or agent-related tasks separate from flows.
- **Key Components**:

  - `TaskCanvas.tsx`: Canvas for rendering and interacting with task-specific UI.
  - `vars.ts`: Shared constants/configuration for task operations.

- **Responsibilities**:

  - Executing and monitoring tasks that may run in parallel with or outside flows.
  - Supporting task-level visualization and control interfaces.

  ***

### Available Scripts

```bash
yarn dev              # Start development server with Tauri
yarn start            # Start Vite dev server only
yarn build            # Build TypeScript and Vite bundle
yarn tauri-build      # Build Tauri application
yarn build-macos-both # Build universal macOS binary
yarn lint             # Run ESLint
yarn release          # Create release build
```
