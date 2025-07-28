# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a proof-of-concept implementation of the **Umbilical Component Protocol** - a minimal JavaScript component system where every component exposes exactly one function `Component.create(umbilical)` that receives all its dependencies and capabilities through a single object parameter.

## Essential Commands

### Development
```bash
npm install              # Install dependencies
npm start               # Start development server on port 3600
npm run dev             # Same as npm start
```

### Testing
```bash
npm test                # Run all Jest tests with ES modules
npm run test:watch      # Run tests in watch mode
```

### Accessing Examples
Visit `http://localhost:3600/examples/` for interactive demos and component examples.

## Core Architecture

### Umbilical Component Protocol

Every component follows the same interface pattern:

```js
Component.create(umbilical)
```

The `umbilical` object is the component's entire world - it provides all external dependencies, capabilities, and communication channels. Components cannot access anything outside their umbilical, ensuring perfect isolation.

### Component Modes

Components support three operational modes through the same `create()` function:

1. **Introspection Mode**: When `umbilical.describe` is provided, components describe their requirements
2. **Validation Mode**: When `umbilical.validate` is provided, components validate umbilical compatibility
3. **Instance Mode**: Normal operation creating component instances

### Key Components

- **Counter** (`src/components/counter/`): Pure state management, no DOM dependencies
- **Display** (`src/components/display/`): DOM rendering with customizable formatting
- **Button** (`src/components/button/`): User interaction handling
- **ContextMenu** (`src/components/context-menu/`): Hierarchical popup menus with positioning
- **Window** (`src/components/window/`): Draggable floating windows
- **ImageViewer** (`src/components/image-viewer/`): Image display with pan/zoom controls

### Utilities

- **UmbilicalUtils** (`src/umbilical/`): Base utilities for validation, requirements discovery, and mock creation
- **UmbilicalError**: Custom error type for component-specific failures

## Component Composition Patterns

### Agent-Centric Design
The protocol is designed for AI agents to discover, test, and compose components:

```js
// 1. Discovery: Agent finds what components need
Counter.create({
  describe: (requirements) => {
    // Agent learns Counter needs onChange callback, optional initialValue
  }
});

// 2. Validation: Agent tests compatibility
Counter.create({
  validate: (testUmbilical) => {
    return testUmbilical.onChange && typeof testUmbilical.onChange === 'function';
  }
});

// 3. Composition: Agent creates working applications
const display = Display.create({ dom: element, format: formatter });
const counter = Counter.create({ 
  onChange: (value) => display.update(value) 
});
const button = Button.create({ 
  dom: buttonElement, 
  onClick: () => counter.increment() 
});
```

### Integration Testing
The test suite (`test/integration.test.js`) demonstrates composition patterns:
- Counter + Display state synchronization
- Button + Counter interaction handling
- Full application lifecycle management
- Agent discovery and composition workflows

## Development Guidelines

### Component Creation
1. Always implement the three-mode pattern (introspection, validation, instance)
2. Use `UmbilicalUtils.validateCapabilities()` for required dependency checking
3. Components should be pure functions of their umbilical - no global state or side effects
4. Support lifecycle hooks (`onMount`, `onDestroy`) when appropriate

### Testing
- Individual component tests focus on isolation and umbilical mocking
- Integration tests verify component composition and data flow
- Use `UmbilicalUtils.createMockUmbilical()` for test umbilicals
- Test environment is jsdom with Jest ES modules support

### File Organization
```
src/
├── components/          # Individual components (each in own directory)
├── umbilical/          # Protocol base utilities
└── utils.js            # Legacy utilities

test/                   # Jest tests matching component structure
public/examples/        # Demo applications and interactive examples
```

## Key Benefits

- **Perfect Isolation**: Components cannot access anything outside their umbilical
- **Universal Testing**: Mock one object to test any component
- **Agent-Friendly**: Programmatic discovery and composition
- **Hot Swappable**: Replace components with identical interfaces
- **Framework Agnostic**: Components can use any internal implementation

## Important Notes

- All components use ES6 modules - ensure proper import/export syntax
- Components should handle umbilical validation gracefully
- The protocol is designed as "assembly language" for component systems
- Server runs Express serving static files from `public/` directory
- Jest configuration uses experimental VM modules for ES6 support