# TreeScribe Component Design Document

## Table of Contents
1. [Component Overview](#component-overview)
2. [Architecture Deep Dive](#architecture-deep-dive)
3. [YAML Processing Pipeline](#yaml-processing-pipeline)
4. [Folding System Design](#folding-system-design)
5. [Renderer Plugin System](#renderer-plugin-system)
6. [Navigation & Search Implementation](#navigation--search-implementation)
7. [Umbilical Protocol Integration](#umbilical-protocol-integration)
8. [Testing Strategy](#testing-strategy)
9. [Performance & Optimization](#performance--optimization)
10. [Accessibility & UX Guidelines](#accessibility--ux-guidelines)
11. [Example Implementations](#example-implementations)
12. [Development Workflow](#development-workflow)

---

## Component Overview

### Purpose & Philosophy

**TreeScribe** is a sophisticated YAML-based hierarchical document viewer designed to transform structured YAML files into interactive, navigable document trees. It serves as a flexible alternative to traditional document formats by combining YAML's clean structure with dynamic content rendering and rich navigation capabilities.

**Core Philosophy:**
- **Structure-First**: Leverage YAML's native nesting without artificial constraints
- **Content-Agnostic**: Support multiple content types through pluggable renderers
- **Agent-Friendly**: Full compatibility with the umbilical component protocol
- **Performance-Conscious**: Handle large document trees efficiently
- **Accessibility-Complete**: Support all users with comprehensive a11y features

### Key Differentiators

TreeScribe stands apart from existing umbilical components by:

1. **Hierarchical Complexity**: Manages arbitrary-depth tree structures with thousands of nodes
2. **Content Polymorphism**: Single component handles text, markdown, YAML objects, and custom content types
3. **Advanced State Management**: Complex folding states with global and individual controls
4. **Plugin Architecture**: Extensible renderer system for custom content types
5. **Real-World Utility**: Practical tool for documentation, technical writing, and knowledge management

### Integration with Umbilical System

TreeScribe follows all umbilical protocol conventions:
- **Three-Mode Operation**: Introspection, validation, and instance creation
- **Perfect Isolation**: All capabilities provided through umbilical parameter
- **Universal Testability**: Complete functionality testable through mock umbilicals
- **Composability**: Designed to work with other umbilical components

---

## Architecture Deep Dive

### MVVM Pattern Implementation

TreeScribe implements a sophisticated MVVM (Model-View-ViewModel) architecture to manage the complexity of hierarchical document rendering and interaction.

```
TreeScribe Umbilical Interface
├── Model Layer (Data & Business Logic)
│   ├── TreeScribeModel: Core document and tree management
│   ├── TreeNode: Individual node data and metadata
│   ├── RendererRegistry: Plugin management and renderer selection
│   └── SearchEngine: Full-text search with indexing
├── View Layer (DOM & Presentation)
│   ├── TreeScribeView: Main DOM structure and event handling
│   ├── NodeRenderer: Individual node HTML generation
│   ├── KeyboardNavigation: Keyboard interaction management
│   └── renderers/: Content-specific rendering modules
│       ├── MarkdownRenderer: Rich markdown with syntax highlighting
│       ├── PlaintextRenderer: Formatted plaintext display
│       ├── YamlRenderer: Structured YAML object visualization
│       └── CustomRenderer: Fallback for unknown content types
└── ViewModel Layer (Coordination & Commands)
    ├── TreeScribeViewModel: Main coordination and command processing
    ├── FoldingManager: Expand/collapse state management
    └── RenderingCoordinator: Renderer selection and content processing
```

### Model Layer Responsibilities

#### TreeScribeModel.js
```javascript
class TreeScribeModel {
  constructor() {
    this.rootNode = null;
    this.nodeIndex = new Map(); // Fast node lookup by ID
    this.searchIndex = null;
    this.metadata = {};
  }

  // Core operations
  loadYaml(yamlString) { /* Parse and build tree */ }
  exportJson() { /* Serialize to JSON */ }
  exportYaml() { /* Serialize back to YAML */ }
  
  // Tree operations
  getNode(nodeId) { /* O(1) node lookup */ }
  getChildren(nodeId) { /* Get direct children */ }
  getDescendants(nodeId) { /* Get all descendants */ }
  getPath(nodeId) { /* Get path from root to node */ }
  
  // Content operations
  updateNodeContent(nodeId, content) { /* Update and re-render */ }
  detectContentType(content) { /* Determine renderer type */ }
  
  // Events
  onChange(callback) { /* Subscribe to model changes */ }
}
```

#### TreeNode.js
```javascript
class TreeNode {
  constructor(data) {
    this.id = data.id || generateId();
    this.title = data.title;
    this.content = data.description || data.content;
    this.contentType = this.detectContentType(this.content);
    this.children = [];
    this.parent = null;
    this.metadata = data.metadata || {};
    this.state = {
      expanded: false,
      visible: true,
      searchHighlight: false
    };
  }

  // Content type detection
  detectContentType(content) {
    if (typeof content === 'string') {
      // Check for triple-backtick directives
      const directiveMatch = content.match(/^```(\w+)/);
      return directiveMatch ? directiveMatch[1] : 'plaintext';
    } else if (content && content.type) {
      return content.type;
    }
    return 'yaml'; // Structured object
  }

  // Tree navigation
  getDepth() { /* Calculate depth from root */ }
  getSiblings() { /* Get nodes at same level */ }
  isLeaf() { /* Check if has no children */ }
  isRoot() { /* Check if root node */ }
  
  // State management
  setState(newState) { /* Update node state */ }
  getState() { /* Get current state */ }
}
```

### View Layer Responsibilities

#### TreeScribeView.js
```javascript
class TreeScribeView {
  constructor(container, theme = 'light') {
    this.container = container;
    this.theme = theme;
    this.eventListeners = new Map();
    this.keyboardHandler = new KeyboardNavigation(this);
    this.nodeRenderers = new Map(); // Cache rendered nodes
  }

  // Main rendering
  render(treeModel) {
    this.clear();
    this.createStructure();
    this.renderTree(treeModel.rootNode);
    this.attachEventListeners();
  }

  // DOM structure creation
  createStructure() {
    this.container.innerHTML = `
      <div class="tree-scribe ${this.theme}">
        <div class="tree-scribe-header">
          <div class="controls">
            <button class="expand-all">Expand All</button>
            <button class="collapse-all">Collapse All</button>
            <input class="search-input" placeholder="Search..." />
          </div>
        </div>
        <div class="tree-scribe-content">
          <div class="tree-container" role="tree"></div>
        </div>
      </div>
    `;
  }

  // Event handling
  attachEventListeners() {
    // Node toggle events
    this.on('.node-toggle', 'click', this.handleNodeToggle);
    // Search events
    this.on('.search-input', 'input', this.handleSearch);
    // Keyboard events
    this.container.addEventListener('keydown', this.keyboardHandler.handle);
  }

  // Node rendering delegation
  renderNode(node, parentElement) {
    const nodeRenderer = new NodeRenderer(node, this.theme);
    const nodeElement = nodeRenderer.render();
    parentElement.appendChild(nodeElement);
    this.nodeRenderers.set(node.id, nodeRenderer);
    return nodeElement;
  }
}
```

#### NodeRenderer.js
```javascript
class NodeRenderer {
  constructor(node, theme) {
    this.node = node;
    this.theme = theme;
    this.rendererRegistry = RendererRegistry.getInstance();
  }

  render() {
    const nodeElement = this.createNodeStructure();
    this.renderTitle(nodeElement);
    this.renderContent(nodeElement);
    this.renderChildren(nodeElement);
    this.applyState(nodeElement);
    return nodeElement;
  }

  createNodeStructure() {
    const div = document.createElement('div');
    div.className = `tree-node depth-${this.node.getDepth()}`;
    div.setAttribute('data-node-id', this.node.id);
    div.setAttribute('role', 'treeitem');
    div.setAttribute('aria-expanded', this.node.state.expanded);
    return div;
  }

  renderContent(nodeElement) {
    const contentRenderer = this.rendererRegistry.getRenderer(this.node.contentType);
    const contentElement = contentRenderer.render(this.node.content);
    
    const contentContainer = document.createElement('div');
    contentContainer.className = 'node-content';
    contentContainer.appendChild(contentElement);
    nodeElement.appendChild(contentContainer);
  }
}
```

### ViewModel Layer Responsibilities

#### TreeScribeViewModel.js
```javascript
class TreeScribeViewModel {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.foldingManager = new FoldingManager(model);
    this.renderingCoordinator = new RenderingCoordinator(model, view);
    this.commandHistory = [];
    this.setupBindings();
  }

  // Command pattern implementation
  executeCommand(command, params) {
    const handler = this.getCommandHandler(command);
    if (handler) {
      const result = handler.call(this, params);
      this.commandHistory.push({ command, params, timestamp: Date.now() });
      return result;
    }
    throw new Error(`Unknown command: ${command}`);
  }

  // Command handlers
  toggleNode(nodeId) {
    const node = this.model.getNode(nodeId);
    if (node) {
      this.foldingManager.toggleNode(nodeId);
      this.view.updateNodeState(nodeId, node.state);
      this.notifyStateChange('nodeToggle', { nodeId, expanded: node.state.expanded });
    }
  }

  expandAll() {
    this.foldingManager.expandAll();
    this.view.render(this.model);
    this.notifyStateChange('expandAll');
  }

  collapseAll() {
    this.foldingManager.collapseAll();
    this.view.render(this.model);
    this.notifyStateChange('collapseAll');
  }

  searchContent(query) {
    const results = this.model.searchIndex.search(query);
    this.view.highlightSearchResults(results);
    this.notifyStateChange('search', { query, results });
    return results;
  }
}
```

---

## YAML Processing Pipeline

### Input Format Specification

TreeScribe processes standard YAML documents with flexible structure. The only requirement is that each node may contain a `title` field and either a `description` field or arbitrary nested structure.

#### Basic Structure
```yaml
title: "Root Document"
description: |
  This is the root content. It can be **markdown**,
  plain text, or any other supported format.

sections:
  - title: "Chapter 1"
    description:
      type: markdown
      content: |
        # Chapter 1: Getting Started
        
        This chapter introduces key concepts.
    
    subsections:
      - title: "Section 1.1"
        description: |
          ```javascript
          console.log("Code example");
          ```
```

#### Content Type Detection

TreeScribe supports two content specification methods:

1. **String-based with directives:**
   ```yaml
   description: |
     ```markdown
     # This is markdown content
     With **bold** and *italic* text.
     ```
   ```

2. **Object-based with explicit type:**
   ```yaml
   description:
     type: markdown
     content: |
       # This is markdown content
       With **bold** and *italic* text.
     metadata:
       author: "John Doe"
       lastModified: "2023-12-01"
   ```

### Parsing Strategy

#### YAML to JavaScript Object Conversion

```javascript
import { parse as parseYaml } from 'yaml';

class YamlProcessor {
  static parse(yamlString) {
    try {
      const parsed = parseYaml(yamlString);
      return this.normalizeStructure(parsed);
    } catch (error) {
      throw new YamlParseError(`Invalid YAML: ${error.message}`);
    }
  }

  static normalizeStructure(obj, parentId = null) {
    // Convert any object into TreeNode-compatible structure
    const node = {
      id: obj.id || this.generateId(),
      title: obj.title || 'Untitled',
      content: obj.description || obj.content,
      children: [],
      parentId,
      metadata: obj.metadata || {}
    };

    // Find all nested arrays and objects that represent children
    Object.keys(obj).forEach(key => {
      if (this.isChildCollection(key, obj[key])) {
        const children = this.processChildren(obj[key], node.id);
        node.children.push(...children);
      }
    });

    return node;
  }

  static isChildCollection(key, value) {
    // Detect child collections by common patterns
    const childKeyPatterns = ['sections', 'subsections', 'children', 'items', 'parts'];
    return childKeyPatterns.includes(key) || 
           (Array.isArray(value) && value.every(item => 
             item && typeof item === 'object' && item.title
           ));
  }
}
```

### Content Processing Flow

1. **Parse YAML**: Convert string to JavaScript object tree
2. **Normalize Structure**: Convert to TreeNode-compatible format
3. **Detect Content Types**: Analyze content for renderer selection
4. **Build Index**: Create fast lookup structures for navigation and search
5. **Initialize State**: Set default folding and visibility states

```javascript
class TreeScribeModel {
  loadYaml(yamlString) {
    // 1. Parse YAML
    const parsed = YamlProcessor.parse(yamlString);
    
    // 2. Build tree structure
    this.rootNode = this.buildTreeFromObject(parsed);
    
    // 3. Create indexes
    this.buildNodeIndex();
    this.buildSearchIndex();
    
    // 4. Initialize state
    this.initializeDefaultState();
    
    // 5. Notify change
    this.emit('modelChanged', { type: 'loaded', rootNode: this.rootNode });
  }

  buildTreeFromObject(obj, parent = null) {
    const node = new TreeNode({
      id: obj.id,
      title: obj.title,
      description: obj.content,
      metadata: obj.metadata
    });

    node.parent = parent;
    
    obj.children.forEach(childData => {
      const childNode = this.buildTreeFromObject(childData, node);
      node.children.push(childNode);
    });

    this.nodeIndex.set(node.id, node);
    return node;
  }
}
```

### Error Handling

```javascript
class YamlParseError extends Error {
  constructor(message, line, column) {
    super(message);
    this.name = 'YamlParseError';
    this.line = line;
    this.column = column;
  }
}

class ContentRenderError extends Error {
  constructor(message, nodeId, contentType) {
    super(message);
    this.name = 'ContentRenderError';
    this.nodeId = nodeId;
    this.contentType = contentType;
  }
}
```

---

## Folding System Design

### State Management Architecture

The folding system manages the expand/collapse state of individual nodes and provides global operations for tree-wide state changes.

#### Individual Node State

```javascript
class NodeState {
  constructor() {
    this.expanded = false;        // Is node content visible?
    this.childrenVisible = false; // Are children rendered?
    this.searchHighlighted = false; // Is node highlighted in search?
    this.depth = 0;              // Distance from root
    this.hasChildren = false;     // Does node have child nodes?
  }

  // State transitions
  expand() {
    this.expanded = true;
    this.childrenVisible = true;
  }

  collapse() {
    this.expanded = false;
    this.childrenVisible = false;
  }

  toggle() {
    this.expanded ? this.collapse() : this.expand();
  }
}
```

#### Folding Manager Implementation

```javascript
class FoldingManager {
  constructor(model) {
    this.model = model;
    this.stateHistory = [];
    this.maxHistorySize = 50;
  }

  // Individual node operations
  toggleNode(nodeId) {
    const node = this.model.getNode(nodeId);
    if (!node) return false;

    this.saveState();
    node.state.toggle();
    this.propagateStateChange(nodeId);
    return true;
  }

  expandNode(nodeId, recursive = false) {
    const node = this.model.getNode(nodeId);
    if (!node) return false;

    this.saveState();
    node.state.expand();
    
    if (recursive) {
      node.children.forEach(child => 
        this.expandNode(child.id, true)
      );
    }
    
    this.propagateStateChange(nodeId);
    return true;
  }

  collapseNode(nodeId, recursive = false) {
    const node = this.model.getNode(nodeId);
    if (!node) return false;

    this.saveState();
    node.state.collapse();
    
    if (recursive) {
      node.children.forEach(child => 
        this.collapseNode(child.id, true)
      );
    }
    
    this.propagateStateChange(nodeId);
    return true;
  }

  // Global operations
  expandAll() {
    this.saveState();
    this.model.getAllNodes().forEach(node => {
      node.state.expand();
    });
    this.propagateGlobalChange('expandAll');
  }

  collapseAll() {
    this.saveState();
    this.model.getAllNodes().forEach(node => {
      if (!node.isRoot()) {
        node.state.collapse();
      }
    });
    this.propagateGlobalChange('collapseAll');
  }

  expandToDepth(targetDepth) {
    this.saveState();
    this.model.getAllNodes().forEach(node => {
      if (node.getDepth() <= targetDepth) {
        node.state.expand();
      } else {
        node.state.collapse();
      }
    });
    this.propagateGlobalChange('expandToDepth', { depth: targetDepth });
  }

  // State persistence
  saveState() {
    const currentState = this.serializeState();
    this.stateHistory.push(currentState);
    
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
  }

  restoreState(stateIndex = -1) {
    const state = this.stateHistory[stateIndex] || this.stateHistory[this.stateHistory.length - 1];
    if (state) {
      this.deserializeState(state);
      this.propagateGlobalChange('stateRestored');
    }
  }

  serializeState() {
    const state = new Map();
    this.model.getAllNodes().forEach(node => {
      state.set(node.id, {
        expanded: node.state.expanded,
        childrenVisible: node.state.childrenVisible
      });
    });
    return state;
  }
}
```

### Visual Affordances

```css
/* Folding visual indicators */
.tree-node {
  position: relative;
}

.node-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-muted);
  transition: color 0.2s, transform 0.2s;
}

.node-toggle:hover {
  color: var(--text-primary);
  transform: scale(1.1);
}

.node-toggle.expanded::before {
  content: "▼";
}

.node-toggle.collapsed::before {
  content: "▶";
}

.node-toggle.empty {
  visibility: hidden;
}

/* Depth-based indentation */
.tree-node {
  padding-left: calc(var(--node-depth) * 20px);
}

/* Animation for expand/collapse */
.node-children {
  overflow: hidden;
  transition: max-height 0.3s ease-out;
}

.node-children.collapsed {
  max-height: 0;
}

.node-children.expanded {
  max-height: 1000px; /* Adjust based on content */
}
```

### Performance Considerations

```javascript
class FoldingManager {
  // Batch state changes for performance
  batchUpdate(operations) {
    this.saveState();
    this.suspendPropagation = true;
    
    operations.forEach(op => {
      switch (op.type) {
        case 'expand':
          this.expandNode(op.nodeId, op.recursive);
          break;
        case 'collapse':
          this.collapseNode(op.nodeId, op.recursive);
          break;
      }
    });
    
    this.suspendPropagation = false;
    this.propagateGlobalChange('batchUpdate', { operations });
  }

  // Virtual scrolling for large trees
  getVisibleNodes(scrollTop, containerHeight) {
    const nodeHeight = 40; // Average node height
    const startIndex = Math.floor(scrollTop / nodeHeight);
    const endIndex = Math.ceil((scrollTop + containerHeight) / nodeHeight);
    
    const visibleNodes = [];
    const allNodes = this.model.getAllNodes().filter(node => node.state.childrenVisible);
    
    for (let i = startIndex; i <= endIndex && i < allNodes.length; i++) {
      visibleNodes.push(allNodes[i]);
    }
    
    return {
      nodes: visibleNodes,
      startIndex,
      totalHeight: allNodes.length * nodeHeight
    };
  }
}
```

---

## Renderer Plugin System

### Architecture Overview

The renderer plugin system allows TreeScribe to handle diverse content types through a flexible, extensible architecture. Each renderer is responsible for converting content of a specific type into DOM elements.

#### Renderer Registry

```javascript
class RendererRegistry {
  static instance = null;

  constructor() {
    this.renderers = new Map();
    this.defaultRenderer = 'plaintext';
    this.registerBuiltinRenderers();
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new RendererRegistry();
    }
    return this.instance;
  }

  registerRenderer(type, renderer) {
    if (!(renderer instanceof BaseRenderer)) {
      throw new Error('Renderer must extend BaseRenderer');
    }
    this.renderers.set(type, renderer);
  }

  getRenderer(type) {
    return this.renderers.get(type) || this.renderers.get(this.defaultRenderer);
  }

  registerBuiltinRenderers() {
    this.registerRenderer('markdown', new MarkdownRenderer());
    this.registerRenderer('plaintext', new PlaintextRenderer());
    this.registerRenderer('yaml', new YamlRenderer());
    this.registerRenderer('custom', new CustomRenderer());
  }

  // Plugin loading
  async loadPlugin(pluginUrl) {
    try {
      const module = await import(pluginUrl);
      const RendererClass = module.default || module.Renderer;
      const renderer = new RendererClass();
      
      if (renderer.getSupportedTypes) {
        renderer.getSupportedTypes().forEach(type => {
          this.registerRenderer(type, renderer);
        });
      }
    } catch (error) {
      throw new Error(`Failed to load renderer plugin: ${error.message}`);
    }
  }
}
```

#### Base Renderer Interface

```javascript
class BaseRenderer {
  constructor(options = {}) {
    this.options = {
      theme: 'light',
      sanitize: true,
      ...options
    };
  }

  // Abstract methods - must be implemented by subclasses
  render(content, context = {}) {
    throw new Error('render() method must be implemented');
  }

  getSupportedTypes() {
    throw new Error('getSupportedTypes() method must be implemented');
  }

  // Utility methods available to all renderers
  createElement(tag, attributes = {}, textContent = '') {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    
    if (textContent) {
      element.textContent = textContent;
    }
    
    return element;
  }

  sanitizeHtml(html) {
    if (!this.options.sanitize) return html;
    
    // Basic HTML sanitization
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  applyTheme(element) {
    element.classList.add(`theme-${this.options.theme}`);
    return element;
  }
}
```

### Built-in Renderers

#### Markdown Renderer

```javascript
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

class MarkdownRenderer extends BaseRenderer {
  constructor(options = {}) {
    super(options);
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: this.highlightCode.bind(this)
    });
  }

  getSupportedTypes() {
    return ['markdown', 'md'];
  }

  render(content, context = {}) {
    const container = this.createElement('div', { 
      class: 'markdown-content' 
    });

    try {
      let markdownText = this.extractMarkdownText(content);
      const html = this.md.render(markdownText);
      container.innerHTML = this.options.sanitize ? this.sanitizeHtml(html) : html;
      
      this.applyTheme(container);
      this.addInteractivity(container, context);
      
    } catch (error) {
      container.appendChild(this.renderError(error, content));
    }

    return container;
  }

  extractMarkdownText(content) {
    if (typeof content === 'string') {
      // Handle triple-backtick blocks
      const match = content.match(/^```markdown\s*\n([\s\S]*?)```$/);
      return match ? match[1] : content;
    } else if (content && content.content) {
      return content.content;
    }
    return String(content);
  }

  highlightCode(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (error) {
        console.warn('Code highlighting failed:', error);
      }
    }
    
    return this.sanitizeHtml(str);
  }

  addInteractivity(container, context) {
    // Add click handlers for internal links
    container.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        context.onInternalLink?.(targetId);
      });
    });

    // Add copy buttons to code blocks
    container.querySelectorAll('pre > code').forEach(codeBlock => {
      const copyButton = this.createElement('button', {
        class: 'copy-code-button',
        title: 'Copy code'
      }, '📋');
      
      copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(codeBlock.textContent);
        copyButton.textContent = '✓';
        setTimeout(() => copyButton.textContent = '📋', 2000);
      });
      
      codeBlock.parentElement.appendChild(copyButton);
    });
  }

  renderError(error, content) {
    return this.createElement('div', {
      class: 'render-error markdown-error'
    }, `Markdown render error: ${error.message}`);
  }
}
```

#### YAML Renderer

```javascript
class YamlRenderer extends BaseRenderer {
  getSupportedTypes() {
    return ['yaml', 'yml', 'object'];
  }

