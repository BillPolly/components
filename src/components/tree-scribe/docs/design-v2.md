# TreeScribe Universal Document Viewer - Design Document v2

## Table of Contents
1. [Vision & Overview](#vision--overview)
2. [Multi-Format Architecture](#multi-format-architecture)
3. [Parser Infrastructure](#parser-infrastructure)
4. [Supported Document Formats](#supported-document-formats)
5. [Unified Data Model](#unified-data-model)
6. [Parser Plugin System](#parser-plugin-system)
7. [Format Detection & Selection](#format-detection--selection)
8. [UI/UX Enhancements](#uiux-enhancements)
9. [Backward Compatibility](#backward-compatibility)
10. [Performance Considerations](#performance-considerations)
11. [Security & Sandboxing](#security--sandboxing)
12. [Future Extensibility](#future-extensibility)

---

## Vision & Overview

### Enhanced Purpose

TreeScribe evolves from a YAML document viewer to a **Universal Hierarchical Document Viewer** that can parse, display, and navigate any document format with inherent or derivable tree structure. This positions TreeScribe as the go-to component for viewing structured content regardless of source format.

### Core Principles

1. **Format Agnostic**: Support any hierarchical document format through a unified interface
2. **Structure Preservation**: Maintain the natural hierarchy of each format
3. **Intelligent Parsing**: Derive structure from formats even when not explicitly hierarchical
4. **Progressive Enhancement**: Start with basic structure, add format-specific features
5. **Universal Export**: Export to any supported format, not just the source format

### Key Benefits

- **Single Component, Multiple Formats**: One viewer for YAML, JSON, Markdown, HTML, JavaScript, and more
- **Cross-Format Conversion**: Load in one format, export in another
- **Consistent Experience**: Unified navigation and interaction regardless of format
- **Extensible Architecture**: Easy to add new formats via plugins
- **Developer Friendly**: Parse and explore code structures, config files, and documentation

---

## Multi-Format Architecture

### Architectural Overview

```
TreeScribe Universal
├── Core
│   ├── TreeScribeModel      # Format-agnostic tree management
│   ├── TreeNode             # Universal node representation
│   └── TreeScribeViewModel  # Orchestrates parsing and rendering
│
├── Parsing Layer (NEW)
│   ├── ParserRegistry       # Manages format parsers
│   ├── BaseParser           # Abstract parser interface
│   └── Parsers/
│       ├── YamlParser       # YAML documents
│       ├── JsonParser       # JSON structures
│       ├── MarkdownParser   # Markdown with headings
│       ├── HtmlParser       # HTML DOM trees
│       ├── JavaScriptParser # JS/TS AST
│       └── XmlParser        # XML documents
│
├── Rendering Layer
│   ├── RendererRegistry     # Content display management
│   └── Renderers/           # Format-specific renderers
│
└── Export Layer
    ├── ExportManager        # Multi-format export
    └── Formatters/          # Format-specific exporters
```

### Component Interactions

1. **Load Flow**: User provides content → Format detection → Parser selection → Tree generation → Rendering
2. **Parser-Renderer Cooperation**: Parsers tag nodes with optimal content types for renderers
3. **Export Flow**: Current tree → Format selection → Formatter transformation → Output

---

## Parser Infrastructure

### BaseParser Abstract Class

```javascript
/**
 * Abstract base class for all document parsers
 */
export class BaseParser {
  /**
   * Get parser name/identifier
   * @returns {string} Parser name
   */
  getName() {
    throw new Error('getName() must be implemented');
  }

  /**
   * Get supported format identifiers
   * @returns {string[]} Array of format IDs (e.g., ['yaml', 'yml'])
   */
  getSupportedFormats() {
    throw new Error('getSupportedFormats() must be implemented');
  }

  /**
   * Get supported MIME types
   * @returns {string[]} Array of MIME types
   */
  getSupportedMimeTypes() {
    return [];
  }

  /**
   * Check if parser can handle given content
   * @param {string} content - Document content
   * @param {Object} hints - Format hints (extension, mimeType, etc.)
   * @returns {boolean} Can parse
   */
  canParse(content, hints = {}) {
    throw new Error('canParse() must be implemented');
  }

  /**
   * Parse content into tree structure
   * @param {string} content - Document content
   * @param {Object} options - Parser options
   * @returns {Object} Normalized tree structure
   */
  parse(content, options = {}) {
    throw new Error('parse() must be implemented');
  }

  /**
   * Validate content before parsing
   * @param {string} content - Document content
   * @returns {Object} {valid: boolean, errors: string[]}
   */
  validate(content) {
    return { valid: true, errors: [] };
  }

  /**
   * Get parser capabilities
   * @returns {Object} Parser feature flags
   */
  getCapabilities() {
    return {
      supportsStreaming: false,
      supportsPartialParse: false,
      preservesFormatting: true,
      bidirectional: false  // Can recreate original from tree
    };
  }
}
```

### ParserRegistry

```javascript
/**
 * Manages document parsers and format detection
 */
export class ParserRegistry {
  constructor() {
    this.parsers = new Map();
    this.formatMap = new Map();  // format -> parser
    this.mimeMap = new Map();    // mime -> parser
  }

  /**
   * Register a parser
   * @param {BaseParser} parser - Parser instance
   */
  registerParser(parser) {
    const name = parser.getName();
    this.parsers.set(name, parser);
    
    // Map formats to parser
    parser.getSupportedFormats().forEach(format => {
      this.formatMap.set(format.toLowerCase(), parser);
    });
    
    // Map MIME types to parser
    parser.getSupportedMimeTypes().forEach(mime => {
      this.mimeMap.set(mime, parser);
    });
  }

  /**
   * Get parser for content
   * @param {string} content - Document content
   * @param {Object} hints - Format hints
   * @returns {BaseParser|null} Suitable parser or null
   */
  getParser(content, hints = {}) {
    // Try explicit format
    if (hints.format) {
      const parser = this.formatMap.get(hints.format.toLowerCase());
      if (parser && parser.canParse(content, hints)) {
        return parser;
      }
    }
    
    // Try MIME type
    if (hints.mimeType) {
      const parser = this.mimeMap.get(hints.mimeType);
      if (parser && parser.canParse(content, hints)) {
        return parser;
      }
    }
    
    // Auto-detect by trying each parser
    for (const parser of this.parsers.values()) {
      if (parser.canParse(content, hints)) {
        return parser;
      }
    }
    
    return null;
  }

  /**
   * Get all registered formats
   * @returns {string[]} Format identifiers
   */
  getFormats() {
    return Array.from(this.formatMap.keys());
  }
}
```

---

## Supported Document Formats

### 1. YAML Parser (Enhanced)

**Structure Detection:**
- Preserve existing YAML parsing logic
- Support YAML-specific features (anchors, references)
- Handle multi-document YAML files

**Node Mapping:**
- Title from `title` field or key name
- Content from `content` field or value
- Children from `children` array or nested objects

### 2. JSON Parser

**Structure Detection:**
- Objects with consistent structure become nodes
- Arrays of objects become sibling nodes
- Primitive arrays become list content

**Node Mapping:**
```javascript
{
  "name": "Example",
  "description": "...",
  "items": [...]
}
// Becomes:
// - Node: "Example" (from name)
// - Content: description
// - Children: items array
```

### 3. Markdown Parser

**Structure Detection:**
- Headings define hierarchy (# = level 1, ## = level 2, etc.)
- Content between headings becomes node content
- Support frontmatter for metadata

**Node Mapping:**
```markdown
# Title
Content here

## Subtitle
More content

### Sub-subtitle
Even more content
```

**Special Features:**
- TOC generation
- Cross-references
- Code block extraction

### 4. HTML Parser

**Structure Detection:**
- DOM tree natural hierarchy
- Semantic elements prioritized (article, section, nav)
- Data attributes for metadata

**Node Mapping:**
- Node title from heading tags, id, or data-title
- Content from text content
- Children from child elements

**Intelligent Parsing:**
- Skip purely presentational elements
- Extract meaningful structure from common patterns
- Support for documentation HTML (e.g., JSDoc output)

### 5. JavaScript/TypeScript Parser

**Structure Detection:**
- AST-based parsing
- Classes, functions, methods as nodes
- JSDoc comments as content

**Node Mapping:**
```javascript
class TreeScribe {
  constructor() { }
  
  // Public methods
  loadFile() { }
  
  // Private methods
  _parseContent() { }
}
```

**Features:**
- Symbol navigation
- Dependency visualization
- Code metrics in metadata

### 6. XML Parser

**Structure Detection:**
- Element hierarchy
- Attributes as metadata
- Text content handling

**Use Cases:**
- Configuration files
- SVG structure viewing
- Data interchange formats

---

## Unified Data Model

### TreeNode Enhancement

```javascript
class TreeNode {
  constructor(data = {}) {
    // Core fields (unchanged)
    this.id = data.id || generateId();
    this.title = data.title || 'Untitled';
    this.content = data.content || '';
    this.children = [];
    this.parent = null;
    
    // Format-specific metadata (NEW)
    this.sourceFormat = data.sourceFormat || 'unknown';
    this.sourceMetadata = data.sourceMetadata || {};
    
    // Enhanced content typing
    this.contentType = data.contentType || 'plaintext';
    this.contentFormat = data.contentFormat; // Original format
    
    // Parsing metadata (NEW)
    this.parseInfo = {
      parser: data.parser,           // Parser used
      lineNumber: data.lineNumber,   // Source line
      sourcePath: data.sourcePath,   // Path in original
      confidence: data.confidence    // Parse confidence
    };
  }
}
```

### Format-Agnostic Tree Operations

All tree operations work regardless of source format:
- Navigation (parent, children, siblings)
- Search across all content
- Folding state management
- Export to any format

---

## Parser Plugin System

### Plugin Architecture

```javascript
export class ParserPluginManager {
  constructor(registry) {
    this.registry = registry;
    this.plugins = new Map();
  }

  /**
   * Load parser plugin
   * @param {string} url - Plugin URL
   * @returns {Promise<void>}
   */
  async loadPlugin(url) {
    try {
      const module = await import(url);
      if (module.default && module.default.prototype instanceof BaseParser) {
        const parser = new module.default();
        this.registry.registerParser(parser);
        this.plugins.set(parser.getName(), {
          url,
          parser,
          loaded: new Date()
        });
      }
    } catch (error) {
      console.error(`Failed to load parser plugin: ${url}`, error);
    }
  }
}
```

### Plugin Example

```javascript
// custom-parser-plugin.js
export default class CustomFormatParser extends BaseParser {
  getName() {
    return 'CustomFormatParser';
  }

  getSupportedFormats() {
    return ['custom', 'cst'];
  }

  canParse(content, hints) {
    return content.startsWith('CUSTOM:');
  }

  parse(content, options) {
    // Custom parsing logic
    return {
      title: 'Custom Document',
      content: 'Parsed content',
      children: []
    };
  }
}
```

---

## Format Detection & Selection

### Auto-Detection Strategy

1. **File Extension**: Check hints.extension against format map
2. **MIME Type**: Use Content-Type header if available
3. **Content Inspection**: Look for format signatures
4. **Parser Voting**: Let each parser vote on confidence
5. **User Override**: Allow manual format selection

### Format Signatures

```javascript
const FORMAT_SIGNATURES = {
  yaml: /^---\n|^%YAML/,
  json: /^\s*[{\[]/,
  markdown: /^#\s+.+|^---\n/,
  html: /^\s*<(!DOCTYPE|html|head|body)/i,
  javascript: /^(import|export|function|class|const|let|var)\s/,
  xml: /^\s*<\?xml|^\s*<\w+[\s>]/
};
```

### Detection Flow

```javascript
class FormatDetector {
  detect(content, hints = {}) {
    // Priority 1: Explicit format
    if (hints.format) return hints.format;
    
    // Priority 2: File extension
    if (hints.filename) {
      const ext = path.extname(hints.filename).slice(1);
      if (this.registry.hasFormat(ext)) return ext;
    }
    
    // Priority 3: MIME type
    if (hints.mimeType) {
      const format = this.mimeToFormat(hints.mimeType);
      if (format) return format;
    }
    
    // Priority 4: Content inspection
    return this.inspectContent(content);
  }
}
```

---

## UI/UX Enhancements

### Format Selector

```javascript
// In TreeScribeDemo
<div class="format-selector">
  <label>Format:</label>
  <select id="formatSelect">
    <option value="auto">Auto-detect</option>
    <option value="yaml">YAML</option>
    <option value="json">JSON</option>
    <option value="markdown">Markdown</option>
    <option value="html">HTML</option>
    <option value="javascript">JavaScript</option>
    <option value="xml">XML</option>
  </select>
</div>
```

### Drag-and-Drop Support

```javascript
// Enhanced file handling
handleFileDrop(file) {
  const hints = {
    filename: file.name,
    mimeType: file.type,
    size: file.size
  };
  
  const reader = new FileReader();
  reader.onload = (e) => {
    this.loadContent(e.target.result, hints);
  };
  reader.readAsText(file);
}
```

### Format-Specific Icons

```javascript
const FORMAT_ICONS = {
  yaml: '📄',
  json: '{ }',
  markdown: 'Md',
  html: '</>',
  javascript: 'JS',
  xml: '<>',
  unknown: '📄'
};
```

### Visual Format Indicators

- Color-coded node borders by source format
- Format badge on root node
- Syntax highlighting in content
- Format-specific tree icons

---

## Backward Compatibility

### Migration Strategy

1. **Existing API Preservation**: `loadYaml()` remains, internally uses new system
2. **Default Behavior**: When no format specified, assume YAML
3. **Gradual Adoption**: New `load()` method alongside old methods
4. **Deprecation Path**: Mark old methods deprecated, remove in v3

### Compatibility Layer

```javascript
class TreeScribeInstance {
  // Legacy method (preserved)
  async loadYaml(yamlContent) {
    return this.load(yamlContent, { format: 'yaml' });
  }
  
  // New universal method
  async load(content, options = {}) {
    const parser = this.parserRegistry.getParser(content, options);
    if (!parser) {
      throw new Error('No suitable parser found');
    }
    
    const tree = parser.parse(content, options);
    return this.model.loadTree(tree);
  }
}
```

### Configuration Compatibility

```javascript
// Old configuration still works
new TreeScribeInstance({
  dom: container,
  theme: 'light'
});

// New configuration options
new TreeScribeInstance({
  dom: container,
  theme: 'light',
  formats: ['yaml', 'json', 'markdown'],  // Limit formats
  defaultFormat: 'yaml',                  // Default for ambiguous
  parserOptions: {                        // Format-specific options
    markdown: { 
      headerLevels: 6,
      includeFrontmatter: true 
    }
  }
});
```

---

## Performance Considerations

### Large Document Handling

1. **Streaming Parsers**: For formats that support it (JSON, XML)
2. **Progressive Parsing**: Parse visible nodes first
3. **Virtual Scrolling**: Only render visible nodes
4. **Worker Thread Parsing**: Offload parsing to Web Workers

### Parser Performance Metrics

```javascript
class PerformanceMonitor {
  measureParse(parser, content) {
    const start = performance.now();
    const result = parser.parse(content);
    const duration = performance.now() - start;
    
    return {
      parser: parser.getName(),
      contentSize: content.length,
      nodeCount: this.countNodes(result),
      duration,
      nodesPerMs: this.countNodes(result) / duration
    };
  }
}
```

### Caching Strategy

1. **Parse Cache**: Cache parsed trees by content hash
2. **Format Detection Cache**: Remember format for content
3. **Renderer Cache**: Reuse rendered content for unchanged nodes

---

## Security & Sandboxing

### Content Security

1. **HTML Sanitization**: Sanitize HTML content before parsing
2. **Script Stripping**: Remove executable code from formats
3. **URL Validation**: Validate external references
4. **Content Size Limits**: Prevent DoS from huge documents

### Parser Sandboxing

```javascript
class SecureParser {
  constructor(parser) {
    this.parser = parser;
  }
  
  parse(content, options) {
    // Size check
    if (content.length > MAX_CONTENT_SIZE) {
      throw new Error('Content too large');
    }
    
    // Time limit
    return this.withTimeout(
      () => this.parser.parse(content, options),
      PARSE_TIMEOUT
    );
  }
}
```

---

## Future Extensibility

### Planned Format Support

1. **Binary Formats**: 
   - PDF structure viewing
   - Office document outlines
   - Archive contents (ZIP, TAR)

2. **Specialized Formats**:
   - API specifications (OpenAPI, GraphQL)
   - Configuration formats (TOML, INI, .env)
   - Data formats (CSV with hierarchy detection)

3. **Code Formats**:
   - Python with AST
   - Go packages
   - Rust modules

### Advanced Features

1. **Format Conversion Pipeline**: Load → Transform → Export
2. **Diff Viewing**: Compare documents across formats
3. **Merge Capabilities**: Combine multiple documents
4. **Real-time Collaboration**: Multi-user editing
5. **AI-Powered Structure**: Derive hierarchy from unstructured text

### Plugin Ecosystem

1. **Parser Marketplace**: Community-contributed parsers
2. **Format Templates**: Pre-built parsing rules
3. **Transform Plugins**: Modify tree between parse and render
4. **Export Plugins**: Custom output formats

---

## Conclusion

TreeScribe's evolution to a universal document viewer represents a natural progression of its hierarchical viewing capabilities. By maintaining the clean umbilical architecture while adding a powerful parser infrastructure, TreeScribe becomes an indispensable tool for developers working with any structured document format.

The design prioritizes:
- **Extensibility** through the parser plugin system
- **Compatibility** with existing YAML-focused usage
- **Performance** through intelligent parsing strategies
- **Security** through sandboxing and validation
- **Usability** through auto-detection and visual enhancements

This positions TreeScribe as the Swiss Army knife of document viewers in the umbilical component ecosystem.