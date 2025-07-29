# TreeScribe Troubleshooting Guide

This guide helps you resolve common issues when using the TreeScribe component.

## Table of Contents
- [Installation & Setup Issues](#installation--setup-issues)
- [Loading & Rendering Problems](#loading--rendering-problems)
- [Performance Issues](#performance-issues)
- [Search Problems](#search-problems)
- [Accessibility Issues](#accessibility-issues)
- [Export Problems](#export-problems)
- [Memory & Resource Issues](#memory--resource-issues)
- [Browser Compatibility](#browser-compatibility)
- [Common Error Messages](#common-error-messages)

## Installation & Setup Issues

### Problem: Component Not Rendering
**Symptoms**: Empty container, no tree structure visible

**Solution**:
```javascript
// ✅ Correct - Ensure DOM element exists
const container = document.getElementById('tree-container');
if (!container) {
  console.error('Container element not found!');
  return;
}

const treeScribe = new TreeScribeInstance({
  dom: container // ✅ Must be actual DOM element, not selector string
});

// ❌ Incorrect - Don't use selector strings
const treeScribe = new TreeScribeInstance({
  dom: '#tree-container' // This will cause errors
});
```

### Problem: "TreeScribeInstance is not defined"
**Symptoms**: ReferenceError when creating instance

**Solution**:
```javascript
// ✅ Correct ES6 import
import { TreeScribeInstance } from './path/to/TreeScribe.js';

// Or with umbilical protocol
import TreeScribe from './path/to/index.js';
const instance = TreeScribe.create({ dom: container });
```

### Problem: Module Loading Errors
**Symptoms**: Import/export errors, module not found

**Solution**:
- Ensure all file paths are correct
- Check that you're using ES6 modules (not CommonJS)
- Verify web server is serving `.js` files with correct MIME type
- Use relative paths starting with `./` or `../`

## Loading & Rendering Problems

### Problem: YAML Loading Fails
**Symptoms**: "Failed to load YAML" error message

**Common Causes & Solutions**:

1. **Invalid YAML Syntax**:
```yaml
# ❌ Invalid - Missing colon
title My Document
sections
  - name: Section 1

# ✅ Valid YAML
title: My Document
sections:
  - name: Section 1
```

2. **Empty or Null Content**:
```javascript
// ✅ Handle empty content gracefully
const yamlContent = document.getElementById('yaml-input').value.trim();
if (!yamlContent) {
  console.warn('No YAML content provided');
  return;
}

const result = await treeScribe.loadYaml(yamlContent);
```

3. **Network Issues (when loading from URL)**:
```javascript
try {
  const result = await treeScribe.loadYaml('https://example.com/doc.yaml');
  if (!result.success) {
    console.error('Load failed:', result.error);
  }
} catch (error) {
  if (error.name === 'NetworkError') {
    console.error('Network error - check URL and CORS settings');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Problem: Nodes Not Rendering in DOM
**Symptoms**: Data loads successfully but no visual tree appears

**Debugging Steps**:
```javascript
// 1. Check if data loaded correctly
const result = await treeScribe.loadYaml(yamlContent);
console.log('Load result:', result);
console.log('Root node:', treeScribe.model.getRoot());
console.log('All nodes:', treeScribe.model.getAllNodes());

// 2. Check DOM structure
const treeContainer = container.querySelector('.tree-scribe-tree');
console.log('Tree container:', treeContainer);
console.log('Container HTML:', treeContainer?.innerHTML);

// 3. Check for CSS issues
console.log('Container styles:', getComputedStyle(container));
```

**Common Solutions**:
- Ensure container has dimensions (`width` and `height` set)
- Check CSS isn't hiding elements (`display: none`, `visibility: hidden`)
- Verify no CSS conflicts with `.tree-scribe` classes

### Problem: Content Not Displaying Correctly
**Symptoms**: Tree structure appears but content is wrong/missing

**Solutions**:

1. **Content Type Detection Issues**:
```javascript
// Force specific renderer
const yamlWithTypes = `
title: Code Example
sections:
  - title: JavaScript Code
    description: |
      \`\`\`javascript
      function hello() {
        console.log('Hello, World!');
      }
      \`\`\`
    # Explicit content type
    contentType: code
`;
```

2. **Custom Renderer Issues**:
```javascript
// ✅ Proper custom renderer
const customRenderers = {
  'mytype': {
    render: (content, node) => {
      // Always return string
      return `<div class="my-content">${escapeHtml(content)}</div>`;
    }
  }
};

// ❌ Common mistakes
const badRenderers = {
  'mytype': {
    render: (content, node) => {
      return null; // Don't return null
      // return undefined; // Don't return undefined
      // throw new Error(); // Don't throw errors
    }
  }
};
```

## Performance Issues

### Problem: Slow Loading with Large Documents
**Symptoms**: Loading takes >2 seconds, UI freezes

**Solutions**:

1. **Enable Virtual Scrolling**:
```javascript
const treeScribe = new TreeScribeInstance({
  dom: container,
  enableVirtualScroll: true, // ✅ For documents >1000 nodes
  options: {
    overscan: 10 // Render 10 extra items for smooth scrolling
  }
});
```

2. **Optimize Memory Usage**:
```javascript
const treeScribe = new TreeScribeInstance({
  dom: container,
  options: {
    maxCacheSize: 500, // ✅ Limit cache size
    debounceSearch: 300 // ✅ Debounce search for better performance
  }
});
```

3. **Progressive Loading**:
```javascript
// Load document in chunks
async function loadLargeDocument(yamlChunks) {
  for (const chunk of yamlChunks) {
    await treeScribe.loadYaml(chunk);
    // Give browser time to render
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```

### Problem: Memory Leaks
**Symptoms**: Memory usage increases over time, browser slows down

**Solutions**:
```javascript
// ✅ Always destroy when done
function cleanupComponent() {
  if (treeScribe) {
    treeScribe.destroy();
    treeScribe = null;
  }
}

// ✅ Clean up on page unload
window.addEventListener('beforeunload', cleanupComponent);

// ✅ Clean up in SPA route changes
// In React useEffect, Vue beforeDestroy, etc.
useEffect(() => {
  return () => {
    cleanupComponent();
  };
}, []);
```

## Search Problems

### Problem: Search Not Finding Results
**Symptoms**: Search returns empty array for text that should match

**Debugging**:
```javascript
// Check search configuration
const results = treeScribe.search('test query', {
  caseSensitive: false, // ✅ Try case insensitive first
  includeContent: true,
  includeTitle: true
});

console.log('Search results:', results);

// Check if content is actually indexed
const allNodes = treeScribe.model.getAllNodes();
allNodes.forEach(node => {
  console.log(`Node ${node.id}: title="${node.title}", content="${node.content}"`);
});
```

**Solutions**:
1. Verify search terms match exactly (check for typos)
2. Try case-insensitive search first
3. Check both title and content are being searched
4. Ensure content was properly loaded and indexed

### Problem: Search Performance Issues
**Symptoms**: Search takes >1 second to return results

**Solutions**:
```javascript
// ✅ Debounce search input
let searchTimeout;
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    treeScribe.search(e.target.value);
  }, 300); // Wait 300ms after typing stops
});

// ✅ Clear previous results before new search
searchInput.addEventListener('input', (e) => {
  treeScribe.clearSearch(); // Clear highlights first
  if (e.target.value.trim()) {
    treeScribe.search(e.target.value);
  }
});
```

## Accessibility Issues

### Problem: Screen Reader Not Announcing Changes
**Symptoms**: Screen reader doesn't announce node expansions, search results

**Solutions**:
```javascript
// ✅ Enable accessibility features
const treeScribe = new TreeScribeInstance({
  dom: container,
  enableAccessibility: true, // ✅ Enable ARIA support
  enableKeyboard: true,      // ✅ Enable keyboard navigation
  
  onNodeToggle: (nodeId, expanded) => {
    // ✅ Manual announcement if needed
    const announcement = `Node ${expanded ? 'expanded' : 'collapsed'}`;
    announceToScreenReader(announcement);
  }
});

function announceToScreenReader(message) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only'; // Visually hidden
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  setTimeout(() => document.body.removeChild(announcement), 1000);
}
```

### Problem: Keyboard Navigation Not Working
**Symptoms**: Tab, Enter, arrows don't navigate the tree

**Solutions**:
```javascript
// ✅ Ensure keyboard support is enabled
const treeScribe = new TreeScribeInstance({
  dom: container,
  enableKeyboard: true,
  enableAccessibility: true
});

// ✅ Check for conflicting event handlers
// Remove other keydown listeners that might interfere
container.addEventListener('keydown', (e) => {
  console.log('Key pressed:', e.key, 'Target:', e.target);
});
```

## Export Problems

### Problem: Export Returns Empty/Null
**Symptoms**: `exportHTML()` or `exportJson()` returns null or empty string

**Solutions**:
```javascript
// ✅ Check if document is loaded first
const docObj = treeScribe.exportJson();
if (!docObj) {
  console.error('No document loaded - load YAML first');
  const result = await treeScribe.loadYaml(yamlContent);
  if (result.success) {
    const docObj = treeScribe.exportJson(); // Try again
  }
}

// ✅ Check for export manager issues
if (!treeScribe.destroyed && treeScribe.model.getRoot()) {
  const html = treeScribe.exportHTML();
  if (!html) {
    console.error('Export manager may not be enabled');
    // Recreate with export enabled
    const newTreeScribe = new TreeScribeInstance({
      dom: container,
      enableExport: true // ✅ Ensure export is enabled
    });
  }
}
```

### Problem: Exported HTML Missing Styles
**Symptoms**: HTML export lacks visual formatting

**Solutions**:
```javascript
// ✅ Include styles in export
const html = treeScribe.exportHTML({
  includeStyles: true, // ✅ Include CSS
  includeMetadata: true,
  title: 'My Document'
});

// ✅ Or add external CSS reference
const styledHtml = `
<html>
<head>
  <title>Exported Document</title>
  <link rel="stylesheet" href="/path/to/tree-scribe.css">
</head>
<body>
  ${html}
</body>
</html>
`;
```

## Memory & Resource Issues

### Problem: Browser Freezing with Large Documents
**Symptoms**: Tab becomes unresponsive, "Page Unresponsive" warnings

**Solutions**:

1. **Chunked Processing**:
```javascript
// ✅ Process in chunks with yields
async function processLargeYaml(yamlContent) {
  const chunks = splitYamlIntoChunks(yamlContent);
  
  for (let i = 0; i < chunks.length; i++) {
    await treeScribe.loadYaml(chunks[i]);
    
    // Yield control to browser
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    // Update progress
    updateProgressBar((i + 1) / chunks.length * 100);
  }
}
```

2. **Virtual Scrolling**:
```javascript
// ✅ Use virtual scrolling for >1000 nodes
const treeScribe = new TreeScribeInstance({
  dom: container,
  enableVirtualScroll: true,
  options: {
    itemHeight: 32,    // Fixed height per item
    overscan: 5,       // Buffer items
    maxRenderCount: 100 // Max visible items
  }
});
```

### Problem: High Memory Usage
**Symptoms**: Browser memory usage keeps increasing

**Solutions**:
```javascript
// ✅ Regular cleanup
setInterval(() => {
  if (treeScribe && !treeScribe.destroyed) {
    // Clear search cache
    treeScribe.clearSearch();
    
    // Manual garbage collection hint (if available)
    if (window.gc) {
      window.gc();
    }
  }
}, 300000); // Every 5 minutes

// ✅ Limit cache size
const treeScribe = new TreeScribeInstance({
  dom: container,
  options: {
    maxCacheSize: 100,     // Limit cached nodes
    clearCacheInterval: 60000 // Clear cache every minute
  }
});
```

## Browser Compatibility

### Problem: Component Not Working in Older Browsers
**Symptoms**: JavaScript errors, features not working

**Solutions**:

1. **Check Browser Support**:
```javascript
// ✅ Feature detection
function checkBrowserSupport() {
  const missing = [];
  
  if (!window.fetch) missing.push('fetch');
  if (!window.Promise) missing.push('Promise');
  if (!document.querySelector) missing.push('querySelector');
  if (!Array.prototype.forEach) missing.push('Array.forEach');
  
  if (missing.length > 0) {
    console.error('Missing browser features:', missing);
    return false;
  }
  
  return true;
}

if (checkBrowserSupport()) {
  // Initialize TreeScribe
  const treeScribe = new TreeScribeInstance({ dom: container });
} else {
  // Show fallback content
  container.innerHTML = '<p>Your browser is not supported. Please upgrade.</p>';
}
```

2. **Polyfills** (if needed):
```html
<!-- Include polyfills for older browsers -->
<script src="https://polyfill.io/v3/polyfill.min.js?features=fetch,Promise,Array.prototype.forEach"></script>
<script type="module" src="./TreeScribe.js"></script>
```

### Problem: ES6 Module Issues
**Symptoms**: "Unexpected token 'import'" or module loading errors

**Solutions**:
```html
<!-- ✅ Ensure proper module loading -->
<script type="module">
  import { TreeScribeInstance } from './TreeScribe.js';
  // Your code here
</script>

<!-- ❌ Don't use without type="module" -->
<script>
  import { TreeScribeInstance } from './TreeScribe.js'; // This won't work
</script>
```

## Common Error Messages

### "Cannot read property 'dom' of undefined"
**Cause**: Umbilical object is missing or doesn't contain required properties
**Solution**:
```javascript
// ✅ Always provide required properties
const treeScribe = new TreeScribeInstance({
  dom: document.getElementById('container') // Required
});

// ✅ Validate umbilical before use
function createTreeScribe(umbilical) {
  if (!umbilical || !umbilical.dom) {
    throw new Error('TreeScribe requires umbilical.dom property');
  }
  return new TreeScribeInstance(umbilical);
}
```

### "this.virtualScrollManager.setItems is not a function"
**Cause**: API mismatch between TreeScribe and VirtualScrollManager
**Solution**: This was fixed in the latest version. Ensure you're using the updated code.

### "YAML parsing error"
**Cause**: Invalid YAML syntax
**Solution**:
```javascript
// ✅ Validate YAML before loading
import { parse } from 'yaml';

function validateYaml(yamlString) {
  try {
    parse(yamlString);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error.message,
      line: error.linePos?.start?.line,
      column: error.linePos?.start?.col
    };
  }
}

const validation = validateYaml(yamlContent);
if (validation.valid) {
  await treeScribe.loadYaml(yamlContent);
} else {
  console.error(`YAML error at line ${validation.line}: ${validation.error}`);
}
```

### "Component destroyed" error
**Cause**: Trying to use component after calling `destroy()`
**Solution**:
```javascript
// ✅ Check if destroyed before use
if (!treeScribe.destroyed) {
  treeScribe.search('query');
}

// ✅ Recreate if needed
if (treeScribe.destroyed) {
  treeScribe = new TreeScribeInstance({ dom: container });
}
```

## Getting Help

### Debug Information Collection
When reporting issues, please include:

```javascript
// Collect debug information
function collectDebugInfo() {
  return {
    userAgent: navigator.userAgent,
    treeScribeVersion: '1.0.0', // Check your version
    containerSize: {
      width: container.clientWidth,
      height: container.clientHeight
    },
    nodeCount: treeScribe.model?.getAllNodes()?.length || 0,
    hasDocument: !!treeScribe.model?.getRoot(),
    isDestroyed: treeScribe.destroyed,
    enabledFeatures: {
      search: !!treeScribe.searchManager,
      folding: !!treeScribe.foldingManager,
      accessibility: !!treeScribe.accessibilityManager,
      virtualScroll: !!treeScribe.virtualScrollManager
    }
  };
}

console.log('Debug info:', collectDebugInfo());
```

### Performance Profiling
```javascript
// Performance measurement
console.time('TreeScribe Load');
const result = await treeScribe.loadYaml(yamlContent);
console.timeEnd('TreeScribe Load');

console.log('Performance stats:', treeScribe.getStatistics());
```

For additional help:
1. Check the browser console for detailed error messages
2. Verify all requirements are met (DOM element, valid YAML, etc.)
3. Test with minimal configuration first
4. Compare with working examples
5. File issues with complete debug information

Remember: Most issues are related to configuration, YAML syntax, or browser compatibility. Start with the simplest possible setup and gradually add features to isolate problems.