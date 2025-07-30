# TreeScribe API Documentation

## Overview

TreeScribe is a component for visualizing hierarchical data from various document formats including JSON, YAML, Markdown, HTML, JavaScript, and XML.

## Basic Usage

### Creating a TreeScribe Instance

```javascript
import { TreeScribe } from './src/components/tree-scribe/TreeScribe.js';

const container = document.getElementById('tree-container');
const treeScribe = TreeScribe.create({
  dom: container,
  theme: 'light' // or 'dark'
});
```

### Loading Content

```javascript
// Load JSON
await treeScribe.loadContent('{"title": "My Document", "items": ["one", "two"]}');

// Load YAML
await treeScribe.loadContent('title: My Document\nitems:\n  - one\n  - two');

// Load with explicit format
await treeScribe.loadContent(content, { format: 'yaml' });
```

### Supported Formats

- **JSON**: JavaScript Object Notation
- **YAML**: YAML Ain't Markup Language  
- **Markdown**: Markdown documents with heading hierarchy
- **HTML**: HTML documents with semantic structure
- **JavaScript**: JavaScript/TypeScript code structure
- **XML**: XML documents with element hierarchy

## Core API

### TreeScribe Methods

#### `TreeScribe.create(umbilical)`

Creates a new TreeScribe instance.

**Parameters:**
- `umbilical.dom` (HTMLElement): Container element for the tree
- `umbilical.theme` (string, optional): Theme ('light' or 'dark')
- `umbilical.onNodeToggle` (function, optional): Callback for node expand/collapse
- `umbilical.plugins` (array, optional): Array of parser plugins

**Returns:** TreeScribe instance

#### `loadContent(content, options)`

Loads and displays content in the tree.

**Parameters:**
- `content` (string): The content to parse and display
- `options.format` (string, optional): Force specific format detection

**Returns:** Promise that resolves when content is loaded

#### `destroy()`

Cleans up the TreeScribe instance and removes from DOM.

## Parser Plugins

### Using Plugins

```javascript
import { csvParserPlugin } from './src/components/tree-scribe/features/plugins/examples/csv-parser-plugin.js';

const treeScribe = TreeScribe.create({
  dom: container,
  plugins: [csvParserPlugin]
});

// Now can parse CSV
await treeScribe.loadContent('Name,Age\nJohn,25\nJane,30', { format: 'csv' });
```

### Available Plugins

- **CSV Parser**: Parses comma-separated values with hierarchy detection
- **TOML Parser**: Parses TOML configuration files

### Creating Custom Plugins

```javascript
const myPlugin = {
  name: 'My Custom Parser',
  version: '1.0.0',
  
  getSupportedFormats() {
    return ['myformat'];
  },
  
  canParse(content, hints = {}) {
    // Return confidence score 0-1
    return content.startsWith('MYFORMAT:') ? 1.0 : 0.0;
  },
  
  async validate(content) {
    // Return { valid: boolean, errors: array }
    return { valid: true, errors: [] };
  },
  
  async parse(content, options = {}) {
    // Return tree structure
    return {
      title: 'My Document',
      children: [],
      sourceFormat: 'myformat'
    };
  }
};
```

## Tree Structure

All parsers return a consistent tree structure:

```javascript
{
  title: "Document Title",
  content: "Optional content", 
  children: [
    {
      title: "Child Node",
      content: "Child content",
      children: []
    }
  ],
  sourceFormat: "json", // Format that was parsed
  metadata: {} // Parser-specific metadata
}
```

## Performance Features

TreeScribe includes several performance optimizations:

- **Virtual Scrolling**: Handles large documents efficiently
- **Streaming Parser**: Progressive loading for large files  
- **Intelligent Caching**: Caches parsed results with prediction
- **Memory Management**: Automatic cleanup and optimization
- **Rendering Optimization**: Efficient DOM updates

### Using Performance Features

```javascript
// Enable performance monitoring
import { PerformanceProfiler } from './src/components/tree-scribe/features/performance/PerformanceProfiler.js';

const profiler = new PerformanceProfiler();
const sessionId = profiler.startSession('parsing');

// Your parsing code here
const result = await parser.parse(content);

const session = profiler.endSession(sessionId);
console.log('Parse time:', session.duration);
```

## Event Handling

### Node Interactions

```javascript
const treeScribe = TreeScribe.create({
  dom: container,
  onNodeToggle: (nodeId, expanded) => {
    console.log(`Node ${nodeId} ${expanded ? 'expanded' : 'collapsed'}`);
  }
});
```

## Error Handling

TreeScribe provides graceful error handling:

```javascript
try {
  await treeScribe.loadContent(invalidContent);
} catch (error) {
  console.error('Failed to load content:', error.message);
  // TreeScribe continues to work, error doesn't crash the component
}
```

## Theming

TreeScribe supports light and dark themes:

```javascript
const treeScribe = TreeScribe.create({
  dom: container,
  theme: 'dark'
});

// Change theme dynamically (if supported)
// treeScribe.setTheme('light');
```

## Browser Compatibility

TreeScribe works in modern browsers that support:
- ES6 modules
- Promise/async-await
- DOM manipulation APIs
- CSS Grid and Flexbox

## Examples

### Basic JSON Viewer

```javascript
const container = document.getElementById('json-viewer');
const treeScribe = TreeScribe.create({ dom: container });

const jsonData = {
  "name": "My Project",
  "version": "1.0.0",
  "dependencies": {
    "library1": "^2.0.0",
    "library2": "^1.5.0"
  }
};

await treeScribe.loadContent(JSON.stringify(jsonData, null, 2));
```

### Multi-format Document Viewer

```javascript
const formats = [
  { name: 'JSON', content: '{"key": "value"}' },
  { name: 'YAML', content: 'key: value' },
  { name: 'Markdown', content: '# Title\n\nContent here' }
];

const container = document.getElementById('multi-viewer');
const treeScribe = TreeScribe.create({ dom: container });

// Load different formats
for (const format of formats) {
  console.log(`Loading ${format.name}...`);
  await treeScribe.loadContent(format.content);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Pause between loads
}
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure you're using ES6 modules and the correct import paths
2. **DOM Not Found**: Make sure the container element exists before creating TreeScribe
3. **Format Not Detected**: Use explicit format hint in loadContent options
4. **Performance Issues**: Enable virtual scrolling for large documents

### Debug Mode

```javascript
// Enable debug logging (if implemented)
const treeScribe = TreeScribe.create({
  dom: container,
  debug: true
});
```

### Getting Help

- Check browser console for error messages
- Verify content format is valid
- Test with minimal example first
- Check that all required files are properly imported