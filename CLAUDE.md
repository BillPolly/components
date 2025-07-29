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

**Note**: Tests use `NODE_OPTIONS='--experimental-vm-modules'` to support ES6 modules in Jest.

### Accessing Examples
Visit `http://localhost:3600/examples/` for interactive demos and component examples.

**Alternative port**: Use `PORT=xxxx npm start` to run server on a different port.

### Server Architecture
The development server (`server/server.js`) is an Express application that:
- Serves static files from `public/` directory
- Serves source files from `src/` for ES6 module imports
- Includes bundled CodeMirror libraries via `/lib/codemirror/*` routes
- Supports CodeMirror 6 with pre-bundled language extensions and themes

## Core Architecture

### Umbilical Component Protocol

Every component follows the same interface pattern:

```js
Component.create(umbilical)
```

The `umbilical` object is the component's entire world - it provides all external dependencies, capabilities, and communication channels. Components cannot access anything outside their umbilical, ensuring perfect isolation.

**Key Philosophy**: All interaction is messaging. All power is granted. All components live inside their umbilicals. The umbilical acts as both a capability boundary and message router, making this protocol suitable for unifying actors, components, and behavior trees under one paradigm.

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
- **Grid** (`src/components/grid/`): Interactive data grid with MVVM architecture, supports table/attribute modes
- **Field Editors** (`src/components/field-editors/`): Reusable input components (TextField, NumericField, BooleanField)
- **Tree** (`src/components/tree/`): Hierarchical tree view component with drag & drop, expansion state management
- **Divider** (`src/components/divider/`): Draggable divider for resizing panes, supports vertical/horizontal orientations
- **SimpleImage** (`src/components/simple-image/`): Minimal image display with configurable aspect ratio behavior
- **CodeEditor** (`src/components/code-editor/`): Full-featured code editor with syntax highlighting, built on CodeMirror 6
- **Tabs** (`src/components/tabs/`): Tab container component with MVVM architecture for organizing content
- **GraphEditor** (`src/components/graph-editor/`): Sophisticated node-graph editor with dual SVG/Canvas rendering and interaction state machine

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

### AI Agent Workflow
When building new components, follow this proven workflow:

1. **Discovery First**: Use introspection mode on existing components to understand patterns
2. **Choose Architecture**: Decide between simple approach vs MVVM based on complexity
3. **Implement Three-Mode Pattern**: Always support introspection, validation, and instance modes
4. **Test Incrementally**: Start with simple umbilicals, build up to complex scenarios
5. **Integrate & Demo**: Add to examples page to demonstrate functionality

### Component Architecture Decision Tree

**Use Simple Approach** (single file like SimpleImage, Button):
- Basic display or input components
- Minimal state management
- Simple user interactions
- Stateless or nearly stateless

**Use MVVM Approach** (like Grid, Tree, Divider):
- Complex state management
- Multiple interaction modes
- Sophisticated UI behaviors
- Rich user interactions (drag & drop, inline editing, etc.)

**Key Principle**: MVVM is preferred for complex components within the umbilical approach - it provides internal organization while maintaining the clean external umbilical interface.

### Component Creation
1. Always implement the three-mode pattern (introspection, validation, instance)
2. Use `UmbilicalUtils.validateCapabilities()` for required dependency checking
3. Components should be pure functions of their umbilical - no global state or side effects
4. Support lifecycle hooks (`onMount`, `onDestroy`) when appropriate
5. **Prefer MVVM architecture** for non-trivial components to maintain code organization

### Testing Best Practices
- Individual component tests focus on isolation and umbilical mocking
- Integration tests verify component composition and data flow
- Use `UmbilicalUtils.createMockUmbilical()` for test umbilicals
- Test environment is jsdom with Jest ES modules support
- **MVVM components**: Test through umbilical interface, not internal layers
- Field editors have comprehensive integration tests showing composition patterns
- Grid component has detailed tests for MVVM architecture and mode switching

**Common Testing Pitfalls & Solutions**:
- **jsdom limitations**: Mock `getBoundingClientRect()` manually instead of using jest.fn()
- **Event handlers**: Use manual mock functions instead of jest.fn() for ES6 module compatibility
- **Parameter naming**: Always check existing components for parameter conventions (e.g., `imageData` vs `imageUrl`)
- **Cleanup**: Always test component destruction and event listener removal

### Complex Component Architecture
For advanced components like Grid and Tree, the codebase uses internal MVVM patterns:
- **Model**: Pure data layer (e.g., `GridModel.js`, `TreeModel.js`) - handles state, validation, business logic
- **View**: DOM manipulation layer (e.g., `GridView.js`, `TreeView.js`) - renders UI, handles DOM events
- **ViewModel**: Coordination layer (e.g., `GridViewModel.js`) - bridges Model and View, manages interactions

These internal patterns maintain umbilical protocol externally while enabling sophisticated internal organization.

