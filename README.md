<h1 align="center"><img src="https://yallma3.org/yallma3.svg" alt="yaLLMa3 Logo"></h1>

# yaLLMa3

ِyaLLMa3 is a framework for building AI agents that are capable of learning from their environment and interacting with it. This project is inspired by the [Rivet](https://github.com/Ironclad/rivet) project, however it is taking a different approach to building agents, deployment and integration of agents into applications. More information about the project approach and goals can be found in the [web site](https://yallma3.org).

This repo contains the IDE for yaLLMa3 (yaLLMa3-studio), which is a visual IDE that allows you to build agents and packages that can be used to build applications.

## Running from Source

### Prerequisites

- [node >=20](https://nodejs.org/en/download/)
- [rust](https://rustup.rs/)
- [yarn](https://yarnpkg.com/getting-started/install)

### Building and Running

To build and run the app, follow these steps:

1. Clone the repository to your local machine, for example using SSH:

```bash
git clone git@github.com:yaLLMa3/studio.git
```

2. `cd` into the cloned folder and run `yarn` in the root folder
3. Start the app in development mode by running `yarn dev`

# yaLLma3 Studio

A modular application for creating and managing AI projects, agents, and flows.

## Project Structure

The project is organized into three main feature modules:

### 1. Projects Module

Located in `src/modules/projects/`:

- `components/` - UI components specific to projects
- `utils/` - Utility functions for project management
- `index.ts` - Exports from the projects module

### 2. Agents Module

Located in `src/modules/agents/`:

- `components/` - UI components specific to agents
- `utils/` - Utility functions for agent management
- `index.ts` - Exports from the agents module

### 3. Flows Module

Located in `src/modules/flows/`:

- `components/` - UI components for flow management and visualization
- `utils/` - Utility functions for flow operations
- `types/` - Type definitions for flows (nodes, connections, etc.)
- `index.ts` - Exports from the flows module

### Shared Components

Located in `src/components/`:

- `ui/` - Reusable UI components (buttons, tabs, etc.)
- `HomeScreen.tsx` - Main application screen with tabs for Projects, Agents, and Flows

## Getting Started

### Installation

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

## modules

- **Projects**: Create and manage AI development projects
- **Agents**: Build and customize AI agents
- **Flows**: Design, edit, and execute agent workflows using a node-based interface
