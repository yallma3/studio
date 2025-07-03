# yaLLMa3 Studio Project Structure & Management Guide

## Overview

yaLLMa3 Studio is a visual IDE for building AI agents using a modular, desktop application architecture. Built with Tauri (Rust backend) and React (TypeScript frontend), it provides a framework for creating AI agents capable of learning from their environment and interacting with it.

## Project Architecture

### Technology Stack

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS 4.1
- **Backend**: Tauri 2.x (Rust-based)
- **UI Framework**: Custom components + Lucide React icons
- **Internationalization**: i18next (Arabic/English support with RTL)
- **Package Manager**: Yarn 1.22
- **Build System**: Vite + Tauri CLI

## Current Directory Structure

```
studio/
├── public/                          # Static assets
├── release/                         # Release artifacts
├── scripts/                         # Build and deployment scripts
│   ├── build-macos-both.sh         # macOS universal binary build
│   └── build-universal.sh          # Universal build script
├── src/                            # Frontend source code
│   ├── components/                 # Shared UI components
│   │   ├── settings/              # Settings-related components
│   │   ├── ui/                    # Reusable UI components
│   │   ├── AllGraphsDialog.tsx    # Graph management dialog
│   │   ├── HomeScreen.tsx         # Main application screen
│   │   ├── LanguageSelector.tsx   # Language switching component
│   │   └── vars.ts               # Shared variables/constants
│   ├── i18n/                      # Internationalization
│   │   ├── locales/              # Translation files
│   │   │   ├── ar/               # Arabic translations
│   │   │   └── en/               # English translations
│   │   ├── i18n.ts              # i18n configuration
│   │   ├── json.d.ts            # TypeScript definitions
│   │   ├── rtl.css              # RTL styling
│   │   └── i18n.md              # i18n documentation
│   ├── lib/                       # Shared utilities and libraries
│   ├── modules/                   # Feature modules (core architecture)
│   │   ├── agents/               # AI agent management
│   │   │   ├── components/       # Agent-specific UI components
│   │   │   ├── utils/           # Agent utilities
│   │   │   └── index.ts         # Module exports
│   │   ├── flows/               # Workflow/flow management
│   │   │   ├── components/      # Flow UI components
│   │   │   ├── hooks/           # Flow-related React hooks
│   │   │   ├── types/           # Flow type definitions
│   │   │   │   ├── Example/     # Example flow types
│   │   │   │   └── Nodes/       # Node type definitions
│   │   │   ├── utils/           # Flow utilities
│   │   │   ├── index.ts         # Module exports
│   │   │   ├── initFlowSystem.ts # Flow system initialization
│   │   │   └── vars.ts          # Flow-specific variables
│   │   └── projects/            # Project management
│   │       ├── components/      # Project UI components
│   │       │   └── tabs/        # Tab-related components
│   │       ├── types/           # Project type definitions
│   │       ├── utils/           # Project utilities
│   │       └── index.ts         # Module exports
│   ├── App.tsx                    # Main application component
│   ├── App.css                    # Global styles
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

### 1. Projects Module (`src/modules/projects/`)

- **Purpose**: Project lifecycle management, workspace handling
- **Key Components**: ProjectCanvas, workspace management
- **Responsibilities**: Creating, loading, saving projects

### 2. Agents Module (`src/modules/agents/`)

- **Purpose**: AI agent creation and management
- **Key Components**: Agent-specific UI and logic
- **Responsibilities**: Agent configuration, behavior definition

### 3. Flows Module (`src/modules/flow/`)

- **Purpose**: Visual workflow creation and execution
- **Key Components**: Node-based flow editor, flow execution engine
- **Responsibilities**: Flow design, node management, execution logic

## Development Workflow

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

## Current Strengths

1. **Modular Architecture**: Clear separation of concerns with dedicated modules
2. **Internationalization**: Built-in support for multiple languages with RTL
3. **Modern Tech Stack**: Latest React, TypeScript, and Tauri versions
4. **Cross-platform**: Desktop application with native performance
5. **Type Safety**: Comprehensive TypeScript usage

---

# Improvement Suggestions

## 1. Documentation & Onboarding

### Create Documentation Structure

```
docs/
├── README.md                    # Quick start guide
├── ARCHITECTURE.md             # System architecture overview
├── CONTRIBUTING.md             # Contribution guidelines
├── DEPLOYMENT.md               # Deployment instructions
├── API.md                      # API documentation
├── modules/                    # Module-specific documentation
│   ├── projects.md
│   ├── agents.md
│   └── flows.md
├── development/                # Development guides
│   ├── setup.md               # Development environment setup
│   ├── testing.md             # Testing guidelines
│   ├── debugging.md           # Debugging guide
│   └── code-style.md          # Code style guide
└── user/                      # User documentation
    ├── getting-started.md
    ├── features.md
    └── troubleshooting.md