  render(content, context = {}) {
    const container = this.createElement('div', { 
      class: 'yaml-content' 
    });

    try {
      const data = typeof content === 'string' ? 
        JSON.parse(content) : content;
      
      container.appendChild(this.renderObject(data));
      this.applyTheme(container);
      
    } catch (error) {
      container.appendChild(this.renderError(error, content));
    }

    return container;
  }

  renderObject(obj, depth = 0) {
    const container = this.createElement('div', {
      class: `yaml-object depth-${depth}`
    });

    if (Array.isArray(obj)) {
      container.appendChild(this.renderArray(obj, depth));
    } else if (obj && typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        const item = this.createElement('div', { class: 'yaml-item' });
        
        const keyElement = this.createElement('span', {
          class: 'yaml-key'
        }, key);
        
        const valueElement = this.createElement('span', {
          class: 'yaml-value'
        });
        
        if (typeof value === 'object') {
          valueElement.appendChild(this.renderObject(value, depth + 1));
        } else {
          valueElement.textContent = String(value);
          valueElement.className += ` yaml-${typeof value}`;
        }
        
        item.appendChild(keyElement);
        item.appendChild(valueElement);
        container.appendChild(item);
      });
    } else {
      container.textContent = String(obj);
    }

    return container;
  }

  renderArray(arr, depth) {
    const list = this.createElement('ul', { class: 'yaml-array' });
    
    arr.forEach((item, index) => {
      const listItem = this.createElement('li', {
        class: 'yaml-array-item'
      });
      
      if (typeof item === 'object') {
        listItem.appendChild(this.renderObject(item, depth + 1));
      } else {
        listItem.textContent = String(item);
      }
      
      list.appendChild(listItem);
    });
    
    return list;
  }
}
```

### Custom Renderer Development

#### Plugin Template

```javascript
// custom-chart-renderer.js
export class ChartRenderer extends BaseRenderer {
  constructor(options = {}) {
    super(options);
    this.chartLibrary = options.chartLibrary || 'chart.js';
  }