### Component Integration Patterns

**Successful Composition Examples**:

```js
// Real-time bidirectional data binding (Divider + Input)
const divider = Divider.create({
  dom: container,
  onResize: (position) => {
    inputElement.value = Math.round(position); // Update input
    updateStatus(`Position: ${position}%`);
  }
});

// Input updates divider in real-time
inputElement.addEventListener('input', (e) => {
  const position = parseInt(e.target.value);
  divider.setPosition(position); // Triggers onResize callback
});
```

```js
// Component composition with different behaviors (Divider + Images)
const leftImage = SimpleImage.create({
  dom: leftPane,
  src: 'image.jpg',
  objectFit: 'contain' // Locked aspect ratio
});

const rightImage = SimpleImage.create({
  dom: rightPane, 
  src: 'image2.jpg',
  objectFit: 'fill' // Unlocked aspect ratio
});

// Divider resizes both panes simultaneously
const divider = Divider.create({
  dom: container,
  onResize: (position) => {
    // Images automatically adapt to new pane sizes
    updatePaneSizes(position);
  }
});
```

**Event Handler Patterns**:
- Use arrow functions to maintain component scope
- Always validate input before calling component methods
- Implement cleanup in component destroy methods
- Use setTimeout for DOM updates that need to happen after current event cycle

### File Organization
```
src/
├── components/          # Individual components (each in own directory)
│   ├── grid/           # Complex components use MVVM structure:
│   │   ├── index.js    #   - Main component (umbilical protocol)
│   │   ├── model/      #   - Model layer (data, state, business logic)
│   │   ├── view/       #   - View layer (DOM, rendering)
│   │   └── viewmodel/  #   - ViewModel layer (coordination)
│   └── counter/        # Simple components are single files
├── umbilical/          # Protocol base utilities
└── utils.js            # Legacy utilities

test/                   # Jest tests matching component structure
public/examples/        # Demo applications and interactive examples
docs/                   # Protocol design documentation
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
- **MVVM is preferred** for complex components within the umbilical approach
- Complex components like Grid use internal MVVM patterns while maintaining umbilical protocol externally
- Field editors demonstrate reusable input patterns that can be composed within larger components
- **CodeMirror Integration**: CodeEditor component uses bundled CodeMirror 6 with pre-configured language support and themes
- **Graph Editor**: Uses Dagre layout engine and dual rendering modes (SVG for small graphs, Canvas for performance)
- **Component Discovery**: New components should be added to `/public/examples/` for testing and demonstration

## Quick Reference for AI Agents

### Three-Mode Component Template
```js
export const MyComponent = {
  create(umbilical) {
    // 1. Introspection mode
    if (umbilical.describe) {
      const requirements = UmbilicalUtils.createRequirements();
      requirements.add('dom', 'HTMLElement', 'Parent DOM element');
      requirements.add('data', 'any', 'Component data (optional)');
      umbilical.describe(requirements);
      return;
    }

    // 2. Validation mode
    if (umbilical.validate) {
      return umbilical.validate({
        hasDomElement: umbilical.dom && umbilical.dom.nodeType === Node.ELEMENT_NODE
      });
    }

    // 3. Instance creation mode
    UmbilicalUtils.validateCapabilities(umbilical, ['dom'], 'MyComponent');
    
    // Component implementation...
    const instance = {
      // Public API methods
      destroy() {
        // Cleanup logic
        if (umbilical.onDestroy) {
          umbilical.onDestroy(instance);
        }
      }
    };

    if (umbilical.onMount) {
      umbilical.onMount(instance);
    }

    return instance;
  }
};
```

### Common Umbilical Patterns
```js
// Standard parameters
dom: HTMLElement           // Required: Parent container
theme: 'light' | 'dark'   // Optional: Visual theme
disabled: boolean         // Optional: Disabled state

// Event callbacks
onMount: (instance) => {}     // Component created
onDestroy: (instance) => {}   // Component destroyed
onChange: (value, instance) => {}  // Value changed
onError: (error) => {}       // Error occurred

// Lifecycle management
instance.destroy()           // Cleanup component
instance.enable/disable()    // Toggle state
instance.setTheme(theme)     // Update appearance
```

### Testing Template
```js
describe('MyComponent', () => {
  test('follows umbilical protocol', () => {
    // 1. Test introspection
    let requirements = null;
    MyComponent.create({
      describe: (reqs) => { requirements = reqs.getAll(); }
    });
    expect(requirements.dom).toBeDefined();

    // 2. Test validation
    const validation = MyComponent.create({
      validate: (checks) => checks
    });
    expect(validation.hasDomElement).toBeDefined();

    // 3. Test instance creation
    const container = document.createElement('div');
    const instance = MyComponent.create({ dom: container });
    expect(instance).toBeDefined();
    expect(instance.destroy).toBeInstanceOf(Function);
  });
});
```