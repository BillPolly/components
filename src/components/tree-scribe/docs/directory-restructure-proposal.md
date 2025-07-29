# TreeScribe Directory Structure Restructure Proposal

## Current Issues
- Too many flat directories creating confusion
- Test organization lacks clear hierarchy
- Related functionality scattered across directories

## Proposed New Structure

```
src/components/tree-scribe/
├── index.js                              # Main entry point
├── TreeScribe.js                         # Main component coordinator
│
├── core/                                 # Core functionality
│   ├── model/
│   │   ├── TreeScribeModel.js           # Data model
│   │   ├── TreeNode.js                  # Node structure
│   │   └── YamlProcessor.js             # YAML parsing
│   ├── view/
│   │   ├── TreeScribeView.js            # Main view
│   │   └── NodeRenderer.js              # Node rendering
│   └── viewmodel/
│       └── TreeScribeViewModel.js       # MVVM coordination
│
├── features/                             # Feature modules
│   ├── rendering/
│   │   ├── RendererRegistry.js          # Renderer management
│   │   ├── BaseRenderer.js              # Base class
│   │   ├── renderers/
│   │   │   ├── PlaintextRenderer.js
│   │   │   ├── MarkdownRenderer.js
│   │   │   └── YamlRenderer.js
│   │   └── plugins/                     # Plugin system
│   │       └── PluginManager.js
│   │
│   ├── interaction/
│   │   ├── InteractionManager.js        # Main interaction controller
│   │   ├── KeyboardNavigation.js        # Keyboard handling
│   │   └── FoldingManager.js            # Expand/collapse logic
│   │
│   ├── search/
│   │   ├── SearchEngine.js              # Core search functionality
│   │   └── AdvancedSearchManager.js     # Advanced search features
│   │
│   ├── accessibility/
│   │   └── AccessibilityManager.js      # ARIA, screen reader support
│   │
│   ├── performance/
│   │   ├── VirtualScrollManager.js      # Virtual scrolling
│   │   └── MemoryManager.js             # Memory optimization
│   │
│   └── export/
│       └── ExportManager.js             # Export functionality
│
├── utils/                                # Shared utilities
│   ├── UmbilicalUtils.js                # Protocol utilities
│   └── DomUtils.js                      # DOM helpers
│
├── themes/                               # Theme definitions
│   ├── light.css
│   └── dark.css
│
└── docs/                                 # Documentation
    ├── development-plan.md
    ├── api-reference.md
    └── design-architecture.md
```

## Test Structure Reorganization

```
test/components/tree-scribe/
├── unit/                                 # Unit tests organized by feature
│   ├── core/
│   │   ├── model/
│   │   │   ├── TreeScribeModel.test.js
│   │   │   ├── TreeNode.test.js
│   │   │   └── YamlProcessor.test.js
│   │   ├── view/
│   │   │   ├── TreeScribeView.test.js
│   │   │   └── NodeRenderer.test.js
│   │   └── viewmodel/
│   │       └── TreeScribeViewModel.test.js
│   │
│   ├── features/
│   │   ├── rendering/
│   │   │   ├── RendererRegistry.test.js
│   │   │   ├── BaseRenderer.test.js
│   │   │   └── renderers/
│   │   │       ├── PlaintextRenderer.test.js
│   │   │       ├── MarkdownRenderer.test.js
│   │   │       └── YamlRenderer.test.js
│   │   ├── interaction/
│   │   │   ├── InteractionManager.test.js
│   │   │   ├── KeyboardNavigation.test.js
│   │   │   └── FoldingManager.test.js
│   │   ├── search/
│   │   │   ├── SearchEngine.test.js
│   │   │   └── AdvancedSearchManager.test.js
│   │   ├── accessibility/
│   │   │   └── AccessibilityManager.test.js
│   │   ├── performance/
│   │   │   ├── VirtualScrollManager.test.js
│   │   │   └── MemoryManager.test.js
│   │   └── export/
│   │       └── ExportManager.test.js
│   │
│   └── utils/
│       └── UmbilicalUtils.test.js
│
├── integration/                          # Integration tests
│   ├── DocumentLifecycle.test.js        # End-to-end document handling
│   ├── FeatureInteraction.test.js       # Cross-feature integration
│   ├── UmbilicalProtocol.test.js        # Protocol compliance
│   └── PluginSystem.test.js             # Plugin loading/execution
│
├── quality-assurance/                    # QA-focused tests
│   ├── error-handling/
│   │   ├── ErrorHandling.test.js        # General error scenarios
│   │   ├── NetworkErrors.test.js        # Network-specific errors
│   │   ├── EdgeCases.test.js            # Boundary conditions
│   │   └── BrowserCompatibility.test.js # Cross-browser testing
│   │
│   ├── performance/
│   │   ├── PerformanceProfiling.test.js     # Performance measurements
│   │   ├── OptimizationStrategies.test.js  # Optimization techniques
│   │   ├── PerformanceBenchmarks.test.js   # Benchmark comparisons
│   │   └── PerformanceRegression.test.js   # Regression detection
│   │
│   └── accessibility/
│       ├── ScreenReader.test.js         # Screen reader testing
│       ├── KeyboardOnly.test.js         # Keyboard-only navigation
│       └── HighContrast.test.js         # Visual accessibility
│
└── examples/                             # Example-based tests
    ├── BasicUsage.test.js               # Simple usage patterns
    ├── AdvancedFeatures.test.js         # Complex feature combinations
    └── CustomRenderers.test.js          # Plugin/renderer examples
```

## Benefits of New Structure

### 1. **Clear Hierarchy**
- Features grouped logically under `features/`
- Core MVVM components under `core/`
- Tests mirror the source structure

### 2. **Reduced Directory Proliferation**
- Consolidates related functionality
- Eliminates many top-level directories
- Creates meaningful groupings

### 3. **Better Discoverability**
- Related files are co-located
- Clear separation of concerns
- Intuitive navigation

### 4. **Scalability**
- Easy to add new features under appropriate categories
- Test organization scales with feature additions
- Plugin system has dedicated space

### 5. **Maintenance Benefits**
- Easier to find related code
- Clear ownership boundaries
- Consistent organization patterns

## Migration Plan

### Phase 1: Core Reorganization
1. Create new directory structure
2. Move core MVVM files to `core/`
3. Update import paths

### Phase 2: Feature Consolidation
1. Group related features under `features/`
2. Consolidate rendering system
3. Organize interaction components

### Phase 3: Test Restructuring
1. Reorganize tests to mirror source structure
2. Consolidate quality assurance tests
3. Update test runner configuration

### Phase 4: Documentation Update
1. Update all documentation to reflect new structure
2. Update development plan
3. Create architecture documentation

## Implementation Priority

**High Priority:**
- Core MVVM reorganization
- Feature consolidation
- Test structure alignment

**Medium Priority:**
- Plugin system organization
- Theme separation
- Utility consolidation

**Low Priority:**
- Documentation reorganization
- Example restructuring

Would you like me to proceed with implementing this restructured organization?