  getSupportedTypes() {
    return ['chart', 'graph', 'visualization'];
  }

  render(content, context = {}) {
    const container = this.createElement('div', {
      class: 'chart-content'
    });

    try {
      const chartData = this.parseChartData(content);
      const canvas = this.createElement('canvas');
      container.appendChild(canvas);
      
      this.renderChart(canvas, chartData);
      this.applyTheme(container);
      
    } catch (error) {
      container.appendChild(this.renderError(error, content));
    }

    return container;
  }

  parseChartData(content) {
    if (typeof content === 'string') {
      return JSON.parse(content);
    }
    return content;
  }

  async renderChart(canvas, data) {
    // Dynamic import for chart library
    const Chart = await import(this.chartLibrary);
    
    new Chart.default(canvas, {
      type: data.type || 'bar',
      data: data.data,
      options: {
        responsive: true,
        ...data.options
      }
    });
  }
}

// Plugin registration
export default ChartRenderer;
```

#### Plugin Loading Example

```javascript
// In TreeScribe initialization
const treeScribe = TreeScribe.create({
  dom: container,
  plugins: [
    {
      url: '/plugins/chart-renderer.js',
      options: { chartLibrary: 'chart.js' }
    }
  ]
});
```

---

## Navigation & Search Implementation

### Keyboard Navigation System

```javascript
class KeyboardNavigation {
  constructor(view) {
    this.view = view;
    this.focusedNodeId = null;
    this.shortcuts = new Map([
      ['ArrowDown', this.focusNext.bind(this)],
      ['ArrowUp', this.focusPrevious.bind(this)],
      ['ArrowRight', this.expandFocused.bind(this)],
      ['ArrowLeft', this.collapseFocused.bind(this)],
      ['Enter', this.toggleFocused.bind(this)],
      ['Space', this.toggleFocused.bind(this)],
      ['Home', this.focusFirst.bind(this)],
      ['End', this.focusLast.bind(this)],
      ['/', this.focusSearch.bind(this)],
      ['Escape', this.clearSearch.bind(this)]
    ]);
  }

  handle(event) {
    const handler = this.shortcuts.get(event.key);
    if (handler) {
      event.preventDefault();
      handler(event);
    }
  }

  focusNext() {
    const currentNode = this.getCurrentNode();
    const nextNode = this.getNextVisibleNode(currentNode);
    if (nextNode) {
      this.setFocus(nextNode.id);
    }
  }

  focusPrevious() {
    const currentNode = this.getCurrentNode();
    const prevNode = this.getPreviousVisibleNode(currentNode);
    if (prevNode) {
      this.setFocus(prevNode.id);
    }
  }

  expandFocused() {
    if (this.focusedNodeId) {
      this.view.viewModel.expandNode(this.focusedNodeId);
    }
  }

