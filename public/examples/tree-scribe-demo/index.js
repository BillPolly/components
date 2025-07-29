/**
 * TreeScribeDemo - A complete demo application as an umbilical component
 * Demonstrates the full TreeScribe functionality with a comprehensive UI
 */

import { TreeScribeInstance } from '/src/components/tree-scribe/TreeScribe.js';
import { UmbilicalUtils } from '/src/umbilical/index.js';

export const TreeScribeDemo = {
  create(umbilical) {
    // 1. Introspection mode
    if (umbilical.describe) {
      const requirements = UmbilicalUtils.createRequirements();
      requirements.add('dom', 'HTMLElement', 'Parent DOM element');
      umbilical.describe(requirements);
      return;
    }

    // 2. Validation mode
    if (umbilical.validate) {
      const checks = {
        hasDomElement: !!(umbilical.dom && umbilical.dom.nodeType === Node.ELEMENT_NODE)
      };
      return umbilical.validate(checks);
    }

    // 3. Instance creation mode
    UmbilicalUtils.validateCapabilities(umbilical, ['dom'], 'TreeScribeDemo');
    
    return new TreeScribeDemoInstance(umbilical);
  }
};

class TreeScribeDemoInstance {
  constructor(umbilical) {
    this.umbilical = umbilical;
    this._destroyed = false;
    this.treeScribe = null;
    this.currentDocument = 'simple-guide';
    this.searchTimeout = null;
    
    // Create the demo UI
    this._createDemoUI();
    this._initializeTreeScribe();
    
    if (umbilical.onMount) {
      umbilical.onMount(this);
    }
  }
  
  _createDemoUI() {
    // Create the main container
    this.container = document.createElement('div');
    this.container.className = 'tree-scribe-demo';
    this.container.innerHTML = `
      <div class="demo-header">
        <h1>🌳 TreeScribe YAML Document Viewer</h1>
        <p>Interactive YAML document viewer with advanced features and accessibility</p>
      </div>
      
      <div class="demo-toolbar">
        <div class="toolbar-group">
          <label>Document:</label>
          <select id="documentSelect" class="btn-select">
            <option value="simple-guide">📘 Simple Guide</option>
            <option value="complex-structure">🏢 Complex Structure</option>
            <option value="markdown-demo">📝 Markdown Demo</option>
            <option value="data-showcase">📊 Data Showcase</option>
            <option value="accessibility-demo">♿ Accessibility Demo</option>
          </select>
        </div>
        
        <div class="toolbar-group">
          <label>Theme:</label>
          <select id="themeSelect" class="btn-select">
            <option value="light">☀️ Light</option>
            <option value="dark">🌙 Dark</option>
          </select>
        </div>
        
        <div class="toolbar-group">
          <input type="text" id="searchInput" placeholder="Search content..." class="search-input">
          <button id="clearSearchBtn" class="btn secondary">Clear</button>
        </div>
        
        <div class="toolbar-group">
          <button id="expandAllBtn" class="btn">Expand All</button>
          <button id="collapseAllBtn" class="btn">Collapse All</button>
        </div>
        
        <div class="toolbar-group">
          <button id="exportHtmlBtn" class="btn">Export HTML</button>
          <button id="exportJsonBtn" class="btn">Export JSON</button>
        </div>
        
        <div class="toolbar-group">
          <input type="file" id="fileInput" accept=".yaml,.yml,.txt" style="display: none;">
          <button id="loadFileBtn" class="btn secondary">Load File</button>
          <button id="reloadBtn" class="btn secondary">Reload</button>
        </div>
      </div>
      
      <div class="demo-content">
        <div class="demo-sidebar">
          <div class="status-panel">
            <h4>Document Status</h4>
            <div class="status-item">Nodes: <span id="nodeCount">0</span></div>
            <div class="status-item">Load Time: <span id="loadTime">0ms</span></div>
            <div class="status-item">Theme: <span id="currentTheme">light</span></div>
            <div class="status-item">Search Results: <span id="searchResults">0</span></div>
          </div>
          
          <div class="features-panel">
            <h4>Features</h4>
            <div class="feature-item">
              <label>
                <input type="checkbox" id="enableSearch" checked> Search
              </label>
            </div>
            <div class="feature-item">
              <label>
                <input type="checkbox" id="enableFolding" checked> Folding
              </label>
            </div>
            <div class="feature-item">
              <label>
                <input type="checkbox" id="enableKeyboard" checked> Keyboard Nav
              </label>
            </div>
            <div class="feature-item">
              <label>
                <input type="checkbox" id="enableVirtualScroll" checked> Virtual Scroll
              </label>
            </div>
            <div class="feature-item">
              <label>
                <input type="checkbox" id="enableAccessibility" checked> Accessibility
              </label>
            </div>
          </div>
          
          <div class="log-panel">
            <h4>Event Log</h4>
            <div id="eventLog" class="event-log"></div>
            <button id="clearLogBtn" class="btn secondary small">Clear Log</button>
          </div>
        </div>
        
        <div class="demo-main">
          <div class="tree-scribe-container">
            <div id="treeScribeContainer" class="tree-container"></div>
          </div>
        </div>
      </div>
      
      <div class="demo-footer">
        <div class="footer-stats">
          <span>TreeScribe v1.0.0</span> • 
          <span id="performanceInfo">Performance: Ready</span> • 
          <span>Built with Umbilical Component Protocol</span>
        </div>
      </div>
    `;
    
    // Add styles
    this._addStyles();
    
    // Append to umbilical DOM
    this.umbilical.dom.appendChild(this.container);
  }
  
