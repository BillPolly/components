# TreeScribe Usage Examples

This document provides comprehensive examples for all public methods of the TreeScribe component.

## Table of Contents
- [Basic Setup](#basic-setup)
- [Loading Content](#loading-content)
- [Tree Navigation](#tree-navigation)
- [Search Functionality](#search-functionality)
- [Export Features](#export-features)
- [Node State Management](#node-state-management)
- [Event Handling](#event-handling)
- [Advanced Configuration](#advanced-configuration)

## Basic Setup

### Simple Initialization
```javascript
// Get a DOM container
const container = document.getElementById('tree-container');

// Create TreeScribe instance with minimal configuration
const treeScribe = new TreeScribeInstance({
  dom: container
});
```

### Advanced Initialization with Options
```javascript
const treeScribe = new TreeScribeInstance({
  dom: container,
  theme: 'dark',
  enableSearch: true,
  enableFolding: true,
  enableKeyboard: true,
  enableVirtualScroll: true, // For large documents
  enableAccessibility: true,
  enableExport: true,
  
  // Custom renderers
  renderers: {
    'custom-type': {
      render: (content, node) => {
        return `<div class="custom">${content}</div>`;
      }
    }
  },
  
  // Event callbacks
  onNodeToggle: (nodeId, expanded) => {
    console.log(`Node ${nodeId} ${expanded ? 'expanded' : 'collapsed'}`);
  },
  
  onSearch: (query, resultCount) => {
    console.log(`Search "${query}" found ${resultCount} results`);
  },
  
  onMount: (instance) => {
    console.log('TreeScribe mounted successfully');
  },
  
  onDestroy: (instance) => {
    console.log('TreeScribe destroyed');
  }
});
```

## Loading Content

### Load YAML String
```javascript
const yamlContent = `
title: My Project Documentation
description: Comprehensive guide to the project
sections:
  - title: Getting Started
    description: How to get started with the project
    subsections:
      - title: Installation
        description: |
          \`\`\`bash
          npm install my-project
          \`\`\`
      - title: Configuration
        description: Basic configuration options
        
  - title: API Reference
    description: Complete API documentation
    items:
      - title: Authentication
        description: How to authenticate API requests
      - title: Endpoints
        description: Available API endpoints
`;

try {
  const result = await treeScribe.loadYaml(yamlContent);
  
  if (result.success) {
    console.log(`Successfully loaded ${result.nodeCount} nodes`);
  } else {
    console.error('Failed to load YAML:', result.error);
  }
} catch (error) {
  console.error('Load error:', error);
}
```

### Load from URL
```javascript
try {
  const result = await treeScribe.loadYaml('https://api.example.com/docs.yaml');
  
  if (result.success) {
    console.log('Document loaded from URL successfully');
  } else {
    console.error('Failed to load from URL:', result.error);
  }
} catch (error) {
  console.error('Network error:', error);
}
```

### Handle Different Content Types
```javascript
const mixedContent = `
title: Mixed Content Document
sections:
  - title: Markdown Section
    description: |
      # This is Markdown
      
      **Bold text** and *italic text*
      
      - List item 1
      - List item 2
      
  - title: Code Section  
    description: |
      \`\`\`javascript
      function hello() {
        console.log('Hello, World!');
      }
      \`\`\`
      
  - title: YAML Data
    description:
      type: yaml
      data:
        users:
          - name: John
            role: admin
          - name: Jane
            role: user
`;

await treeScribe.loadYaml(mixedContent);
```

## Tree Navigation

### Expand/Collapse Operations
```javascript
// Expand all nodes
treeScribe.expandAll();
console.log('All nodes expanded');

// Collapse all nodes
treeScribe.collapseAll();
console.log('All nodes collapsed');

// Expand to specific depth
treeScribe.expandToDepth(2);
console.log('Expanded to depth 2');
```

### Working with Folding State
```javascript
// Get current folding state
const foldingState = treeScribe.getFoldingState();
console.log('Current folding state:', foldingState);

// Save state for later restoration
const savedState = JSON.stringify(foldingState);
localStorage.setItem('tree-folding-state', savedState);

// Restore state later
const restoredState = JSON.parse(localStorage.getItem('tree-folding-state'));
// Note: State restoration would require additional API methods
```

## Search Functionality

### Basic Search
```javascript
// Simple text search
const results = treeScribe.search('installation');

results.forEach(result => {
  console.log(`Found in node: ${result.nodeId}`);
  result.matches.forEach(match => {
    console.log(`  Match: "${match.text}" at position ${match.position}`);
  });
});
```

### Advanced Search Options
```javascript
// Case-sensitive search
const sensitiveResults = treeScribe.search('API', {
  caseSensitive: true,
  includeContent: true,
  includeTitle: true
});

// Search only in titles
const titleResults = treeScribe.search('getting started', {
  includeContent: false,
  includeTitle: true
});

// Search only in content
const contentResults = treeScribe.search('npm install', {
  includeContent: true,
  includeTitle: false
});
```

### Search Navigation
```javascript
// Perform search
treeScribe.search('configuration');

// Navigate through results
const nextResult = treeScribe.navigateSearchResults('next');
if (nextResult) {
  console.log('Navigated to next result:', nextResult.nodeId);
}

const prevResult = treeScribe.navigateSearchResults('previous');
if (prevResult) {
  console.log('Navigated to previous result:', prevResult.nodeId);
}

// Clear search highlights
treeScribe.clearSearch();
```

## Export Features

### HTML Export
```javascript
// Basic HTML export
const html = treeScribe.exportHTML();
if (html) {
  // Save to file or display
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'document.html';
  a.click();
}

// HTML export with options
const styledHtml = treeScribe.exportHTML({
  title: 'My Document Export',
  includeStyles: true,
  includeMetadata: true
});
```

### JSON Export
```javascript
// Export as JavaScript object
const docObject = treeScribe.exportJson();

if (docObject) {
  console.log(`Document: "${docObject.title}"`);
  console.log(`Sections: ${docObject.children.length}`);
  
  // Process the structure
  docObject.children.forEach((section, index) => {
    console.log(`${index + 1}. ${section.title}`);
    if (section.children.length > 0) {
      section.children.forEach(subsection => {
        console.log(`   - ${subsection.title}`);
      });
    }
  });
  
  // Save as JSON file
  const jsonString = JSON.stringify(docObject, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'document.json';
  a.click();
}
```

### Markdown Export
```javascript
// Export as Markdown (if supported)
const markdown = treeScribe.exportMarkdown({
  includeMetadata: false,
  maxDepth: 3
});

if (markdown) {
  console.log('Markdown export:');
  console.log(markdown);
}
```

## Node State Management

### Get Node State
```javascript
// Get state of a specific node
const nodeState = treeScribe.getNodeState('node-123');

if (nodeState) {
  console.log('Node state:', {
    expanded: nodeState.expanded,
    visible: nodeState.visible,
    selected: nodeState.selected,
    highlighted: nodeState.highlighted
  });
} else {
  console.log('Node not found');
}
```

### Set Node State
```javascript
// Expand a specific node
const success = treeScribe.setNodeState('node-123', {
  expanded: true
});

if (success) {
  console.log('Node expanded successfully');
}

// Update multiple properties
treeScribe.setNodeState('node-456', {
  expanded: true,
  selected: true,
  highlighted: false
});

// Hide a node
treeScribe.setNodeState('node-789', {
  visible: false
});
```

### Batch State Operations
```javascript
// Get all nodes and update states
const allNodes = treeScribe.model.getAllNodes(); // Internal API usage

allNodes.forEach(node => {
  if (node.title.includes('important')) {
    treeScribe.setNodeState(node.id, {
      highlighted: true,
      expanded: true
    });
  }
});
```

## Event Handling

### Node Toggle Events
```javascript
const treeScribe = new TreeScribeInstance({
  dom: container,
  onNodeToggle: (nodeId, expanded) => {
    console.log(`Node ${nodeId} is now ${expanded ? 'expanded' : 'collapsed'}`);
    
    // Save expansion state
    const expansionState = JSON.parse(localStorage.getItem('expansion-state') || '{}');
    expansionState[nodeId] = expanded;
    localStorage.setItem('expansion-state', JSON.stringify(expansionState));
    
    // Analytics tracking
    analytics.track('node_toggle', {
      nodeId: nodeId,
      expanded: expanded,
      timestamp: new Date().toISOString()
    });
  }
});
```

### Search Events
```javascript
const treeScribe = new TreeScribeInstance({
  dom: container,
  onSearch: (query, resultCount) => {
    console.log(`Search performed: "${query}" -> ${resultCount} results`);
    
    // Update search statistics
    updateSearchStats(query, resultCount);
    
    // Show search feedback
    if (resultCount === 0) {
      showMessage(`No results found for "${query}"`);
    } else {
      showMessage(`Found ${resultCount} results for "${query}"`);
    }
  }
});
```

## Advanced Configuration

### Custom Renderers
```javascript
const customRenderers = {
  // Custom renderer for code blocks
  'code': {
    render: (content, node) => {
      const language = node.metadata?.language || 'text';
      return `
        <div class="code-block">
          <div class="code-header">
            <span class="language">${language}</span>
            <button class="copy-btn" onclick="copyCode(this)">Copy</button>
          </div>
          <pre><code class="language-${language}">${escapeHtml(content)}</code></pre>
        </div>
      `;
    }
  },
  
  // Custom renderer for tables
  'table': {
    render: (content, node) => {
      if (typeof content === 'object' && content.rows) {
        let html = '<table class="data-table"><thead><tr>';
        
        // Headers
        if (content.headers) {
          content.headers.forEach(header => {
            html += `<th>${escapeHtml(header)}</th>`;
          });
        }
        
        html += '</tr></thead><tbody>';
        
        // Rows
        content.rows.forEach(row => {
          html += '<tr>';
          row.forEach(cell => {
            html += `<td>${escapeHtml(cell)}</td>`;
          });
          html += '</tr>';
        });
        
        html += '</tbody></table>';
        return html;
      }
      return `<div class="table-error">Invalid table data</div>`;
    }
  }
};

const treeScribe = new TreeScribeInstance({
  dom: container,
  renderers: customRenderers
});
```

### Theme Customization
```javascript
// Create with dark theme
const darkTreeScribe = new TreeScribeInstance({
  dom: container,
  theme: 'dark'
});

// Change theme dynamically
darkTreeScribe.setTheme('light');

// Custom CSS classes are applied based on theme:
// .tree-scribe-theme-light or .tree-scribe-theme-dark
```

### Performance Configuration
```javascript
// For large documents, enable virtual scrolling
const largeDocTreeScribe = new TreeScribeInstance({
  dom: container,
  enableVirtualScroll: true,
  options: {
    maxCacheSize: 1000, // Increased cache size
    overscan: 10        // More items in virtual scroll buffer
  }
});
```

### Accessibility Configuration
```javascript
const accessibleTreeScribe = new TreeScribeInstance({
  dom: container,
  enableAccessibility: true,
  enableKeyboard: true,
  options: {
    announceChanges: true,
    focusManagement: true,
    highContrast: true
  }
});
```

## Complete Example Application

```javascript
class DocumentViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentDocument = null;
    
    this.treeScribe = new TreeScribeInstance({
      dom: this.container,
      theme: 'light',
      enableSearch: true,
      enableFolding: true,
      enableKeyboard: true,
      enableExport: true,
      
      onNodeToggle: this.handleNodeToggle.bind(this),
      onSearch: this.handleSearch.bind(this),
      onMount: this.handleMount.bind(this),
      onDestroy: this.handleDestroy.bind(this)
    });
    
    this.setupUI();
  }
  
  async loadDocument(yamlContent, title = 'Document') {
    try {
      const result = await this.treeScribe.loadYaml(yamlContent);
      
      if (result.success) {
        this.currentDocument = title;
        this.updateDocumentTitle(title);
        this.showStatus(`Loaded ${result.nodeCount} nodes`);
        return true;
      } else {
        this.showError(`Failed to load document: ${result.error}`);
        return false;
      }
    } catch (error) {
      this.showError(`Error loading document: ${error.message}`);
      return false;
    }
  }
  
  setupUI() {
    // Create toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'document-toolbar';
    
    // Search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search document...';
    searchInput.addEventListener('input', (e) => {
      if (e.target.value.trim()) {
        this.treeScribe.search(e.target.value);
      } else {
        this.treeScribe.clearSearch();
      }
    });
    
    // Expand/Collapse buttons
    const expandAllBtn = document.createElement('button');
    expandAllBtn.textContent = 'Expand All';
    expandAllBtn.addEventListener('click', () => this.treeScribe.expandAll());
    
    const collapseAllBtn = document.createElement('button');
    collapseAllBtn.textContent = 'Collapse All';
    collapseAllBtn.addEventListener('click', () => this.treeScribe.collapseAll());
    
    // Export buttons
    const exportHtmlBtn = document.createElement('button');
    exportHtmlBtn.textContent = 'Export HTML';
    exportHtmlBtn.addEventListener('click', () => this.exportDocument('html'));
    
    const exportJsonBtn = document.createElement('button');
    exportJsonBtn.textContent = 'Export JSON';
    exportJsonBtn.addEventListener('click', () => this.exportDocument('json'));
    
    // Theme toggle
    const themeToggle = document.createElement('button');
    themeToggle.textContent = 'Toggle Theme';
    themeToggle.addEventListener('click', () => this.toggleTheme());
    
    toolbar.appendChild(searchInput);
    toolbar.appendChild(expandAllBtn);
    toolbar.appendChild(collapseAllBtn);
    toolbar.appendChild(exportHtmlBtn);
    toolbar.appendChild(exportJsonBtn);
    toolbar.appendChild(themeToggle);
    
    this.container.parentNode.insertBefore(toolbar, this.container);
  }
  
  handleNodeToggle(nodeId, expanded) {
    console.log(`Node ${nodeId} toggled: ${expanded}`);
  }
  
  handleSearch(query, resultCount) {
    this.showStatus(`Search "${query}": ${resultCount} results`);
  }
  
  handleMount(instance) {
    console.log('Document viewer mounted');
  }
  
  handleDestroy(instance) {
    console.log('Document viewer destroyed');
  }
  
  exportDocument(format) {
    if (!this.currentDocument) {
      this.showError('No document loaded');
      return;
    }
    
    try {
      if (format === 'html') {
        const html = this.treeScribe.exportHTML({
          title: this.currentDocument,
          includeStyles: true
        });
        
        if (html) {
          this.downloadFile(html, `${this.currentDocument}.html`, 'text/html');
        }
      } else if (format === 'json') {
        const obj = this.treeScribe.exportJson();
        
        if (obj) {
          const json = JSON.stringify(obj, null, 2);
          this.downloadFile(json, `${this.currentDocument}.json`, 'application/json');
        }
      }
    } catch (error) {
      this.showError(`Export failed: ${error.message}`);
    }
  }
  
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    this.showStatus(`Downloaded ${filename}`);
  }
  
  toggleTheme() {
    const currentTheme = this.container.classList.contains('tree-scribe-theme-dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.treeScribe.setTheme(newTheme);
    this.showStatus(`Switched to ${newTheme} theme`);
  }
  
  updateDocumentTitle(title) {
    const titleElement = document.querySelector('.document-title');
    if (titleElement) {
      titleElement.textContent = title;
    }
  }
  
  showStatus(message) {
    console.log('Status:', message);
    // Update status bar UI
  }
  
  showError(message) {
    console.error('Error:', message);
    // Show error notification
  }
  
  destroy() {
    this.treeScribe.destroy();
  }
}

// Usage
const viewer = new DocumentViewer('tree-container');

// Load a document
const sampleYaml = `
title: Sample Documentation
description: A sample document for demonstration
sections:
  - title: Introduction
    description: Welcome to our documentation
  - title: Getting Started
    description: How to get started
`;

viewer.loadDocument(sampleYaml, 'Sample Documentation');
```

## Helper Functions

```javascript
// Utility function for HTML escaping
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Copy code functionality
function copyCode(button) {
  const codeBlock = button.closest('.code-block').querySelector('code');
  const text = codeBlock.textContent;
  
  navigator.clipboard.writeText(text).then(() => {
    button.textContent = 'Copied!';
    setTimeout(() => {
      button.textContent = 'Copy';
    }, 2000);
  });
}
```

This comprehensive guide covers all the major use cases and public methods of the TreeScribe component, providing developers with everything they need to effectively use the component in their applications.