  setFocus(nodeId) {
    // Remove previous focus
    if (this.focusedNodeId) {
      const prevElement = this.view.getNodeElement(this.focusedNodeId);
      if (prevElement) {
        prevElement.classList.remove('focused');
        prevElement.setAttribute('tabindex', '-1');
      }
    }

    // Set new focus
    this.focusedNodeId = nodeId;
    const element = this.view.getNodeElement(nodeId);
    if (element) {
      element.classList.add('focused');
      element.setAttribute('tabindex', '0');
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}
```

### Search Engine Implementation

```javascript
class SearchEngine {
  constructor(model) {
    this.model = model;
    this.index = new Map(); // nodeId -> searchable text
    this.results = [];
    this.currentResultIndex = -1;
  }

  buildIndex() {
    this.index.clear();
    this.model.getAllNodes().forEach(node => {
      const searchText = this.extractSearchableText(node);
      this.index.set(node.id, searchText.toLowerCase());
    });
  }

  extractSearchableText(node) {
    let text = node.title + ' ';
    
    if (typeof node.content === 'string') {
      text += node.content;
    } else if (node.content && node.content.content) {
      text += node.content.content;
    }
    
    // Remove markdown/HTML markup for better searching
    text = text.replace(/[#*_`\[\]()]/g, ' ');
    text = text.replace(/\s+/g, ' ');
    
    return text.trim();
  }

  search(query) {
    if (!query || query.length < 2) {
      this.clearResults();
      return [];
    }

    const normalizedQuery = query.toLowerCase();
    const results = [];

    for (const [nodeId, text] of this.index) {
      const relevance = this.calculateRelevance(text, normalizedQuery);
      if (relevance > 0) {
        results.push({
          nodeId,
          relevance,
          snippet: this.generateSnippet(text, normalizedQuery),
          matches: this.findMatches(text, normalizedQuery)
        });
      }
    }

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);
    
    this.results = results;
    this.currentResultIndex = -1;
    
    return results;
  }

  calculateRelevance(text, query) {
    let score = 0;
    
    // Exact phrase match (highest score)
    if (text.includes(query)) {
      score += 10;
    }
    
    // Individual word matches
    const queryWords = query.split(/\s+/);
    const textWords = text.split(/\s+/);
    
    queryWords.forEach(queryWord => {
      textWords.forEach(textWord => {
        if (textWord.includes(queryWord)) {
          score += queryWord.length / textWord.length;
        }
      });
    });
    
    return score;
  }

  generateSnippet(text, query, maxLength = 150) {
    const queryIndex = text.indexOf(query);
    if (queryIndex === -1) return text.substring(0, maxLength) + '...';
    
    const start = Math.max(0, queryIndex - 50);
    const end = Math.min(text.length, queryIndex + query.length + 50);
    
    let snippet = text.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    
    return snippet;
  }

  navigateToResult(index) {
    if (index >= 0 && index < this.results.length) {
      this.currentResultIndex = index;
      const result = this.results[index];
      return result.nodeId;
    }
    return null;
  }

  nextResult() {
    return this.navigateToResult(this.currentResultIndex + 1);
  }

  previousResult() {
    return this.navigateToResult(this.currentResultIndex - 1);
  }
}
```

### Breadcrumb Navigation

```javascript
class BreadcrumbNavigation {
  constructor(view, model) {
    this.view = view;
    this.model = model;
    this.container = null;
  }

  render() {
    this.container = this.createElement('nav', {
      class: 'breadcrumb-navigation',
      'aria-label': 'Document navigation'
    });

    return this.container;
  }

  updateBreadcrumb(nodeId) {
    if (!this.container) return;

    const path = this.model.getPathToNode(nodeId);
    this.container.innerHTML = '';

    path.forEach((node, index) => {
      const isLast = index === path.length - 1;
      
      const item = this.createElement('span', {
        class: `breadcrumb-item ${isLast ? 'current' : ''}`
      });

      if (!isLast) {
        const link = this.createElement('button', {
          class: 'breadcrumb-link',
          'data-node-id': node.id
        }, node.title);
        
        link.addEventListener('click', () => {
          this.view.viewModel.navigateToNode(node.id);
        });
        
        item.appendChild(link);
        
        const separator = this.createElement('span', {
          class: 'breadcrumb-separator'
        }, ' › ');
        item.appendChild(separator);
      } else {
        item.textContent = node.title;
      }
      
      this.container.appendChild(item);
    });
  }
}
```

---

## Umbilical Protocol Integration

### Three-Mode Implementation

```javascript
export const TreeScribe = {
  create(umbilical) {
    // 1. Introspection mode - describe requirements
    if (umbilical.describe) {
      const requirements = UmbilicalUtils.createRequirements();
      
      // Required capabilities
      requirements.add('dom', 'HTMLElement', 'Parent DOM element for rendering');
      
      // Optional content source
      requirements.add('yamlContent', 'string', 'Initial YAML document content (optional)');
      requirements.add('yamlUrl', 'string', 'URL to load YAML document from (optional)');
      
      // Configuration options
      requirements.add('theme', 'string', 'Visual theme: light or dark (optional, default: light)');
      requirements.add('initialDepth', 'number', 'Initial expansion depth (optional, default: 2)');
      requirements.add('searchEnabled', 'boolean', 'Enable search functionality (optional, default: true)');
      requirements.add('keyboardNavigation', 'boolean', 'Enable keyboard navigation (optional, default: true)');
      
      // Plugin system
      requirements.add('plugins', 'array', 'Custom renderer plugins (optional)');
      requirements.add('rendererOptions', 'object', 'Options for built-in renderers (optional)');
      
      // Event callbacks
      requirements.add('onNodeToggle', 'function', 'Callback when node is expanded/collapsed (optional)');
      requirements.add('onSearch', 'function', 'Callback when search is performed (optional)');
      requirements.add('onNavigate', 'function', 'Callback when navigation occurs (optional)');
      requirements.add('onRendererError', 'function', 'Callback when renderer encounters error (optional)');
      requirements.add('onLoad', 'function', 'Callback when document is loaded (optional)');
      
      umbilical.describe(requirements);
      return;
    }

    // 2. Validation mode - check compatibility
    if (umbilical.validate) {
      const checks = {
        hasDomElement: !!(umbilical.dom && umbilical.dom.nodeType === Node.ELEMENT_NODE),
        hasValidTheme: !umbilical.theme || ['light', 'dark'].includes(umbilical.theme),
        hasValidDepth: !umbilical.initialDepth || (
          typeof umbilical.initialDepth === 'number' && 
          umbilical.initialDepth >= 0
        ),
        hasValidPlugins: !umbilical.plugins || (
          Array.isArray(umbilical.plugins) &&
          umbilical.plugins.every(plugin => 
            plugin && (plugin.constructor || plugin.url)
          )
        ),
        hasValidCallbacks: this._validateCallbacks(umbilical),
        hasValidContent: this._validateContentSource(umbilical)
      };
      return umbilical.validate(checks);
    }

    // 3. Instance creation mode
    UmbilicalUtils.validateCapabilities(umbilical, ['dom'], 'TreeScribe');
    
    return new TreeScribeInstance(umbilical);
  },

  _validateCallbacks(umbilical) {
    const callbacks = [
      'onNodeToggle', 'onSearch', 'onNavigate', 
      'onRendererError', 'onLoad'
    ];
    return callbacks.every(callback => 
      !umbilical[callback] || typeof umbilical[callback] === 'function'
    );
  },

  _validateContentSource(umbilical) {
    // At least one content source should be provided or component should work empty
    if (!umbilical.yamlContent && !umbilical.yamlUrl) {
      return true; // Allow empty initialization
    }
    
    if (umbilical.yamlContent && typeof umbilical.yamlContent !== 'string') {
      return false;
    }
    
    if (umbilical.yamlUrl && typeof umbilical.yamlUrl !== 'string') {
      return false;
    }
    
    return true;
  }
};
```

### TreeScribe Instance Implementation

```javascript
class TreeScribeInstance {
  constructor(umbilical) {
    this.umbilical = umbilical;
    this._destroyed = false;
    
    // Initialize configuration
    this.config = {
      theme: umbilical.theme || 'light',
      initialDepth: umbilical.initialDepth || 2,
      searchEnabled: umbilical.searchEnabled !== false,
      keyboardNavigation: umbilical.keyboardNavigation !== false,
      rendererOptions: umbilical.rendererOptions || {}
    };
    
    // Initialize MVVM components
    this.model = new TreeScribeModel();
    this.view = new TreeScribeView(umbilical.dom, this.config);
    this.viewModel = new TreeScribeViewModel(this.model, this.view);
    
    // Set up event forwarding to umbilical callbacks
    this._setupEventForwarding();
    
    // Load plugins if provided
    if (umbilical.plugins) {
      this._loadPlugins(umbilical.plugins);
    }
    
    // Load initial content if provided
    if (umbilical.yamlContent) {
      this.loadYaml(umbilical.yamlContent);
    } else if (umbilical.yamlUrl) {
      this.loadFromUrl(umbilical.yamlUrl);
    }
    
    // Call onMount callback
    if (umbilical.onMount) {
      umbilical.onMount(this);
    }
  }

  _setupEventForwarding() {
    // Forward internal events to umbilical callbacks
    this.viewModel.on('nodeToggle', (data) => {
      if (this.umbilical.onNodeToggle) {
        this.umbilical.onNodeToggle(data.nodeId, data.expanded);
      }
    });

    this.viewModel.on('search', (data) => {
      if (this.umbilical.onSearch) {
        this.umbilical.onSearch(data.query, data.results);
      }
    });

    this.viewModel.on('navigate', (data) => {
      if (this.umbilical.onNavigate) {
        this.umbilical.onNavigate(data.nodeId, data.path);
      }
    });

    this.viewModel.on('rendererError', (error) => {
      if (this.umbilical.onRendererError) {
        this.umbilical.onRendererError(error.message, error.nodeId);
      }
    });

    this.model.on('load', (data) => {
      if (this.umbilical.onLoad) {
        this.umbilical.onLoad(data.nodeCount, data.rootNode);
      }
    });
  }

  async _loadPlugins(plugins) {
    const registry = RendererRegistry.getInstance();
    
    for (const plugin of plugins) {
      try {
        if (plugin.constructor) {
          // Direct renderer instance
          const renderer = new plugin.constructor(plugin.options);
          renderer.getSupportedTypes().forEach(type => {
            registry.registerRenderer(type, renderer);
          });
        } else if (plugin.url) {
          // URL-based plugin
          await registry.loadPlugin(plugin.url);
        }
      } catch (error) {
        console.error('Failed to load plugin:', error);
        if (this.umbilical.onRendererError) {
          this.umbilical.onRendererError(error.message, 'plugin-load');
        }
      }
    }
  }

  // Public API methods
  loadYaml(yamlString) {
    try {
      this.model.loadYaml(yamlString);
      this.viewModel.expandToDepth(this.config.initialDepth);
      this.view.render(this.model);
    } catch (error) {
      throw new Error(`Failed to load YAML: ${error.message}`);
    }
  }

  async loadFromUrl(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const yamlContent = await response.text();
      this.loadYaml(yamlContent);
    } catch (error) {
      throw new Error(`Failed to load YAML from URL: ${error.message}`);
    }
  }

  exportHtml() {
    return this.view.exportHtml();
  }

  exportJson() {
    return this.model.exportJson();
  }

  expandAll() {
    this.viewModel.expandAll();
  }

  collapseAll() {
    this.viewModel.collapseAll();
  }

  expandToDepth(depth) {
    this.viewModel.expandToDepth(depth);
  }

  searchContent(query) {
    return this.viewModel.searchContent(query);
  }

  getNodeState(nodeId) {
    const node = this.model.getNode(nodeId);
    return node ? { ...node.state } : null;
  }

  setNodeState(nodeId, state) {
    const node = this.model.getNode(nodeId);
    if (node) {
      Object.assign(node.state, state);
      this.view.updateNodeState(nodeId, node.state);
    }
  }

  getFoldingState() {
    return this.viewModel.foldingManager.serializeState();
  }

  destroy() {
    if (this._destroyed) return;

    if (this.viewModel) {
      this.viewModel.destroy();
    }
    if (this.view) {
      this.view.destroy();
    }
    if (this.model) {
      this.model.destroy();
    }

    this._destroyed = true;

    if (this.umbilical.onDestroy) {
      this.umbilical.onDestroy(this);
    }
  }
}
```

---

## Testing Strategy

### Unit Testing Approach

#### Model Layer Tests

```javascript
// test/components/tree-scribe/model/TreeScribeModel.test.js
import { TreeScribeModel } from '../../../../src/components/tree-scribe/model/TreeScribeModel.js';

describe('TreeScribeModel', () => {
  let model;

  beforeEach(() => {
    model = new TreeScribeModel();
  });

  describe('YAML Processing', () => {
    test('should parse simple YAML document', () => {
      const yaml = `
title: Root
description: Root content
sections:
  - title: Child 1
    description: Child content
`;
      
      model.loadYaml(yaml);
      
      expect(model.rootNode).toBeDefined();
      expect(model.rootNode.title).toBe('Root');
      expect(model.rootNode.children).toHaveLength(1);
      expect(model.rootNode.children[0].title).toBe('Child 1');
    });

    test('should handle nested structures', () => {
      const yaml = `
title: Level 1
sections:
  - title: Level 2
    subsections:
      - title: Level 3
        description: Deep content
`;
      
      model.loadYaml(yaml);
      
      const level3Node = model.rootNode.children[0].children[0];
      expect(level3Node.title).toBe('Level 3');
      expect(level3Node.getDepth()).toBe(2);
    });

    test('should detect content types correctly', () => {
      const yaml = `
title: Mixed Content
sections:
  - title: Markdown
    description: |
      ```markdown
      # Header
      **Bold text**
      ```
  - title: Plain
    description: Simple text
  - title: Structured
    description:
      type: yaml
      content:
        key: value
`;
      
      model.loadYaml(yaml);
      
      const nodes = model.rootNode.children;
      expect(nodes[0].contentType).toBe('markdown');
      expect(nodes[1].contentType).toBe('plaintext');
      expect(nodes[2].contentType).toBe('yaml');
    });
  });

  describe('Tree Operations', () => {
    beforeEach(() => {
      const yaml = `
title: Root
sections:
  - title: A
    id: node-a
  - title: B
    id: node-b
    sections:
      - title: B1
        id: node-b1
`;
      model.loadYaml(yaml);
    });

    test('should provide fast node lookup', () => {
      const nodeA = model.getNode('node-a');
      expect(nodeA).toBeDefined();
      expect(nodeA.title).toBe('A');
    });

    test('should calculate node paths correctly', () => {
      const path = model.getPathToNode('node-b1');
      expect(path.map(n => n.title)).toEqual(['Root', 'B', 'B1']);
    });

    test('should get all descendants', () => {
      const descendants = model.getDescendants('node-b');
      expect(descendants).toHaveLength(1);
      expect(descendants[0].id).toBe('node-b1');
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      const yaml = `
title: Documentation
description: |
  This is the main documentation for the TreeScribe component.
sections:
  - title: Getting Started
    description: Learn how to use TreeScribe
  - title: Advanced Topics
    description: |
      Advanced usage patterns and customization options.
      Includes plugin development and performance optimization.
`;
      model.loadYaml(yaml);
    });

    test('should build search index', () => {
      expect(model.searchIndex).toBeDefined();
      expect(model.searchIndex.index.size).toBeGreaterThan(0);
    });

    test('should find relevant results', () => {
      const results = model.searchIndex.search('TreeScribe');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].relevance).toBeGreaterThan(0);
    });

    test('should rank results by relevance', () => {
      const results = model.searchIndex.search('advanced');
      expect(results.length).toBeGreaterThan(0);
      
      // Results should be sorted by relevance
      for (let i = 1; i < results.length; i++) {
        expect(results[i-1].relevance).toBeGreaterThanOrEqual(results[i].relevance);
      }
    });
  });
});
```

#### View Layer Tests

```javascript
// test/components/tree-scribe/view/TreeScribeView.test.js
import { TreeScribeView } from '../../../../src/components/tree-scribe/view/TreeScribeView.js';
import { TreeScribeModel } from '../../../../src/components/tree-scribe/model/TreeScribeModel.js';