  _addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .tree-scribe-demo {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #f8f9fa;
      }
      
      .demo-header {
        padding: 20px 30px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        text-align: center;
      }
      
      .demo-header h1 {
        margin: 0 0 8px 0;
        font-size: 28px;
        font-weight: 600;
      }
      
      .demo-header p {
        margin: 0;
        opacity: 0.9;
        font-size: 16px;
      }
      
      .demo-toolbar {
        display: flex;
        gap: 15px;
        padding: 15px 20px;
        background: #ffffff;
        border-bottom: 1px solid #e9ecef;
        flex-wrap: wrap;
        align-items: center;
      }
      
      .toolbar-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .toolbar-group label {
        font-weight: 500;
        color: #495057;
        font-size: 14px;
      }
      
      .btn, .btn-select, .search-input {
        padding: 8px 16px;
        border: 1px solid #ced4da;
        border-radius: 6px;
        font-size: 14px;
        background: white;
        color: #495057;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .btn:hover {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-color: #667eea;
        transform: translateY(-1px);
      }
      
      .btn.secondary {
        background: #6c757d;
        color: white;
        border-color: #5a6268;
      }
      
      .btn.secondary:hover {
        background: #545b62;
        transform: translateY(-1px);
      }
      
      .btn.small {
        padding: 4px 8px;
        font-size: 12px;
      }
      
      .search-input {
        width: 200px;
      }
      