```

### Recommended Documentation Files

1. **CONTRIBUTING.md**: Guidelines for new contributors
2. **ARCHITECTURE.md**: System design and module interactions
3. **SETUP.md**: Detailed development environment setup
4. **CODE_STYLE.md**: Coding standards and conventions

## 2. Development Environment Improvements

### Add Development Tools

```bash
# Additional dev dependencies to consider
yarn add -D:
  @testing-library/react        # Testing utilities
  @testing-library/jest-dom     # Jest DOM matchers
  vitest                        # Fast testing framework
  @storybook/react             # Component development
  husky                        # Git hooks
  lint-staged                  # Pre-commit linting
  prettier                     # Code formatting
  @types/jest                  # Jest type definitions
```

### Environment Configuration

```
.env.example                   # Example environment variables
.env.local                     # Local development config
```

### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

## 3. Testing Infrastructure

### Recommended Testing Structure

```
tests/
├── unit/                      # Unit tests
├── integration/               # Integration tests
├── e2e/                       # End-to-end tests
├── __mocks__/                 # Test mocks
├── fixtures/                  # Test data
└── utils/                     # Test utilities

src/
├── modules/
│   ├── projects/
│   │   ├── __tests__/         # Module-specific tests
│   │   └── components/
│   │       └── __tests__/     # Component tests
```

### Testing Configuration

```javascript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
  },
});
```

## 4. Code Organization Improvements

### Shared Types Directory

```
src/
├── types/                     # Shared type definitions
│   ├── index.ts              # Main type exports
│   ├── api.ts                # API-related types
│   ├── common.ts             # Common application types
│   └── tauri.ts              # Tauri-specific types
```

### Enhanced Module Structure

```
src/modules/[module]/
├── components/               # UI components
│   ├── index.ts             # Component exports
│   └── __tests__/           # Component tests
├── hooks/                   # Module-specific hooks
├── services/                # API/business logic services
├── stores/                  # State management (if using Redux/Zustand)
├── types/                   # Module-specific types
├── utils/                   # Utility functions
├── constants/               # Module constants
└── index.ts                # Main module exports
```

### Shared Services

```
src/services/
├── api/                     # API service layer
├── storage/                 # Local storage services
├── i18n/                    # Internationalization services
└── tauri/                   # Tauri-specific services
```

## 5. Build & Deployment Improvements

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: yarn install
      - run: yarn lint
      - run: yarn test
      - run: yarn build
```

### Multi-platform Build

```yaml
# .github/workflows/release.yml
strategy:
  matrix:
    platform: [macos-latest, ubuntu-latest, windows-latest]
```

### Package Scripts Enhancement

```json
{
  "scripts": {
    "dev": "tauri dev",
    "dev:web": "vite",
    "build": "tsc -b && vite build",
    "build:tauri": "tauri build",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:watch": "vitest --watch",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write src/**/*.{ts,tsx}",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist build target"
  }
}
```

## 6. State Management

### Consider State Management Solution

```bash
# For complex state management
yarn add zustand  # or redux-toolkit, jotai
```

### Recommended Store Structure

```
src/stores/
├── index.ts                  # Store configuration
├── projectStore.ts           # Project state
├── agentStore.ts            # Agent state
├── flowStore.ts             # Flow state
└── uiStore.ts               # UI state (modals, themes, etc.)
```

## 7. Error Handling & Logging

### Error Boundary Implementation

```typescript
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  // Implementation for catching React errors
}
```

### Logging Service

```typescript
// src/services/logging.ts
export class Logger {
  static error(message: string, error?: Error) {}
  static warn(message: string) {}
  static info(message: string) {}
  static debug(message: string) {}
}
```

## 8. Development Best Practices

### Code Quality Tools

1. **ESLint**: Extended configuration for React and TypeScript
2. **Prettier**: Consistent code formatting
3. **Husky**: Git hooks for quality gates
4. **CommitLint**: Conventional commit messages

### Recommended File Naming Conventions

- Components: `PascalCase.tsx`
- Hooks: `use[Name].ts`
- Utilities: `camelCase.ts`
- Types: `[name].types.ts`
- Constants: `[name].constants.ts`

### Component Structure Guidelines

```typescript
// Component template
interface Props {
  // Props definition
}

export const ComponentName: React.FC<Props> = (
  {
    // Destructured props
  }
) => {
  // Hooks
  // State
  // Effects
  // Handlers
  // Render
};
```

## Implementation Priority

1. **High Priority**:

   - Create CONTRIBUTING.md and SETUP.md
   - Add testing infrastructure (Vitest)
   - Implement error boundaries
   - Add pre-commit hooks

2. **Medium Priority**:

   - Enhance documentation structure
   - Add Storybook for component development
   - Implement comprehensive logging
   - Set up CI/CD pipeline

3. **Low Priority**:
   - Add state management (if needed)
   - Enhance build scripts
   - Add performance monitoring
   - Implement advanced testing strategies

This structure will significantly improve the developer experience, reduce onboarding time, and ensure consistent code quality as the team grows.