describe('TreeScribeView', () => {
  let container;
  let view;
  let model;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    view = new TreeScribeView(container, 'light');
    model = new TreeScribeModel();
  });

  afterEach(() => {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('DOM Structure', () => {
    test('should create basic structure', () => {
      view.render(model);
      
      expect(container.querySelector('.tree-scribe')).toBeTruthy();
      expect(container.querySelector('.tree-scribe-header')).toBeTruthy();
      expect(container.querySelector('.tree-scribe-content')).toBeTruthy();
      expect(container.querySelector('.tree-container')).toBeTruthy();
    });

    test('should apply theme classes', () => {
      view.render(model);
      
      const treeScribe = container.querySelector('.tree-scribe');
      expect(treeScribe.classList.contains('light')).toBe(true);
    });

    test('should include search controls when enabled', () => {
      view.render(model);
      
      expect(container.querySelector('.search-input')).toBeTruthy();
      expect(container.querySelector('.expand-all')).toBeTruthy();
      expect(container.querySelector('.collapse-all')).toBeTruthy();
    });
  });

  describe('Node Rendering', () => {
    beforeEach(() => {
      const yaml = `
title: Test Node
description: Test content
sections:
  - title: Child Node
    description: Child content
`;
      model.loadYaml(yaml);
    });

    test('should render tree nodes', () => {
      view.render(model);
      
      const nodes = container.querySelectorAll('.tree-node');
      expect(nodes.length).toBeGreaterThan(0);
    });

    test('should include accessibility attributes', () => {
      view.render(model);
      
      const treeContainer = container.querySelector('.tree-container');
      expect(treeContainer.getAttribute('role')).toBe('tree');
      
      const nodes = container.querySelectorAll('.tree-node');
      nodes.forEach(node => {
        expect(node.getAttribute('role')).toBe('treeitem');
        expect(node.hasAttribute('aria-expanded')).toBe(true);
      });
    });

    test('should handle node toggle events', () => {
      view.render(model);
      
      const toggleButton = container.querySelector('.node-toggle');
      expect(toggleButton).toBeTruthy();
      
      // Mock the event handler
      let toggleCalled = false;
      view.on('nodeToggle', () => { toggleCalled = true; });
      
      toggleButton.click();
      expect(toggleCalled).toBe(true);
    });
  });

  describe('Search Interface', () => {
    test('should handle search input events', (done) => {
      view.render(model);
      
      const searchInput = container.querySelector('.search-input');
      view.on('search', (query) => {
        expect(query).toBe('test search');
        done();
      });
      
      searchInput.value = 'test search';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    test('should highlight search results', () => {
      model.loadYaml(`
title: Test
description: This is a test document
`);
      view.render(model);
      
      const results = [{ nodeId: model.rootNode.id, matches: ['test'] }];
      view.highlightSearchResults(results);
      
      const highlightedNode = container.querySelector('.tree-node.search-highlighted');
      expect(highlightedNode).toBeTruthy();
    });
  });
});
```

### Integration Testing

```javascript
// test/components/tree-scribe/integration.test.js
import { TreeScribe } from '../../../src/components/tree-scribe/index.js';

describe('TreeScribe Integration', () => {
  let container;
  let instance;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (instance && instance.destroy) {
      instance.destroy();
    }
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Umbilical Protocol Compliance', () => {
    test('should support introspection mode', () => {
      let requirements = null;
      
      TreeScribe.create({
        describe: (reqs) => {
          requirements = reqs.getAll();
        }
      });
      
      expect(requirements).toBeDefined();
      expect(requirements.dom).toBeDefined();
      expect(requirements.yamlContent).toBeDefined();
      expect(requirements.onNodeToggle).toBeDefined();
    });

    test('should support validation mode', () => {
      const validation = TreeScribe.create({
        validate: (checks) => checks,
        dom: container,
        theme: 'light'
      });
      
      expect(validation.hasDomElement).toBe(true);
      expect(validation.hasValidTheme).toBe(true);
    });

    test('should create working instance', () => {
      instance = TreeScribe.create({
        dom: container,
        yamlContent: `
title: Test Document
description: This is a test
sections:
  - title: Section 1
    description: Section content
`
      });
      
      expect(instance).toBeDefined();
      expect(instance.loadYaml).toBeInstanceOf(Function);
      expect(instance.expandAll).toBeInstanceOf(Function);
      expect(instance.destroy).toBeInstanceOf(Function);
    });
  });

  describe('Full Document Workflow', () => {
    const complexYaml = `
title: Complex Document
description: |
  # Main Document
  
  This is a **complex** document with multiple content types.

sections:
  - title: Markdown Section
    description: |
      ```markdown
      ## Markdown Header
      
      - List item 1
      - List item 2
      ```
  
  - title: Code Section
    description: |
      ```javascript
      function example() {
        return "Hello World";
      }
      ```
  
  - title: Data Section
    description:
      type: yaml
      content:
        users:
          - name: John
            age: 30
          - name: Jane
            age: 25

  - title: Nested Section
    description: Parent section
    subsections:
      - title: Deep Child
        description: Deep content
        subsections:
          - title: Deeper Child
            description: Even deeper
`;

    test('should load and render complex document', async () => {
      let loadCallback = false;
      
      instance = TreeScribe.create({
        dom: container,
        yamlContent: complexYaml,
        onLoad: () => { loadCallback = true; }
      });
      
      // Wait for async rendering
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(loadCallback).toBe(true);
      
      // Check structure is rendered
      const nodes = container.querySelectorAll('.tree-node');
      expect(nodes.length).toBeGreaterThan(0);
      
      // Check markdown is rendered
      const markdownContent = container.querySelector('.markdown-content');
      expect(markdownContent).toBeTruthy();
      
      // Check YAML is rendered
      const yamlContent = container.querySelector('.yaml-content');
      expect(yamlContent).toBeTruthy();
    });

    test('should handle folding operations', async () => {
      instance = TreeScribe.create({
        dom: container,
        yamlContent: complexYaml
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Test expand all
      instance.expandAll();
      const expandedNodes = container.querySelectorAll('.tree-node[aria-expanded="true"]');
      expect(expandedNodes.length).toBeGreaterThan(0);
      
      // Test collapse all
      instance.collapseAll();
      const collapsedNodes = container.querySelectorAll('.tree-node[aria-expanded="false"]');
      expect(collapsedNodes.length).toBeGreaterThan(0);
    });

    test('should handle search operations', async () => {
      let searchCallback = null;
      
      instance = TreeScribe.create({
        dom: container,
        yamlContent: complexYaml,
        onSearch: (query, results) => {
          searchCallback = { query, results };
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const results = instance.searchContent('markdown');
      expect(results.length).toBeGreaterThan(0);
      expect(searchCallback).toBeTruthy();
      expect(searchCallback.query).toBe('markdown');
    });
  });

  describe('Plugin System Integration', () => {
    class TestRenderer {
      getSupportedTypes() {
        return ['test'];
      }
      
      render(content) {
        const div = document.createElement('div');
        div.className = 'test-renderer';
        div.textContent = `Test: ${content}`;
        return div;
      }
    }

    test('should load and use custom renderer', async () => {
      instance = TreeScribe.create({
        dom: container,
        plugins: [{
          constructor: TestRenderer
        }],
        yamlContent: `
title: Plugin Test
sections:
  - title: Custom Content
    description:
      type: test
      content: "Custom content"
`
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const testRenderer = container.querySelector('.test-renderer');
      expect(testRenderer).toBeTruthy();
      expect(testRenderer.textContent).toContain('Custom content');
    });
  });

  describe('Keyboard Navigation', () => {
    test('should handle keyboard events', async () => {
      instance = TreeScribe.create({
        dom: container,
        keyboardNavigation: true,
        yamlContent: `
title: Keyboard Test
sections:
  - title: Node 1
  - title: Node 2
`
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Focus first node
      const firstNode = container.querySelector('.tree-node');
      firstNode.focus();
      
      // Simulate arrow down
      const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      container.dispatchEvent(keyEvent);
      
      // Check focus moved
      const focusedNode = container.querySelector('.tree-node.focused');
      expect(focusedNode).toBeTruthy();
    });
  });
});
```

### Performance Testing

```javascript
// test/components/tree-scribe/performance.test.js
describe('TreeScribe Performance', () => {
  test('should handle large documents efficiently', async () => {
    // Generate large YAML document
    const generateLargeYaml = (depth, breadth) => {
      let yaml = 'title: Large Document\ndescription: Root content\nsections:\n';
      
      const generateLevel = (currentDepth, maxDepth) => {
        if (currentDepth >= maxDepth) return '';
        
        let level = '';
        for (let i = 0; i < breadth; i++) {
          level += `  - title: Node ${currentDepth}-${i}\n`;
          level += `    description: Content for node ${currentDepth}-${i}\n`;
          if (currentDepth < maxDepth - 1) {
            level += '    subsections:\n';
            level += generateLevel(currentDepth + 1, maxDepth)
              .split('\n')
              .map(line => '      ' + line)
              .join('\n');
          }
        }
        return level;
      };
      
      return yaml + generateLevel(0, depth);
    };

    const largeYaml = generateLargeYaml(5, 10); // 5 levels, 10 nodes per level
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    const startTime = performance.now();
    
    const instance = TreeScribe.create({
      dom: container,
      yamlContent: largeYaml
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    // Should load within reasonable time (adjust threshold as needed)
    expect(loadTime).toBeLessThan(1000); // 1 second
    
    // Check memory usage isn't excessive
    const nodes = container.querySelectorAll('.tree-node');
    expect(nodes.length).toBeGreaterThan(0);
    
    instance.destroy();
    container.remove();
  });

  test('should handle rapid state changes efficiently', async () => {
    const yaml = `
title: State Test
sections:
  - title: A
  - title: B
  - title: C
`;
    
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    const instance = TreeScribe.create({
      dom: container,
      yamlContent: yaml
    });
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const startTime = performance.now();
    
    // Rapid expand/collapse operations
    for (let i = 0; i < 100; i++) {
      instance.expandAll();
      instance.collapseAll();
    }
    
    const endTime = performance.now();
    const operationTime = endTime - startTime;
    
    // Should handle rapid operations efficiently
    expect(operationTime).toBeLessThan(2000); // 2 seconds for 200 operations
    
    instance.destroy();
    container.remove();
  });
});
```

---

## Performance & Optimization

### Virtual Scrolling Implementation

For large document trees, TreeScribe implements virtual scrolling to maintain smooth performance:

```javascript
class VirtualScrollManager {
  constructor(container, itemHeight = 40) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.viewportHeight = container.clientHeight;
    this.scrollTop = 0;
    this.totalItems = 0;
    this.visibleItems = [];
    this.buffer = 5; // Extra items to render for smooth scrolling
    
    this.setupScrolling();
  }

  setupScrolling() {
    this.container.addEventListener('scroll', () => {
      this.scrollTop = this.container.scrollTop;
      this.updateVisibleItems();
    });
    
    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      this.viewportHeight = this.container.clientHeight;
      this.updateVisibleItems();
    });
    resizeObserver.observe(this.container);
  }

  updateVisibleItems() {
    const startIndex = Math.max(0, 
      Math.floor(this.scrollTop / this.itemHeight) - this.buffer
    );
    const endIndex = Math.min(this.totalItems,
      Math.ceil((this.scrollTop + this.viewportHeight) / this.itemHeight) + this.buffer
    );
    
    this.visibleItems = { startIndex, endIndex };
    this.onVisibleItemsChange?.(this.visibleItems);
  }

  setTotalItems(count) {
    this.totalItems = count;
    this.container.style.height = `${count * this.itemHeight}px`;
    this.updateVisibleItems();
  }

  scrollToItem(index) {
    const targetScroll = index * this.itemHeight;
    this.container.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  }
}
```

### Memory Management

```javascript
class MemoryManager {
  constructor(maxCacheSize = 1000) {
    this.maxCacheSize = maxCacheSize;
    this.nodeCache = new Map();
    this.renderCache = new Map();
    this.accessOrder = [];
  }

  cacheNode(nodeId, nodeData) {
    if (this.nodeCache.size >= this.maxCacheSize) {
      this.evictLeastRecent();
    }
    
    this.nodeCache.set(nodeId, nodeData);
    this.updateAccessOrder(nodeId);
  }

  getCachedNode(nodeId) {
    const node = this.nodeCache.get(nodeId);
    if (node) {
      this.updateAccessOrder(nodeId);
    }
    return node;
  }

  cacheRenderedContent(nodeId, element) {
    // Clone element to avoid DOM references
    const cloned = element.cloneNode(true);
    this.renderCache.set(nodeId, cloned);
    this.updateAccessOrder(`render_${nodeId}`);
  }

  evictLeastRecent() {
    if (this.accessOrder.length === 0) return;
    
    const leastRecent = this.accessOrder.shift();
    if (leastRecent.startsWith('render_')) {
      this.renderCache.delete(leastRecent.substring(7));
    } else {
      this.nodeCache.delete(leastRecent);
    }
  }

  updateAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  clear() {
    this.nodeCache.clear();
    this.renderCache.clear();
    this.accessOrder = [];
  }
}
```

### Lazy Loading Strategy

```javascript
class LazyLoadManager {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.loadingNodes = new Set();
    this.loadedNodes = new Set();
  }

  shouldLoadNode(nodeId) {
    return !this.loadedNodes.has(nodeId) && 
           !this.loadingNodes.has(nodeId);
  }

  async loadNodeContent(nodeId) {
    if (!this.shouldLoadNode(nodeId)) return;
    
    this.loadingNodes.add(nodeId);
    
    try {
      const node = this.model.getNode(nodeId);
      if (!node) return;
      
      // Simulate async content loading (e.g., from URL)
      if (node.contentUrl) {
        const content = await this.fetchContent(node.contentUrl);
        node.content = content;
        node.contentType = this.detectContentType(content);
      }
      
      // Render the loaded content
      this.view.renderNode(nodeId);
      this.loadedNodes.add(nodeId);
      
    } catch (error) {
      console.error(`Failed to load content for node ${nodeId}:`, error);
    } finally {
      this.loadingNodes.delete(nodeId);
    }
  }

  async fetchContent(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.text();
  }

  detectContentType(content) {
    // Content type detection logic
    if (content.startsWith('```')) {
      const match = content.match(/^```(\w+)/);
      return match ? match[1] : 'plaintext';
    }
    return 'plaintext';
  }
}
```

### Bundle Size Optimization

```javascript
// Dynamic imports for heavy dependencies
class OptimizedRendererRegistry extends RendererRegistry {
  async getRenderer(type) {
    let renderer = this.renderers.get(type);
    
    if (!renderer) {
      // Lazy load renderer if not available
      renderer = await this.loadRendererDynamically(type);
    }
    
    return renderer || this.renderers.get(this.defaultRenderer);
  }

  async loadRendererDynamically(type) {
    try {
      switch (type) {
        case 'markdown':
          const { MarkdownRenderer } = await import('./renderers/MarkdownRenderer.js');
          const mdRenderer = new MarkdownRenderer();
          this.registerRenderer(type, mdRenderer);
          return mdRenderer;
          
        case 'chart':
          const { ChartRenderer } = await import('./renderers/ChartRenderer.js');
          const chartRenderer = new ChartRenderer();
          this.registerRenderer(type, chartRenderer);
          return chartRenderer;
          
        default:
          return null;
      }
    } catch (error) {
      console.error(`Failed to dynamically load renderer for ${type}:`, error);
      return null;
    }
  }
}
```

---

## Accessibility & UX Guidelines

### WCAG Compliance Implementation

```javascript
class AccessibilityManager {
  constructor(view) {
    this.view = view;
    this.announcer = this.createScreenReaderAnnouncer();
    this.focusManager = new FocusManager();
  }

  createScreenReaderAnnouncer() {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(announcer);
    return announcer;
  }

  announce(message) {
    this.announcer.textContent = message;
    setTimeout(() => {
      this.announcer.textContent = '';
    }, 1000);
  }

  setupNodeAccessibility(nodeElement, node) {
    // ARIA attributes
    nodeElement.setAttribute('role', 'treeitem');
    nodeElement.setAttribute('aria-expanded', node.state.expanded);
    nodeElement.setAttribute('aria-level', node.getDepth() + 1);
    nodeElement.setAttribute('aria-labelledby', `node-title-${node.id}`);
    
    // Keyboard interaction
    nodeElement.setAttribute('tabindex', node.isRoot() ? '0' : '-1');
    
    // Screen reader descriptions
    if (node.content) {
      nodeElement.setAttribute('aria-describedby', `node-content-${node.id}`);
    }
    
    // Handle toggle announcements
    const toggle = nodeElement.querySelector('.node-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const expanded = !node.state.expanded;
        const message = expanded ? 
          `Expanded ${node.title}` : 
          `Collapsed ${node.title}`;
        this.announce(message);
      });
    }
  }

  setupTreeAccessibility(treeContainer) {
    treeContainer.setAttribute('role', 'tree');
    treeContainer.setAttribute('aria-label', 'Document tree');
    
    // Multi-selection support
    treeContainer.setAttribute('aria-multiselectable', 'false');
    
    // Keyboard navigation instructions
    const instructions = document.createElement('div');
    instructions.id = 'tree-instructions';
    instructions.className = 'sr-only';
    instructions.textContent = `
      Use arrow keys to navigate, Enter or Space to expand/collapse,
      Home to go to first item, End to go to last item.
    `;
    treeContainer.parentElement.insertBefore(instructions, treeContainer);
    treeContainer.setAttribute('aria-describedby', 'tree-instructions');
  }
}
```

### Focus Management

```javascript
class FocusManager {
  constructor() {
    this.focusedElement = null;
    this.focusHistory = [];
  }

  setFocus(element, announce = true) {
    if (this.focusedElement) {
      this.focusedElement.setAttribute('tabindex', '-1');
      this.focusedElement.classList.remove('focused');
    }
    
    this.focusedElement = element;
    element.setAttribute('tabindex', '0');
    element.classList.add('focused');
    element.focus();
    
    // Ensure element is visible
    this.ensureVisible(element);
    
    if (announce) {
      this.announceCurrentFocus();
    }
  }

  ensureVisible(element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest'
    });
  }

  announceCurrentFocus() {
    if (!this.focusedElement) return;
    
    const nodeId = this.focusedElement.getAttribute('data-node-id');
    const title = this.focusedElement.querySelector('.node-title')?.textContent;
    const level = this.focusedElement.getAttribute('aria-level');
    const expanded = this.focusedElement.getAttribute('aria-expanded');
    
    let announcement = `${title}, level ${level}`;
    if (expanded === 'true') {
      announcement += ', expanded';
    } else if (expanded === 'false') {
      announcement += ', collapsed';
    }
    
    this.announce(announcement);
  }

  trapFocus(container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    container.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    });
  }
}
```

### Responsive Design

```css
/* TreeScribe responsive styles */
.tree-scribe {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Mobile-first approach */
@media (max-width: 768px) {
  .tree-scribe-header {
    padding: 10px;
  }
  
  .controls {
    flex-direction: column;
    gap: 8px;
  }
  
  .search-input {
    width: 100%;
    font-size: 16px; /* Prevent zoom on iOS */
  }
  
  .tree-node {
    padding: 12px 8px;
    touch-action: manipulation;
  }
  
  .node-toggle {
    width: 44px;
    height: 44px;
    min-width: 44px; /* Minimum touch target */
  }
  
  .node-content {
    font-size: 14px;
    line-height: 1.5;
  }
}

@media (min-width: 769px) {
  .tree-scribe-header {
    padding: 15px 20px;
  }
  
  .controls {
    flex-direction: row;
    gap: 12px;
    align-items: center;
  }
  
  .tree-node {
    padding: 8px 12px;
  }
  
  .node-toggle {
    width: 20px;
    height: 20px;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .tree-node {
    border: 2px solid;
  }
  
  .node-toggle {
    border: 2px solid;
    background: Canvas;
    color: CanvasText;
  }
  
  .focused {
    outline: 3px solid Highlight;
    outline-offset: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .tree-node,
  .node-children {
    transition: none;
  }
  
  .focused {
    scroll-behavior: auto;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .tree-scribe.light {
    /* Light theme forced, no changes */
  }
  
  .tree-scribe:not(.light):not(.dark),
  .tree-scribe.dark {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --text-primary: #ffffff;
    --text-secondary: #b3b3b3;
    --border-color: #404040;
    --accent-color: #4a9eff;
  }
}
```

---

## Example Implementations

### Basic Usage Example

```javascript
// Basic TreeScribe initialization
const basicExample = TreeScribe.create({
  dom: document.getElementById('tree-container'),
  theme: 'light',
  yamlContent: `
title: Quick Start Guide
description: |
  # Welcome to TreeScribe
  
  This example shows basic TreeScribe usage with simple content.

sections:
  - title: Installation
    description: |
      ```bash
      npm install tree-scribe
      ```
  
  - title: Basic Usage
    description: |
      ```javascript
      const tree = TreeScribe.create({
        dom: container,
        yamlContent: myYamlContent
      });
      ```
  
  - title: Advanced Features
    description: Learn about folding, search, and custom renderers
    subsections:
      - title: Folding
        description: Control document structure visibility
      
      - title: Search
        description: Full-text search with highlighting
`,
  
  onLoad: (nodeCount) => {
    console.log(`Loaded document with ${nodeCount} nodes`);
  }
});
```

### Advanced Folding Example

```javascript
// Advanced folding control example
const foldingExample = TreeScribe.create({
  dom: document.getElementById('advanced-container'),
  initialDepth: 1, // Start collapsed
  
  yamlContent: `
title: Folding Demo
sections:
  - title: Level 1A
    sections:
      - title: Level 2A
        sections:
          - title: Level 3A
            description: Deep content A
          - title: Level 3B
            description: Deep content B
      - title: Level 2B
        description: Level 2 content
  - title: Level 1B
    description: Level 1 content
`,

  onNodeToggle: (nodeId, expanded) => {
    console.log(`Node ${nodeId} ${expanded ? 'expanded' : 'collapsed'}`);
  }
});

// Programmatic folding control
document.getElementById('expand-all').addEventListener('click', () => {
  foldingExample.expandAll();
});

document.getElementById('collapse-all').addEventListener('click', () => {
  foldingExample.collapseAll();
});

document.getElementById('expand-to-depth-2').addEventListener('click', () => {
  foldingExample.expandToDepth(2);
});
```

### Custom Renderer Example

```javascript
// Custom chart renderer implementation
class ChartRenderer extends BaseRenderer {
  constructor(options = {}) {
    super(options);
    this.chartLib = options.chartLib || 'chart.js';
  }

  getSupportedTypes() {
    return ['chart', 'graph'];
  }

  render(content, context = {}) {
    const container = this.createElement('div', {
      class: 'chart-container'
    });

    try {
      const chartConfig = typeof content === 'string' ? 
        JSON.parse(content) : content;
      
      const canvas = this.createElement('canvas', {
        width: chartConfig.width || 400,
        height: chartConfig.height || 300
      });
      
      container.appendChild(canvas);
      this.renderChart(canvas, chartConfig);
      
    } catch (error) {
      container.appendChild(this.renderError(error, content));
    }

    return container;
  }

  async renderChart(canvas, config) {
    // Dynamic import to avoid loading Chart.js unless needed
    const Chart = await import('chart.js/auto');
    
    new Chart.default(canvas, {
      type: config.type || 'bar',
      data: config.data,
      options: {
        responsive: false,
        plugins: {
          title: {
            display: !!config.title,
            text: config.title
          }
        },
        ...config.options
      }
    });
  }
}

// TreeScribe with custom renderer
const chartExample = TreeScribe.create({
  dom: document.getElementById('chart-container'),
  plugins: [{
    constructor: ChartRenderer,
    options: { chartLib: 'chart.js' }
  }],
  
  yamlContent: `
title: Data Visualization
sections:
  - title: Sales Chart
    description:
      type: chart
      data:
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May']
        datasets:
          - label: Sales
            data: [12, 19, 3, 5, 2]
            backgroundColor: 'rgba(54, 162, 235, 0.2)'
            borderColor: 'rgba(54, 162, 235, 1)'
            borderWidth: 1
      type: bar
      title: "Monthly Sales Data"
`
});
```

### Testing Pattern Example

```javascript
// Example of comprehensive TreeScribe testing
describe('TreeScribe Custom Implementation', () => {
  let container;
  let instance;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (instance) instance.destroy();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  test('should handle custom content workflow', async () => {
    // Track events
    const events = [];
    
    instance = TreeScribe.create({
      dom: container,
      yamlContent: `
title: Test Document
sections:
  - title: Section 1
    description: Content 1
  - title: Section 2
    description: Content 2
`,
      onLoad: (count) => events.push(['load', count]),
      onNodeToggle: (nodeId, expanded) => events.push(['toggle', nodeId, expanded]),
      onSearch: (query, results) => events.push(['search', query, results.length])
    });

    // Wait for initial load
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify load event
    expect(events.some(e => e[0] === 'load')).toBe(true);
    
    // Test expansion
    const toggleButton = container.querySelector('.node-toggle');
    if (toggleButton) {
      toggleButton.click();
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(events.some(e => e[0] === 'toggle')).toBe(true);
    }
    
    // Test search
    const results = instance.searchContent('Section');
    expect(results.length).toBeGreaterThan(0);
    expect(events.some(e => e[0] === 'search')).toBe(true);
    
    // Test programmatic API
    instance.expandAll();
    instance.collapseAll();
    
    const state = instance.getFoldingState();
    expect(state).toBeDefined();
    expect(state instanceof Map).toBe(true);
  });
});
```

---

## Architectural Changes & Evolution

### Directory Structure Reorganization

**Original Flat Structure:**
```
src/components/tree-scribe/
├── TreeScribe.js
├── TreeScribeModel.js
├── TreeScribeView.js
├── TreeScribeViewModel.js
├── FoldingManager.js
├── InteractionManager.js
├── SearchEngine.js
├── ...
```

**Evolved Hierarchical Structure:**
```
src/components/tree-scribe/
├── TreeScribe.js (main entry point)
├── core/
│   ├── model/
│   │   ├── TreeScribeModel.js
│   │   ├── TreeNode.js
│   │   └── YamlProcessor.js
│   ├── view/
│   │   ├── TreeScribeView.js
│   │   └── NodeRenderer.js
│   └── viewmodel/
│       └── TreeScribeViewModel.js
├── features/
│   ├── interaction/
│   │   ├── FoldingManager.js
│   │   ├── InteractionManager.js
│   │   └── KeyboardNavigation.js
│   ├── search/
│   │   ├── SearchEngine.js
│   │   └── AdvancedSearchManager.js
│   ├── rendering/
│   │   ├── RendererRegistry.js
│   │   └── renderers/
│   ├── performance/
│   │   ├── VirtualScrollManager.js
│   │   └── MemoryManager.js
│   ├── accessibility/
│   │   └── AccessibilityManager.js
│   └── export/
│       └── ExportManager.js
└── docs/
    ├── design.md
    ├── development-plan.md
    ├── usage-examples.md
    └── troubleshooting.md
```

**Rationale**: The hierarchical structure provides better organization, clear separation of concerns, and easier maintenance as the component grew in complexity.

### Constructor Pattern Evolution

**Original Object Parameter Pattern:**
```javascript
// Old pattern used throughout
this.foldingManager = new FoldingManager({
  model: this.model,
  view: this.view
});

this.interactionManager = new InteractionManager({
  treeView: this.view,
  nodeRenderer: this.nodeRenderer
});
```

**Evolved Positional Parameter Pattern:**
```javascript
// New pattern for better compatibility
this.foldingManager = new FoldingManager(this.model);

this.interactionManager = new InteractionManager(
  this.view,
  this.view.nodeRenderer
);

this.keyboardNavigation = new KeyboardNavigation(
  this.view,
  this.interactionManager,
  {
    searchManager: this.searchManager,
    accessibilityManager: this.accessibilityManager
  }
);
```

**Rationale**: Positional parameters provide clearer contracts and better IDE support, while still allowing options objects for complex configurations.

### API Consistency Improvements

**Added Alias Methods for Backward Compatibility:**
```javascript
// Export methods with different return types
exportHTML(options = {}) {
  // Returns JSON string for actual export/download
  return this.exportManager.exportHTML(tree, options);
}

exportJson(options = {}) {
  // Returns JavaScript object for programmatic use
  return this.model.exportJson();
}

// Search alias
searchContent(query, options = {}) {
  return this.search(query, options);
}
```

**Async/Await Pattern Standardization:**
All methods that perform asynchronous operations now properly return Promises and support await:
```javascript
async loadYaml(content) {
  // Properly handles both string content and URL fetching
  // Returns { success: boolean, nodeCount?: number, error?: string }
}
```

### Performance Architecture Decisions

**Virtual Scrolling Integration:**
```javascript
// Fixed API mismatch
// Old (incorrect): this.virtualScrollManager.setItems(items)
// New (correct): this.virtualScrollManager.updateTotalItems(nodeCount)
```

**Memory Management Strategy:**
- Node indexing with O(1) lookup via Map-based caching
- Lazy loading for off-screen content in virtual scrolling
- Automatic cleanup in destroy() methods
- Configurable cache limits

### Testing Infrastructure Evolution

**Test Organization:**
```
test/components/tree-scribe/
├── unit/
│   ├── core/
│   ├── features/
│   └── integration/
├── integration/
├── quality-assurance/
│   ├── performance/
│   └── error-handling/
└── examples/
```

**Async Test Pattern:**
All tests involving `loadYaml()` were updated to properly handle async operations:
```javascript
// Before
test('should load YAML', () => {
  instance.loadYaml(yamlContent); // Missing await
  expect(container.querySelector('.tree-node')).toBeDefined();
});

// After
test('should load YAML', async () => {
  await instance.loadYaml(yamlContent); // Proper async handling
  expect(container.querySelector('.tree-node')).toBeDefined();
});
```

### Component Lifecycle Management

**Enhanced Destroy Pattern:**
```javascript
destroy() {
  if (this.destroyed) return; // Idempotent
  
  // Notify before destroy
  if (this.umbilical.onDestroy) {
    this.umbilical.onDestroy(this);
  }
  
  // Cleanup subsystems in dependency order
  if (this.virtualScrollManager) this.virtualScrollManager.destroy();
  if (this.keyboardNavigation) this.keyboardNavigation.destroy();
  if (this.interactionManager) this.interactionManager.destroy();
  if (this.foldingManager) this.foldingManager.destroy();
  if (this.accessibilityManager) this.accessibilityManager.destroy();
  if (this.searchManager) this.searchManager.destroy();
  if (this.searchEngine) this.searchEngine.destroy();
  if (this.exportManager) this.exportManager.destroy();
  if (this.memoryManager) this.memoryManager.destroy();
  
  // Cleanup MVVM
  if (this.viewModel) this.viewModel.destroy();
  if (this.view) this.view.destroy();
  if (this.model) this.model.destroy();
  
  this.destroyed = true;
}
```

### Documentation Architecture

**Comprehensive Documentation Suite:**
- **API Documentation**: Complete JSDoc comments with examples
- **Usage Guide**: Real-world examples and patterns
- **Troubleshooting Guide**: Common issues and solutions
- **Design Document**: Architecture and decision rationale
- **Development Plan**: Implementation tracking and milestones

---

## Conclusion

TreeScribe represents a sophisticated implementation of the umbilical component protocol, demonstrating how complex, feature-rich components can maintain clean architecture while providing real-world utility. The MVVM pattern ensures maintainable code, while the plugin system enables unlimited extensibility.

This design document provides the complete roadmap for implementing TreeScribe as a production-ready component that showcases the full potential of the umbilical protocol system. The comprehensive testing strategy ensures reliability, while the accessibility focus makes the component usable by all users.

TreeScribe will serve as both a practical tool for document management and an architectural reference for building sophisticated umbilical components that combine power with simplicity.