      .search-input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
      }
      
      .demo-content {
        flex: 1;
        display: flex;
        min-height: 0;
      }
      
      .demo-sidebar {
        width: 280px;
        background: #ffffff;
        border-right: 1px solid #e9ecef;
        padding: 20px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      
      .status-panel, .features-panel, .log-panel {
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 15px;
        background: #f8f9fa;
      }
      
      .status-panel h4, .features-panel h4, .log-panel h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: #2c3e50;
      }
      
      .status-item {
        margin: 8px 0;
        font-size: 13px;
        color: #6c757d;
        display: flex;
        justify-content: space-between;
      }
      
      .status-item span {
        font-weight: 500;
        color: #495057;
      }
      
      .feature-item {
        margin: 8px 0;
      }
      
      .feature-item label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #495057;
        cursor: pointer;
      }
      
      .event-log {
        height: 150px;
        overflow-y: auto;
        font-size: 11px;
        font-family: monospace;
        background: #ffffff;
        border: 1px solid #e9ecef;
        border-radius: 4px;
        padding: 8px;
        margin-bottom: 10px;
      }
      
      .log-entry {
        margin: 2px 0;
        padding: 2px 4px;
        border-radius: 2px;
      }
      
      .log-entry.info {
        color: #0f5132;
      }
      
      .log-entry.error {
        background: #f8d7da;
        color: #721c24;
      }
      
      .log-entry.success {
        background: #d1edff;
        color: #055160;
      }
      
      .demo-main {
        flex: 1;
        padding: 20px;
        overflow: hidden;
      }
      
      .tree-scribe-container {
        width: 100%;
        height: 100%;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .tree-container {
        width: 100%;
        height: 100%;
      }
      
      /* Tree node styles */
      .tree-node {
        margin: 4px 0;
        user-select: none;
      }
      
      .node-header {
        display: flex;
        align-items: center;
        padding: 4px 0;
        cursor: pointer;
      }
      
      .node-header:hover {
        background-color: rgba(102, 126, 234, 0.1);
        border-radius: 4px;
      }
      
      .node-arrow {
        display: inline-block;
        width: 20px;
        text-align: center;
        font-size: 12px;
        color: #666;
        cursor: pointer;
        transition: transform 0.2s ease;
        flex-shrink: 0;
      }
      
      .node-arrow.expanded {
        transform: rotate(90deg);
      }
      
      .node-arrow:hover {
        color: #667eea;
      }
      
      .node-title {
        font-weight: 500;
        color: #2c3e50;
        padding-left: 4px;
        flex-grow: 1;
      }
      
      .node-content {
        margin-left: 24px;
        padding: 8px 0;
      }
      
      .node-children {
        margin-left: 20px;
      }
      
      .tree-node.collapsed .node-content {
        display: none;
      }
      
      .tree-node.collapsed .node-children {
        display: none;
      }
      
      /* Dark theme adjustments */
      .tree-scribe-theme-dark .node-title {
        color: #e1e4e8;
      }
      
      .tree-scribe-theme-dark .node-arrow {
        color: #8b949e;
      }
      
      .tree-scribe-theme-dark .node-header:hover {
        background-color: rgba(110, 118, 129, 0.2);
      }
      
      .demo-footer {
        background: #2c3e50;
        color: white;
        padding: 12px 20px;
        text-align: center;
      }
      
      .footer-stats {
        font-size: 13px;
        opacity: 0.9;
      }
      
      .footer-stats span {
        margin: 0 5px;
      }
      
      /* Markdown styles */
      .markdown-content {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #333;
      }
      
      .markdown-content h1, .markdown-content h2, .markdown-content h3, 
      .markdown-content h4, .markdown-content h5, .markdown-content h6 {
        margin-top: 1em;
        margin-bottom: 0.5em;
        font-weight: 600;
      }
      
      .markdown-content h1 { font-size: 2em; }
      .markdown-content h2 { font-size: 1.5em; }
      .markdown-content h3 { font-size: 1.25em; }
      
      .markdown-content p {
        margin-bottom: 1em;
      }
      
      .markdown-content a {
        color: #667eea;
        text-decoration: none;
      }
      
      .markdown-content a:hover {
        text-decoration: underline;
      }
      
      .markdown-content code {
        background: #f4f4f4;
        padding: 2px 4px;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
      }
      
      .markdown-content pre {
        background: #f8f8f8;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        padding: 16px;
        overflow-x: auto;
        margin: 1em 0;
      }
      
      .markdown-content pre code {
        background: none;
        padding: 0;
      }
      
      .markdown-content blockquote {
        border-left: 4px solid #dfe2e5;
        padding-left: 1em;
        margin-left: 0;
        color: #6a737d;
      }
      
      .markdown-content ul, .markdown-content ol {
        margin-bottom: 1em;
        padding-left: 2em;
      }
      
      .markdown-content table {
        border-collapse: collapse;
        width: 100%;
        margin: 1em 0;
      }
      
      .markdown-content th, .markdown-content td {
        border: 1px solid #dfe2e5;
        padding: 8px 12px;
      }
      
      .markdown-content th {
        background: #f6f8fa;
        font-weight: 600;
      }
      
      .markdown-content img {
        max-width: 100%;
        height: auto;
      }
      
      .markdown-content .code-container {
        position: relative;
        margin: 1em 0;
      }
      
      .markdown-content .copy-button {
        position: absolute;
        top: 8px;
        right: 8px;
        background: #667eea;
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s;
      }
      
      .markdown-content .code-container:hover .copy-button {
        opacity: 1;
      }
      
      .markdown-content .copy-button:hover {
        background: #764ba2;
      }
      
      /* Dark theme for markdown */
      .tree-scribe-theme-dark .markdown-content {
        color: #e1e4e8;
      }
      
      .tree-scribe-theme-dark .markdown-content code {
        background: #3a3a3a;
        color: #e1e4e8;
      }
      
      .tree-scribe-theme-dark .markdown-content pre {
        background: #2d2d2d;
        border-color: #444;
      }
      
      .tree-scribe-theme-dark .markdown-content blockquote {
        border-color: #444;
        color: #8b949e;
      }
      
      .tree-scribe-theme-dark .markdown-content th {
        background: #3a3a3a;
      }
      
      .tree-scribe-theme-dark .markdown-content th,
      .tree-scribe-theme-dark .markdown-content td {
        border-color: #444;
      }
      
      /* Responsive design */
      @media (max-width: 768px) {
        .demo-content {
          flex-direction: column;
        }
        
        .demo-sidebar {
          width: 100%;
          height: 200px;
        }
        
        .demo-toolbar {
          flex-direction: column;
          align-items: stretch;
        }
        
        .toolbar-group {
          justify-content: space-between;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  _initializeTreeScribe() {
    try {
      const container = this.container.querySelector('#treeScribeContainer');
      
      this.treeScribe = new TreeScribeInstance({
        dom: container,
        theme: 'light',
        enableSearch: true,
        enableFolding: true,
        enableKeyboard: true,
        enableVirtualScroll: true,
        enableAccessibility: true,
        enableExport: true,
        onNodeToggle: (nodeId, expanded) => {
          this._log(`Node ${nodeId} ${expanded ? 'expanded' : 'collapsed'}`, 'info');
        },
        onSearch: (query, resultCount) => {
          this._log(`Search "${query}": ${resultCount} results`, 'info');
          this._updateSearchResults(resultCount);
        },
        onMount: (instance) => {
          this._log('TreeScribe mounted successfully', 'success');
          this._loadDefaultDocument();
        },
        onError: (error) => {
          this._log(`Error: ${error.message}`, 'error');
        }
      });
      
      // Setup event handlers
      this._setupEventHandlers();
      
    } catch (error) {
      this._log(`Initialization error: ${error.message}`, 'error');
    }
  }
  
  _setupEventHandlers() {
    // Document selector
    this.container.querySelector('#documentSelect').addEventListener('change', (e) => {
      this.currentDocument = e.target.value;
      this._loadDocument(this.currentDocument);
    });
    
    // Theme selector
    this.container.querySelector('#themeSelect').addEventListener('change', (e) => {
      if (this.treeScribe) {
        this.treeScribe.setTheme(e.target.value);
        this._updateThemeStatus(e.target.value);
        this._log(`Theme changed to ${e.target.value}`, 'info');
      }
    });
    
    // Search input
    this.container.querySelector('#searchInput').addEventListener('input', (e) => {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        if (this.treeScribe && e.target.value.trim()) {
          this.treeScribe.search(e.target.value.trim());
        } else if (this.treeScribe) {
          this.treeScribe.clearSearch();
          this._updateSearchResults(0);
        }
      }, 300);
    });
    
    // Clear search
    this.container.querySelector('#clearSearchBtn').addEventListener('click', () => {
      const searchInput = this.container.querySelector('#searchInput');
      if (searchInput) {
        searchInput.value = '';
      }
      if (this.treeScribe) {
        this.treeScribe.clearSearch();
        this._updateSearchResults(0);
      }
    });
    
    // Tree controls
    this.container.querySelector('#expandAllBtn').addEventListener('click', () => {
      if (this.treeScribe) {
        this.treeScribe.expandAll();
        this._log('Expanded all nodes', 'info');
      }
    });
    
    this.container.querySelector('#collapseAllBtn').addEventListener('click', () => {
      if (this.treeScribe) {
        this.treeScribe.collapseAll();
        this._log('Collapsed all nodes', 'info');
      }
    });
    
    // Export buttons
    this.container.querySelector('#exportHtmlBtn').addEventListener('click', () => {
      if (this.treeScribe) {
        const html = this.treeScribe.exportHTML();
        if (html) {
          this._downloadFile('treescribe-export.html', html, 'text/html');
          this._log('HTML export downloaded', 'success');
        }
      }
    });
    
    this.container.querySelector('#exportJsonBtn').addEventListener('click', () => {
      if (this.treeScribe) {
        const json = this.treeScribe.exportJson();
        if (json) {
          const jsonStr = JSON.stringify(json, null, 2);
          this._downloadFile('treescribe-export.json', jsonStr, 'application/json');
          this._log('JSON export downloaded', 'success');
        }
      }
    });
    
    // File input
    this.container.querySelector('#loadFileBtn').addEventListener('click', () => {
      this.container.querySelector('#fileInput').click();
    });
    
    this.container.querySelector('#fileInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file && this.treeScribe) {
        try {
          const content = await file.text();
          const startTime = Date.now();
          const result = await this.treeScribe.loadYaml(content);
          const loadTime = Date.now() - startTime;
          
          if (result.success) {
            this._updateStats(result.nodeCount, loadTime);
            this._log(`Loaded file "${file.name}" with ${result.nodeCount} nodes`, 'success');
          } else {
            this._log(`Failed to load file: ${result.error}`, 'error');
          }
        } catch (error) {
          this._log(`File load error: ${error.message}`, 'error');
        }
      }
    });
    
    // Reload button
    this.container.querySelector('#reloadBtn').addEventListener('click', () => {
      this._loadDocument(this.currentDocument);
    });
    
    // Feature toggles (for demonstration - would require recreating TreeScribe)
    ['enableSearch', 'enableFolding', 'enableKeyboard', 'enableVirtualScroll', 'enableAccessibility'].forEach(feature => {
      this.container.querySelector(`#${feature}`).addEventListener('change', (e) => {
        this._log(`${feature} ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
      });
    });
    
    // Clear log button
    this.container.querySelector('#clearLogBtn').addEventListener('click', () => {
      this.container.querySelector('#eventLog').innerHTML = '';
    });
  }
  
  async _loadDefaultDocument() {
    await this._loadDocument(this.currentDocument);
  }
  
  async _loadDocument(documentName) {
    if (!this.treeScribe) return;
    
    try {
      this._log(`Loading document: ${documentName}`, 'info');
      const startTime = Date.now();
      
      let yamlContent = await this._getDocumentContent(documentName);
      
      const result = await this.treeScribe.loadYaml(yamlContent);
      const loadTime = Date.now() - startTime;
      
      if (result.success) {
        this._updateStats(result.nodeCount, loadTime);
        this._log(`Document loaded successfully (${result.nodeCount} nodes, ${loadTime}ms)`, 'success');
      } else {
        this._log(`Failed to load document: ${result.error}`, 'error');
      }
      
    } catch (error) {
      this._log(`Load error: ${error.message}`, 'error');
    }
  }
  
  async _getDocumentContent(documentName) {
    // Try to fetch from the tree-scribe examples directory first
    const documentPaths = {
      'simple-guide': '/examples/tree-scribe/simple-guide.yaml',
      'complex-structure': '/examples/tree-scribe/complex-structure.yaml'
    };
    
    if (documentPaths[documentName]) {
      try {
        const response = await fetch(documentPaths[documentName]);
        if (response.ok) {
          return await response.text();
        }
      } catch (e) {
        // Fall back to inline content
      }
    }
    
    // Fallback to inline YAML content
    const inlineDocuments = {
      'simple-guide': `
title: TreeScribe Quick Start Guide
content: |
  # Welcome to TreeScribe
  
  TreeScribe is a powerful YAML document viewer with advanced features:
  - Interactive tree navigation
  - Full-text search
  - Multiple content renderers
  - Keyboard accessibility
  - Export functionality

children:
  - title: Getting Started
    content: |
      ## Basic Usage
      
      TreeScribe follows the Umbilical Component Protocol:
      
      \`\`\`javascript
      const treeScribe = new TreeScribeInstance({
        dom: container,
        theme: 'light',
        enableSearch: true
      });
      
      await treeScribe.loadYaml(yamlContent);
      \`\`\`
    
    children:
      - title: Installation
        content: |
          ### Installation Steps
          1. Include TreeScribe in your project
          2. Create a container element
          3. Initialize with umbilical object
          4. Load your YAML content
          
      - title: Configuration
        content: |
          ### Configuration Options
          - **theme**: 'light' or 'dark'
          - **enableSearch**: Enable search functionality
          - **enableFolding**: Enable node folding
          - **enableKeyboard**: Enable keyboard navigation
          - **enableAccessibility**: Enable a11y features

  - title: Features
    content: |
      ## Core Features
      
      TreeScribe provides a comprehensive set of features for document viewing.
    
    children:
      - title: Search
        content: |
          ### Search Functionality
          - Full-text search across all content
          - Highlight search results
          - Navigate between results
          - Case-sensitive options
          
      - title: Navigation
        content: |
          ### Tree Navigation
          - Expand/collapse nodes
          - Keyboard navigation
          - Focus management
          - Breadcrumb trails
          
      - title: Export
        content: |
          ### Export Options
          - Export to HTML
          - Export to JSON
          - Include styling
          - Custom formatting

  - title: Examples
    content: |
      ## Usage Examples
      
      Here are some common usage patterns.
    
    children:
      - title: Simple Document
        content: |
          \`\`\`yaml
          title: My Document
          content: This is a simple document
          children:
            - title: Section 1
              content: Content for section 1
          \`\`\`
          
      - title: Complex Structure
        content: |
          \`\`\`yaml
          title: Complex Document
          metadata:
            author: TreeScribe Demo
            version: 1.0
          content: |
            # Advanced Document
            
            This shows complex structures.
          children:
            - title: Data Section
              content:
                type: data
                values: [1, 2, 3, 4, 5]
          \`\`\`

metadata:
  author: "TreeScribe Team"
  version: "1.0.0"
  created: "2024-01-17"
  description: "Quick start guide for TreeScribe"
`,
      
      'complex-structure': `
title: Enterprise Architecture Documentation
content: |
  # Enterprise System Architecture
  
  This document provides a comprehensive overview of our enterprise architecture,
  including microservices, databases, and infrastructure components.

metadata:
  document_type: "architecture"
  classification: "internal"
  version: "2.1.0"
  last_updated: "2024-01-17"
  owner: "Architecture Team"

children:
  - title: System Overview
    content: |
      ## High-Level Architecture
      
      Our enterprise system consists of multiple layers and components
      designed for scalability, reliability, and maintainability.
    
    children:
      - title: Presentation Layer
        content: |
          ### Frontend Applications
          - Web portal (React.js)
          - Mobile app (React Native)
          - Admin dashboard (Vue.js)
          - API documentation (OpenAPI)
        
        children:
          - title: Web Portal
            content: |
              #### Technology Stack
              - Framework: React 18
              - State Management: Redux Toolkit
              - Styling: Tailwind CSS
              - Build Tool: Vite
              - Testing: Jest + React Testing Library
              
              #### Features
              - User authentication
              - Dashboard analytics
              - Real-time notifications
              - Responsive design
            
          - title: Mobile Application
            content: |
              #### React Native Setup
              - Platform: iOS & Android
              - Navigation: React Navigation 6
              - State: Redux Persist
              - Push Notifications: Firebase
              
              #### Key Features
              - Offline capability
              - Biometric authentication
              - Push notifications
              - Deep linking
      
      - title: Application Layer
        content: |
          ### Microservices Architecture
          - API Gateway (Kong)
          - User Service (Node.js)
          - Order Service (Java Spring)
          - Payment Service (Python Flask)
          - Notification Service (Go)
        
        children:
          - title: API Gateway
            content: |
              #### Kong Configuration
              - Rate limiting: 1000 req/min
              - Authentication: JWT + OAuth2
              - Load balancing: Round robin
              - Caching: Redis
              - Monitoring: Prometheus
              
              #### Plugins
              - Authentication
              - Rate limiting
              - CORS handling
              - Request/response transformation
            
          - title: User Service
            content: |
              #### Service Details
              - Runtime: Node.js 18
              - Framework: Express.js
              - Database: PostgreSQL
              - Cache: Redis
              - Queue: RabbitMQ
              
              #### Endpoints
              - POST /users - Create user
              - GET /users/:id - Get user
              - PUT /users/:id - Update user
              - DELETE /users/:id - Delete user
              - GET /users/search - Search users
              
              #### Business Logic
              - User registration
              - Profile management
              - Authentication
              - Authorization
              - Audit logging
            
            children:
              - title: Database Schema
                content: |
                  \`\`\`sql
                  CREATE TABLE users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    first_name VARCHAR(100),
                    last_name VARCHAR(100),
                    role VARCHAR(50) DEFAULT 'user',
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    last_login TIMESTAMP,
                    is_active BOOLEAN DEFAULT true
                  );
                  
                  CREATE INDEX idx_users_email ON users(email);
                  CREATE INDEX idx_users_role ON users(role);
                  CREATE INDEX idx_users_active ON users(is_active);
                  \`\`\`
              
              - title: API Documentation
                content: |
                  #### User API Specification
                  
                  **Create User**
                  \`\`\`
                  POST /api/v1/users
                  Content-Type: application/json
                  
                  {
                    "email": "user@example.com",
                    "password": "securePassword123",
                    "firstName": "John",
                    "lastName": "Doe"
                  }
                  \`\`\`
                  
                  **Response**
                  \`\`\`json
                  {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "email": "user@example.com",
                    "firstName": "John",
                    "lastName": "Doe",
                    "role": "user",
                    "createdAt": "2024-01-17T10:30:00Z"
                  }
                  \`\`\`
          
          - title: Order Service
            content: |
              #### Service Architecture
              - Runtime: Java 17
              - Framework: Spring Boot 3
              - Database: PostgreSQL
              - Message Queue: Apache Kafka
              - Cache: Redis
              
              #### Domain Model
              - Order aggregate
              - Order items
              - Payment information
              - Shipping details
              - Order lifecycle
              
              #### Integration Points
              - User Service (user validation)
              - Payment Service (payment processing)
              - Inventory Service (stock checking)
              - Notification Service (order updates)
            
            children:
              - title: Order Lifecycle
                content: |
                  #### State Machine
                  1. **DRAFT** - Order being created
                  2. **PENDING** - Awaiting payment
                  3. **CONFIRMED** - Payment successful
                  4. **PROCESSING** - Being prepared
                  5. **SHIPPED** - In transit
                  6. **DELIVERED** - Successfully delivered
                  7. **CANCELLED** - Order cancelled
                  8. **REFUNDED** - Payment refunded
                  
                  #### Business Rules
                  - Orders can only be cancelled before shipping
                  - Refunds require manager approval
                  - Inventory is reserved on confirmation
                  - Automatic cancellation after 24h if unpaid
      
      - title: Data Layer
        content: |
          ### Database Architecture
          - Primary: PostgreSQL cluster
          - Cache: Redis cluster
          - Search: Elasticsearch
          - Analytics: ClickHouse
          - Backup: AWS S3
        
        children:
          - title: PostgreSQL Cluster
            content: |
              #### Cluster Configuration
              - Master-slave replication
              - 3 read replicas
              - Automatic failover
              - Connection pooling (PgBouncer)
              - Monitoring (pg_stat_statements)
              
              #### Database Design
              - Normalized schema
              - Proper indexing strategy
              - Partitioning for large tables
              - Regular VACUUM and ANALYZE
              - Point-in-time recovery
            
            children:
              - title: Performance Tuning
                content: |
                  #### Configuration Optimizations
                  \`\`\`
                  shared_buffers = 2GB
                  effective_cache_size = 6GB
                  work_mem = 16MB
                  maintenance_work_mem = 256MB
                  max_connections = 100
                  checkpoint_segments = 32
                  wal_buffers = 16MB
                  \`\`\`
                  
                  #### Query Optimization
                  - Use EXPLAIN ANALYZE for slow queries
                  - Create appropriate indexes
                  - Avoid N+1 query problems
                  - Use prepared statements
                  - Monitor query performance
          
          - title: Redis Cache
            content: |
              #### Cache Strategy
              - Session storage
              - API response caching
              - Database query results
              - Rate limiting counters
              - Pub/sub for real-time updates
              
              #### Configuration
              - Memory: 8GB
              - Persistence: RDB + AOF
              - Replication: Master-slave
              - Cluster mode: Enabled
              - Eviction policy: allkeys-lru

  - title: Infrastructure
    content: |
      ## Cloud Infrastructure
      
      Our infrastructure is built on AWS with containerized services
      running on Kubernetes.
    
    children:
      - title: Container Orchestration
        content: |
          ### Kubernetes Setup
          - EKS cluster with 3 node groups
          - Horizontal Pod Autoscaling
          - Cluster Autoscaling
          - Network policies
          - Service mesh (Istio)
        
        children:
          - title: Deployment Strategy
            content: |
              #### Rolling Updates
              \`\`\`yaml
              apiVersion: apps/v1
              kind: Deployment
              metadata:
                name: user-service
              spec:
                replicas: 3
                strategy:
                  type: RollingUpdate
                  rollingUpdate:
                    maxSurge: 1
                    maxUnavailable: 0
                template:
                  spec:
                    containers:
                    - name: user-service
                      image: user-service:v1.2.0
                      resources:
                        requests:
                          memory: "256Mi"
                          cpu: "250m"
                        limits:
                          memory: "512Mi"
                          cpu: "500m"
              \`\`\`
          
          - title: Service Configuration
            content: |
              #### Service Mesh
              - Traffic management
              - Security policies
              - Observability
              - Circuit breaking
              - Retry policies
              
              #### Resource Management
              - CPU and memory limits
              - Quality of Service classes
              - Resource quotas
              - Limit ranges
      
      - title: Monitoring & Observability
        content: |
          ### Observability Stack
          - Metrics: Prometheus + Grafana
          - Logging: ELK Stack
          - Tracing: Jaeger
          - Alerting: AlertManager
          - Uptime: Pingdom
        
        children:
          - title: Metrics Collection
            content: |
              #### Prometheus Configuration
              - Service discovery
              - Recording rules
              - Alert rules
              - Federation
              - Long-term storage (Thanos)
              
              #### Key Metrics
              - Request rate, errors, duration
              - CPU and memory usage
              - Database performance
              - Queue depth
              - Business metrics
          
          - title: Log Management
            content: |
              #### ELK Stack Setup
              - Elasticsearch cluster (3 nodes)
              - Logstash for log processing
              - Kibana for visualization
              - Filebeat for log shipping
              - Index lifecycle management
              
              #### Log Formats
              - Structured logging (JSON)
              - Correlation IDs
              - Log levels (ERROR, WARN, INFO, DEBUG)
              - Security event logging
              - Audit trails

  - title: Security
    content: |
      ## Security Architecture
      
      Comprehensive security measures across all layers of the application.
    
    children:
      - title: Authentication & Authorization
        content: |
          ### Identity Management
          - OAuth 2.0 / OpenID Connect
          - Multi-factor authentication
          - Single Sign-On (SSO)
          - Role-based access control
          - Just-in-time provisioning
        
        children:
          - title: JWT Implementation
            content: |
              #### Token Structure
              \`\`\`json
              {
                "header": {
                  "typ": "JWT",
                  "alg": "RS256"
                },
                "payload": {
                  "sub": "user123",
                  "iat": 1642428000,
                  "exp": 1642431600,
                  "roles": ["user", "admin"],
                  "scope": "read write"
                }
              }
              \`\`\`
              
              #### Security Considerations
              - Short token expiration (1 hour)
              - Refresh token rotation
              - Token blacklisting
              - Secure storage
      
      - title: Network Security
        content: |
          ### Network Architecture
          - VPC with private subnets
          - WAF (Web Application Firewall)
          - DDoS protection
          - TLS 1.3 encryption
          - Certificate management
        
        children:
          - title: Firewall Rules
            content: |
              #### Security Groups
              - Principle of least privilege
              - Ingress rules for necessary ports only
              - Egress rules restricted
              - Regular rule auditing
              - Automated compliance checking
          
          - title: SSL/TLS Configuration
            content: |
              #### Certificate Management
              - Automated certificate provisioning
              - Certificate rotation
              - HSTS headers
              - Perfect Forward Secrecy
              - OCSP stapling

  - title: Development Process
    content: |
      ## Development Workflow
      
      Our development process emphasizes quality, security, and collaboration.
    
    children:
      - title: CI/CD Pipeline
        content: |
          ### Pipeline Stages
          1. Code commit
          2. Static analysis
          3. Unit tests
          4. Integration tests
          5. Security scanning
          6. Build Docker image
          7. Deploy to staging
          8. E2E tests
          9. Deploy to production
        
        children:
          - title: Quality Gates
            content: |
              #### Code Quality Checks
              - SonarQube analysis
              - Code coverage > 80%
              - Security vulnerability scanning
              - Dependency vulnerability checking
              - License compliance
              
              #### Test Requirements
              - Unit test coverage > 90%
              - Integration test coverage > 70%
              - E2E test suite passes
              - Performance tests pass
              - Security tests pass
          
          - title: Deployment Strategy
            content: |
              #### Blue-Green Deployment
              - Zero-downtime deployments
              - Instant rollback capability
              - Traffic switching
              - Health checks
              - Automated rollback on failure
              
              #### Feature Flags
              - Gradual feature rollout
              - A/B testing capability
              - Emergency feature disable
              - User-based targeting
              - Performance monitoring

performance_metrics:
  availability: "99.9%"
  response_time: "< 200ms p95"
  throughput: "10,000 req/sec"
  recovery_time: "< 5 minutes"
  data_durability: "99.999999999%"
`,
      
      'markdown-demo': `
title: Markdown Features Demonstration
content: |
  # Comprehensive Markdown Demo
  
  This document showcases all the Markdown features supported by TreeScribe.

children:
  - title: Text Formatting
    content: |
      ## Basic Text Formatting
      
      Learn how to format text in Markdown with various styling options.
    type: markdown
    children:
      - title: Bold and Italic
        content: |
          **Bold text** and __also bold text__
          
          *Italic text* and _also italic text_
          
          ***Bold and italic*** combined
        type: markdown
      - title: Other Formatting
        content: |
          ~~Strikethrough text~~
          
          \`Inline code\` formatting
          
          > This is a blockquote
          > It can span multiple lines
        type: markdown
    
  - title: Code Examples
    content: |
      ## Code Blocks
      
      TreeScribe supports syntax highlighting for multiple programming languages.
    type: markdown
    children:
      - title: JavaScript Example
        content: |
          ### JavaScript
          \`\`\`javascript
          const treeScribe = new TreeScribeInstance({
            dom: container,
            theme: 'dark',
            onMount: (instance) => {
              console.log('TreeScribe loaded!');
            }
          });
          
          await treeScribe.loadYaml(yamlContent);
          \`\`\`
        type: markdown
      - title: Python Example
        content: |
          ### Python
          \`\`\`python
          import yaml
          
          def load_document(file_path):
              with open(file_path, 'r') as file:
                  return yaml.safe_load(file)
          
          doc = load_document('example.yaml')
          print(f"Document title: {doc['title']}")
          \`\`\`
        type: markdown
      - title: Other Languages
        content: |
          ### CSS
          \`\`\`css
          .tree-scribe {
            font-family: system-ui;
            line-height: 1.6;
          }
          \`\`\`
          
          ### SQL
          \`\`\`sql
          SELECT * FROM documents
          WHERE content LIKE '%markdown%'
          ORDER BY created_at DESC;
          \`\`\`
        type: markdown
    
  - title: Lists and Tables
    content: |
      ## Lists
      
      ### Unordered List
      - First item
      - Second item
        - Nested item
        - Another nested item
      - Third item
      
      ### Ordered List
      1. First step
      2. Second step
         1. Sub-step
         2. Another sub-step
      3. Third step
      
      ### Task List
      - [x] Completed task
      - [ ] Incomplete task
      - [x] Another completed task
      
      ## Tables
      
      | Feature | Support | Notes |
      |---------|---------|-------|
      | Markdown | ✅ | Full support |
      | YAML | ✅ | Native format |
      | Search | ✅ | Full-text |
      | Export | ✅ | HTML, JSON |
    type: markdown
`,
      
      'data-showcase': `
title: Data Types Showcase
content: |
  # YAML Data Types Demonstration
  
  This document shows various YAML data types and structures.

children:
  - title: Primitive Types
    content:
      string_value: "Hello, World!"
      integer_value: 42
      float_value: 3.14159
      boolean_true: true
      boolean_false: false
      null_value: null
      date_value: 2024-01-17
    type: yaml
    
  - title: Collections
    content:
      # Array of strings
      colors:
        - red
        - green
        - blue
        - yellow
      
      # Array of objects
      users:
        - name: "Alice"
          age: 30
          active: true
        - name: "Bob"
          age: 25
          active: false
      
      # Nested object
      configuration:
        database:
          host: "localhost"
          port: 5432
          ssl: true
        cache:
          enabled: true
          ttl: 3600
    type: yaml
`,
      
      'accessibility-demo': `
title: Accessibility Features Demo
content: |
  # TreeScribe Accessibility
  
  This document demonstrates TreeScribe's accessibility features.
  
  **Keyboard Navigation:**
  - Use arrow keys to navigate
  - Press Enter to expand/collapse
  - Use Tab to move between sections
  - Press / to focus search

children:
  - title: Screen Reader Support
    content: |
      ## ARIA Implementation
      
      TreeScribe provides comprehensive screen reader support:
      
      - Proper ARIA roles and properties
      - Live region announcements
      - Descriptive labels
      - Focus management
    
  - title: Keyboard Navigation
    content: |
      ## Keyboard Shortcuts
      
      | Key | Action |
      |-----|--------|
      | ↑/↓ | Navigate nodes |
      | ←/→ | Collapse/expand |
      | Enter | Toggle node |
      | / | Focus search |
      | F3 | Next search result |
      | Home | First node |
      | End | Last node |
    
  - title: Visual Design
    content: |
      ## Accessibility Features
      
      - High contrast colors
      - Large touch targets (44px minimum)
      - Clear focus indicators
      - Scalable fonts
      - Reduced motion options
`
    };
    
    return inlineDocuments[documentName] || inlineDocuments['simple-guide'];
  }
  
  _updateStats(nodeCount, loadTime) {
    this.container.querySelector('#nodeCount').textContent = nodeCount || '0';
    this.container.querySelector('#loadTime').textContent = `${loadTime || 0}ms`;
    
    // Update performance info
    const performanceInfo = this.container.querySelector('#performanceInfo');
    if (loadTime < 100) {
      performanceInfo.textContent = 'Performance: Excellent';
    } else if (loadTime < 500) {
      performanceInfo.textContent = 'Performance: Good';
    } else {
      performanceInfo.textContent = 'Performance: Fair';
    }
  }
  
  _updateSearchResults(count) {
    this.container.querySelector('#searchResults').textContent = count || '0';
  }
  
  _updateThemeStatus(theme) {
    this.container.querySelector('#currentTheme').textContent = theme;
  }
  
  _log(message, type = 'info') {
    const logEl = this.container.querySelector('#eventLog');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
    
    // Limit log entries to prevent memory issues
    const entries = logEl.querySelectorAll('.log-entry');
    if (entries.length > 100) {
      entries[0].remove();
    }
  }
  
  _downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  // Public API
  getTreeScribe() {
    return this.treeScribe;
  }
  
  destroy() {
    if (this._destroyed) return;
    
    if (this.treeScribe && this.treeScribe.destroy) {
      this.treeScribe.destroy();
    }
    
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this._destroyed = true;
    
    if (this.umbilical.onDestroy) {
      this.umbilical.onDestroy(this);
    }
  }
}