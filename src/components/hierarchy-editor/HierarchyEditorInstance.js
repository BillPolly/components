/**
 * HierarchyEditorInstance - Main instance implementation
 */

import { HierarchyModel } from './model/HierarchyModel.js';
import { HierarchyTreeView } from './view/HierarchyTreeView.js';
import { HierarchyViewModel } from './viewmodel/HierarchyViewModel.js';
import { FormatHandlerFactory } from './handlers/FormatHandlerFactory.js';
import { ViewModeManager } from './view/ViewModeManager.js';
import { EventEmitter } from './EventEmitter.js';

export class HierarchyEditorInstance extends EventEmitter {
  constructor(umbilical) {
    super();
    this.umbilical = umbilical;
    this.dom = umbilical.dom;
    
    // Initialize configuration
    this.config = {
      format: umbilical.format || 'json',
      editable: umbilical.editable !== false,
      showToolbar: umbilical.showToolbar !== false,
      defaultMode: umbilical.defaultMode || 'tree',
      theme: umbilical.theme || 'light',
      indentSize: umbilical.indentSize || 20,
      indentChar: umbilical.indentChar || '  ',
      validators: umbilical.validators || {},
      icons: umbilical.icons || {},
      labels: umbilical.labels || {},
      direction: umbilical.direction || 'ltr',
      virtualScroll: umbilical.virtualScroll || false,
      virtualScrollHeight: umbilical.virtualScrollHeight || 500,
      validationDelay: umbilical.validationDelay || 300,
      realtimeValidation: umbilical.realtimeValidation || false,
      showInlineErrors: umbilical.showInlineErrors || false,
      showErrorSuggestions: umbilical.showErrorSuggestions || false,
      highContrast: umbilical.highContrast || false,
      enableKeyboardShortcuts: umbilical.enableKeyboardShortcuts !== false,
      ariaLabels: umbilical.ariaLabels || {},
      requiredPaths: umbilical.requiredPaths || [],
      trackErrors: umbilical.trackErrors || false,
      plugins: umbilical.plugins || [],
      exportFormats: umbilical.exportFormats || {},
      importParsers: umbilical.importParsers || {},
      errorHandler: umbilical.errorHandler,
      shortcuts: umbilical.shortcuts || {},
      slowOperationThreshold: umbilical.slowOperationThreshold || 500
    };
    
    // Initialize state
    this.destroyed = false;
    this.rendered = false;
    this.currentMode = this.config.defaultMode;
    this.errorHistory = [];
    this.bulkMode = false;
    this.pendingChanges = [];
    
    // Initialize components
    this.model = null;
    this.view = null;
    this.viewModel = null;
    this.viewModeManager = null;
    this.formatHandler = null;
    
    // Bind event callbacks from umbilical
    this._bindCallbacks();
    
    // Initialize DOM
    this._initializeDOM();
    
    // Initialize plugins
    this._initializePlugins();
  }

  _initializeDOM() {
    const themeClass = `theme-${this.config.theme}`;
    const dirAttr = this.config.direction === 'rtl' ? 'dir="rtl"' : '';
    const highContrastClass = this.config.highContrast ? 'high-contrast' : '';
    
    this.dom.innerHTML = `
      <div class="hierarchy-editor ${themeClass} ${highContrastClass}" ${dirAttr}>
        ${this.config.showToolbar ? `
          <div class="he-toolbar">
            <button class="mode-btn" data-mode="tree">${this.config.labels.treeView || 'Tree View'}</button>
            <button class="mode-btn" data-mode="source">${this.config.labels.sourceView || 'Source View'}</button>
          </div>
        ` : ''}
        <div class="he-content">
          <div class="he-tree-view"></div>
        </div>
      </div>
    `;
    
    // Set up toolbar event handlers
    if (this.config.showToolbar) {
      this._setupToolbar();
    }
    
    // Set up keyboard shortcuts
    if (this.config.enableKeyboardShortcuts) {
      this._setupKeyboardShortcuts();
    }
  }
  
  _bindCallbacks() {
    // Bind all umbilical callbacks
    const callbacks = [
      'onMount', 'onDestroy', 'onReady', 'onContentChange', 'onChange',
      'onBeforeChange', 'onNodeEdit', 'onEditStart', 'onEditEnd', 'onEditCancel',
      'onNodeAdd', 'onNodeRemove', 'onNodeMove', 'onValidation', 'onValidationError',
      'onSelect', 'onExpand', 'onCollapse', 'onNavigate', 'onModeChange',
      'onBeforeModeChange', 'onFormatChange', 'onFormatDetected', 'onError',
      'onRecovery', 'onRenderComplete', 'onSlowOperation', 'onSave', 'onUndo',
      'onEditValidate', 'onEditCommit', 'onNodeDelete', 'onBeforeDelete'
    ];
    
    callbacks.forEach(callback => {
      if (this.umbilical[callback]) {
        this.on(callback.replace(/^on/, '').toLowerCase(), this.umbilical[callback]);
      }
    });
  }
  
  _initializePlugins() {
    for (const plugin of this.config.plugins) {
      try {
        if (plugin.init) {
          plugin.init(this);
        }
      } catch (error) {
        this._handleError({
          type: 'plugin-error',
          plugin: plugin.name,
          error,
          contained: true
        });
      }
    }
  }
  
  _setupToolbar() {
    const toolbar = this.dom.querySelector('.he-toolbar');
    toolbar.addEventListener('click', (e) => {
      if (e.target.matches('.mode-btn')) {
        const mode = e.target.dataset.mode;
        this.setMode(mode);
      }
    });
  }
  
  _setupKeyboardShortcuts() {
    this.dom.addEventListener('keydown', (e) => {
      const key = this._getShortcutKey(e);
      const action = this.config.shortcuts[key];
      
      if (action) {
        e.preventDefault();
        this._handleShortcut(action);
      }
    });
  }
  
  _getShortcutKey(e) {
    const parts = [];
    if (e.metaKey || e.ctrlKey) parts.push('cmd');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    parts.push(e.key.toLowerCase());
    return parts.join('+');
  }
  
  _handleShortcut(action) {
    switch (action) {
      case 'save':
        this.emit('save', { content: this.getContent() });
        break;
      case 'undo':
        this.emit('undo');
        break;
      case 'redo':
        this.emit('redo');
        break;
      case 'deleteNode':
        if (this.selectedNode) {
          this.deleteNode(this.selectedNode);
        }
        break;
      case 'editNode':
        if (this.selectedNode) {
          this.startInlineEdit(this.selectedNode);
        }
        break;
    }
  }
  
  // Public API Methods
  
  render() {
    if (this.rendered) return this;
    
    const startTime = Date.now();
    
    try {
      // Initialize format handler
      this.formatHandler = FormatHandlerFactory.create(this.config.format);
      
      // Initialize model
      this.model = new HierarchyModel();
      
      // Initialize view
      const viewContainer = this.dom.querySelector('.he-tree-view');
      this.view = new HierarchyTreeView(viewContainer, {
        theme: this.config.theme,
        indentSize: this.config.indentSize,
        icons: this.config.icons,
        editable: this.config.editable,
        ariaLabels: this.config.ariaLabels
      });
      
      // Initialize view model
      this.viewModel = new HierarchyViewModel(this.model, this.view);
      
      // Initialize view mode manager
      this.viewModeManager = new ViewModeManager(this.dom.querySelector('.he-content'), {
        defaultMode: this.config.defaultMode,
        format: this.config.format,
        theme: this.config.theme,
        editable: this.config.editable,
        indentChar: this.config.indentChar,
        realtimeValidation: this.config.realtimeValidation
      });
      
      // Set up event forwarding
      this._setupEventForwarding();
      
      // Load initial content if provided
      if (this.umbilical.content) {
        this.loadContent(this.umbilical.content, this.config.format);
      } else {
        this._showEmptyState();
      }
      
      // Set initial mode
      if (this.config.defaultMode === 'source') {
        this.setMode('source');
      }
      
      this.rendered = true;
      
      // Emit mount event
      this.emit('mount', {
        instance: this,
        format: this.config.format,
        mode: this.currentMode
      });
      
      // Emit ready event
      setTimeout(() => {
        const renderTime = Date.now() - startTime;
        this.emit('ready', {
          instance: this,
          nodeCount: this.model ? this.model.getNodeCount() : 0,
          format: this.config.format
        });
        
        this.emit('rendercomplete', {
          nodeCount: this.model ? this.model.getNodeCount() : 0,
          renderTime,
          mode: this.currentMode,
          format: this.config.format
        });
      }, 0);
      
    } catch (error) {
      this._handleError({
        type: 'render-error',
        error,
        recoverable: false
      });
    }
    
    return this;
  }
  
  _setupEventForwarding() {
    // Forward model events
    if (this.model) {
      this.model.on('change', (data) => {
        if (!this.bulkMode) {
          this._emitContentChange(data.source || 'model');
        } else {
          this.pendingChanges.push(data);
        }
      });
    }
    
    // Forward view events
    if (this.view) {
      this.view.on('select', (data) => {
        this.selectedNode = data.nodeId;
        this.emit('select', data);
      });
      
      this.view.on('expand', (data) => this.emit('expand', data));
      this.view.on('collapse', (data) => this.emit('collapse', data));
      this.view.on('navigate', (data) => this.emit('navigate', data));
    }
    
    // Forward view model events
    if (this.viewModel) {
      this.viewModel.on('edit', (data) => this.emit('edit', data));
      this.viewModel.on('nodeadd', (data) => this.emit('nodeadd', data));
      this.viewModel.on('nodedelete', (data) => this.emit('nodedelete', data));
      this.viewModel.on('nodemove', (data) => this.emit('nodemove', data));
    }
    
    // Forward view mode manager events
    if (this.viewModeManager) {
      this.viewModeManager.on('modechange', (data) => {
        this.currentMode = data.toMode;
        this.emit('modechange', data);
      });
      
      this.viewModeManager.on('validation', (data) => this.emit('validation', data));
    }
  }
  
  _emitContentChange(source) {
    const content = this.getContent();
    const previousContent = this._previousContent || '';
    
    if (content !== previousContent) {
      this.emit('contentchange', {
        content,
        previousContent,
        source,
        format: this.config.format
      });
      
      this.emit('change', {
        type: source,
        content,
        format: this.config.format
      });
      
      this._previousContent = content;
    }
  }
  
  _showEmptyState() {
    const contentEl = this.dom.querySelector('.he-content');
    contentEl.innerHTML = '<div class="empty-state">No content loaded</div>';
  }
  
  _showErrorState(error) {
    const contentEl = this.dom.querySelector('.he-content');
    const message = error.message || 'An error occurred';
    const suggestion = this._getErrorSuggestion(error);
    
    contentEl.innerHTML = `
      <div class="error-state">
        <div class="error-message">${message}</div>
        ${suggestion ? `<div class="error-suggestion">${suggestion}</div>` : ''}
      </div>
    `;
  }
  
  _getErrorSuggestion(error) {
    if (!this.config.showErrorSuggestions) return null;
    
    const message = error.message.toLowerCase();
    if (message.includes('trailing comma')) {
      return 'Remove the trailing comma from your JSON';
    }
    if (message.includes('unexpected token')) {
      return 'Check for missing quotes or brackets';
    }
    if (message.includes('unterminated string')) {
      return 'Make sure all strings are properly closed with quotes';
    }
    
    return null;
  }
  
  getContent() {
    if (!this.model || !this.formatHandler) return '';
    
    try {
      const rootNode = this.model.getRootNode();
      return this.formatHandler.serialize(rootNode, this.config.indentChar);
    } catch (error) {
      this._handleError({
        type: 'serialization-error',
        error,
        recoverable: true
      });
      return '';
    }
  }
  
  setContent(content) {
    if (!this.config.editable) return this;
    
    const event = {
      content,
      preventDefault: false
    };
    
    this.emit('beforechange', event);
    if (event.preventDefault) return this;
    
    try {
      if (this.viewModeManager && this.currentMode === 'source') {
        this.viewModeManager.setContent(content);
      } else {
        this.loadContent(content, this.config.format);
      }
      
      this._emitContentChange('set-content');
    } catch (error) {
      this._handleError({
        type: 'content-error',
        error,
        recoverable: true
      });
    }
    
    return this;
  }
  
  loadContent(content, format) {
    if (!content) {
      this._showEmptyState();
      return this;
    }
    
    try {
      // Auto-detect format if not specified
      if (!format) {
        format = this._detectFormat(content);
      }
      
      // Update format if different
      if (format !== this.config.format) {
        const oldFormat = this.config.format;
        this.config.format = format;
        this.formatHandler = FormatHandlerFactory.create(format);
        
        this.emit('formatchange', {
          fromFormat: oldFormat,
          toFormat: format,
          content
        });
      }
      
      // Parse content
      const rootNode = this.formatHandler.parse(content);
      
      // Update model
      if (this.model) {
        this.model.setRootNode(rootNode);
      }
      
      // Update view
      if (this.viewModel) {
        this.viewModel.render();
      }
      
      // Update view mode manager
      if (this.viewModeManager) {
        this.viewModeManager.config.format = format;
        this.viewModeManager.setContent(content);
      }
      
      this._previousContent = content;
      
      // Clear error state
      if (this.errorHistory.length > 0) {
        this.emit('recovery', {
          fromError: this.errorHistory[this.errorHistory.length - 1].type,
          newContent: content,
          newFormat: format
        });
      }
      
    } catch (error) {
      this._handleError({
        type: 'parse-error',
        message: `Invalid ${format} content`,
        format,
        content,
        error,
        recoverable: true
      });
      
      this._showErrorState(error);
    }
    
    return this;
  }
  
  _detectFormat(content) {
    // Try each format handler
    const formats = ['json', 'xml', 'yaml', 'markdown'];
    
    for (const format of formats) {
      const handler = FormatHandlerFactory.create(format);
      if (handler.detect && handler.detect(content)) {
        const confidence = handler.getConfidence ? handler.getConfidence(content) : 1.0;
        
        this.emit('formatdetected', {
          format,
          confidence,
          content
        });
        
        return format;
      }
    }
    
    // Default to JSON
    return 'json';
  }
  
  async setMode(mode) {
    if (!this.viewModeManager) {
      return { success: false, error: new Error('View mode manager not initialized') };
    }
    
    const event = {
      fromMode: this.currentMode,
      toMode: mode,
      preventDefault: false
    };
    
    this.emit('beforemodechange', event);
    if (event.preventDefault) {
      return { success: false, reason: 'prevented' };
    }
    
    try {
      let result;
      
      if (mode === 'tree') {
        result = await this.viewModeManager.switchToTree();
      } else if (mode === 'source') {
        result = await this.viewModeManager.switchToSource();
      } else {
        throw new Error(`Unknown mode: ${mode}`);
      }
      
      if (!result || result.error) {
        throw result ? result.error : new Error('Mode switch failed');
      }
      
      return { success: true };
      
    } catch (error) {
      this._handleError({
        type: 'mode-switch-error',
        fromMode: this.currentMode,
        toMode: mode,
        reason: 'invalid-content',
        error
      });
      
      return { success: false, error };
    }
  }
  
  getMode() {
    return this.currentMode;
  }
  
  selectNode(pathOrId) {
    if (!this.view) return this;
    
    const node = this._findNode(pathOrId);
    if (node) {
      this.view.selectNode(node.id);
      this.selectedNode = node.id;
    }
    
    return this;
  }
  
  expandNode(pathOrId, recursive = false) {
    if (!this.view) return this;
    
    const node = this._findNode(pathOrId);
    if (node) {
      this.view.expandNode(node.id, recursive);
    }
    
    return this;
  }
  
  collapseNode(pathOrId) {
    if (!this.view) return this;
    
    const node = this._findNode(pathOrId);
    if (node) {
      this.view.collapseNode(node.id);
    }
    
    return this;
  }
  
  expandAll() {
    if (!this.view) return this;
    this.view.expandAll();
    return this;
  }
  
  collapseAll() {
    if (!this.view) return this;
    this.view.collapseAll();
    return this;
  }
  
  editNode(pathOrId, value) {
    if (!this.config.editable || !this.viewModel) return false;
    
    const node = this._findNode(pathOrId);
    if (!node) return false;
    
    // Validate if validator exists
    const validator = this.config.validators[node.path || node.name];
    if (validator) {
      const result = validator(value);
      if (!result.valid) {
        this.emit('validationerror', {
          path: node.path || node.name,
          value,
          error: result.error,
          validator: node.path || node.name
        });
        return false;
      }
    }
    
    try {
      this.viewModel.editNode(node.id, value);
      
      this.emit('nodeedit', {
        path: node.path || node.name,
        oldValue: node.value,
        newValue: value,
        nodeId: node.id,
        parentPath: node.parent ? node.parent.path : ''
      });
      
      this._emitContentChange('tree-edit');
      return true;
      
    } catch (error) {
      this._handleError({
        type: 'edit-error',
        error,
        recoverable: true
      });
      return false;
    }
  }
  
  startInlineEdit(pathOrId) {
    if (!this.config.editable || !this.view) return this;
    
    const node = this._findNode(pathOrId);
    if (node && this.view.startInlineEdit) {
      this.view.startInlineEdit(node.id);
      
      this.emit('editstart', {
        path: node.path || node.name,
        currentValue: node.value,
        mode: 'inline'
      });
    }
    
    return this;
  }
  
  cancelEdit() {
    if (!this.view) return this;
    
    if (this.view.cancelEdit) {
      const node = this._findNode(this.selectedNode);
      this.view.cancelEdit();
      
      if (node) {
        this.emit('editcancel', {
          path: node.path || node.name,
          originalValue: node.value,
          reason: 'user-cancelled'
        });
      }
    }
    
    return this;
  }
  
  addNode(parentPath, value, key) {
    if (!this.config.editable || !this.viewModel) return false;
    
    try {
      const result = this.viewModel.addNode(parentPath, value, key);
      
      if (result) {
        const parentNode = this._findNode(parentPath);
        
        this.emit('nodeadd', {
          parentPath,
          value,
          key,
          index: result.index,
          nodeId: result.nodeId,
          parentType: parentNode ? parentNode.type : 'unknown'
        });
        
        this._emitContentChange('node-add');
      }
      
      return result;
      
    } catch (error) {
      this._handleError({
        type: 'operation-error',
        operation: 'add',
        path: parentPath,
        error,
        recoverable: true
      });
      return false;
    }
  }
  
  deleteNode(pathOrId) {
    if (!this.config.editable || !this.viewModel) return false;
    
    const node = this._findNode(pathOrId);
    if (!node) return false;
    
    // Check if node is required
    if (this.config.requiredPaths.includes(node.path || node.name)) {
      this._handleError({
        type: 'operation-error',
        operation: 'delete',
        path: node.path || node.name,
        error: new Error(`Cannot delete required node: ${node.path || node.name}`),
        recoverable: true
      });
      return false;
    }
    
    try {
      const hadChildren = node.children && node.children.length > 0;
      const parentPath = node.parent ? (node.parent.path || '') : '';
      
      const result = this.viewModel.deleteNode(node.id);
      
      if (result) {
        this.emit('noderemove', {
          path: node.path || node.name,
          value: node.value,
          parentPath,
          hadChildren
        });
        
        this.emit('nodedelete', {
          path: node.path || node.name,
          value: node.value,
          parentPath,
          index: node.index
        });
        
        this._emitContentChange('node-delete');
      }
      
      return result;
      
    } catch (error) {
      this._handleError({
        type: 'operation-error',
        operation: 'delete',
        path: pathOrId,
        error,
        recoverable: true
      });
      return false;
    }
  }
  
  moveNode(fromPath, toPath, toIndex) {
    if (!this.config.editable || !this.viewModel) return false;
    
    try {
      const fromNode = this._findNode(fromPath);
      const toNode = this._findNode(toPath);
      
      if (!fromNode || !toNode) return false;
      
      // Check for circular reference
      if (this._isDescendantOf(toNode, fromNode)) {
        throw new Error('Cannot move node into its own descendant (circular reference)');
      }
      
      const result = this.viewModel.moveNode(fromNode.id, toNode.id, toIndex);
      
      if (result) {
        this.emit('nodemove', {
          fromPath,
          toPath,
          toIndex,
          value: fromNode.value,
          fromParent: fromNode.parent ? fromNode.parent.path : '',
          toParent: toPath
        });
        
        this._emitContentChange('node-move');
      }
      
      return result;
      
    } catch (error) {
      this._handleError({
        type: 'operation-error',
        operation: 'move',
        fromPath,
        toPath,
        error,
        recoverable: true
      });
      return false;
    }
  }
  
  getTreeData() {
    if (!this.model) return null;
    return this.model.getRootNode();
  }
  
  validate(content, format) {
    try {
      const fmt = format || this.config.format;
      const handler = FormatHandlerFactory.create(fmt);
      handler.parse(content);
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error };
    }
  }
  
  bulkOperation(operation) {
    this.bulkMode = true;
    this.pendingChanges = [];
    
    const startTime = Date.now();
    
    try {
      operation();
      
      // Emit single change event for all changes
      if (this.pendingChanges.length > 0) {
        this._emitContentChange('bulk-operation');
      }
      
      const duration = Date.now() - startTime;
      if (duration > this.config.slowOperationThreshold) {
        this.emit('slowoperation', {
          operation: 'bulk-operation',
          duration,
          itemCount: this.pendingChanges.length
        });
      }
      
    } finally {
      this.bulkMode = false;
      this.pendingChanges = [];
    }
    
    return this;
  }
  
  on(event, handler) {
    super.on(event, handler);
    return this;
  }
  
  off(event, handler) {
    super.off(event, handler);
    return this;
  }
  
  exportAs(format) {
    const exporter = this.config.exportFormats[format];
    if (!exporter) {
      throw new Error(`Export format not supported: ${format}`);
    }
    
    const data = this.getTreeData();
    return exporter(data);
  }
  
  importFrom(content, format) {
    const parser = this.config.importParsers[format];
    if (!parser) {
      throw new Error(`Import format not supported: ${format}`);
    }
    
    try {
      const data = parser(content);
      this.loadContent(JSON.stringify(data), 'json');
    } catch (error) {
      this._handleError({
        type: 'import-error',
        format,
        error,
        recoverable: true
      });
    }
    
    return this;
  }
  
  setTheme(theme) {
    this.config.theme = theme;
    const editorEl = this.dom.querySelector('.hierarchy-editor');
    
    // Remove existing theme classes
    Array.from(editorEl.classList)
      .filter(c => c.startsWith('theme-'))
      .forEach(c => editorEl.classList.remove(c));
    
    // Add new theme class
    editorEl.classList.add(`theme-${theme}`);
    
    // Update view theme
    if (this.view && this.view.setTheme) {
      this.view.setTheme(theme);
    }
    
    // Update view mode manager theme
    if (this.viewModeManager) {
      this.viewModeManager.config.theme = theme;
    }
    
    return this;
  }
  
  hasErrors() {
    return this.errorHistory.length > 0;
  }
  
  getErrorHistory() {
    return [...this.errorHistory];
  }
  
  retry() {
    if (this._lastOperation) {
      this._lastOperation();
    }
    return this;
  }
  
  convertTo(format) {
    try {
      const content = this.getContent();
      const currentHandler = this.formatHandler;
      const targetHandler = FormatHandlerFactory.create(format);
      
      // Parse with current handler and serialize with target
      const rootNode = currentHandler.parse(content);
      const converted = targetHandler.serialize(rootNode, this.config.indentChar);
      
      this.loadContent(converted, format);
      
    } catch (error) {
      this._handleError({
        type: 'conversion-error',
        fromFormat: this.config.format,
        toFormat: format,
        error,
        recoverable: true
      });
    }
    
    return this;
  }
  
  navigate(direction) {
    if (!this.view || !this.view.navigate) return this;
    
    this.view.navigate(direction);
    return this;
  }
  
  _findNode(pathOrId) {
    if (!this.model) return null;
    
    // Try as path first
    let node = this.model.findByPath(pathOrId);
    
    // Try as ID if not found by path
    if (!node) {
      node = this.model.findById(pathOrId);
    }
    
    return node;
  }
  
  _isDescendantOf(node, potentialAncestor) {
    let current = node;
    while (current && current.parent) {
      if (current.parent.id === potentialAncestor.id) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }
  
  _handleError(error) {
    // Add timestamp and context
    error.timestamp = Date.now();
    error.context = {
      mode: this.currentMode,
      nodeCount: this.model ? this.model.getNodeCount() : 0
    };
    
    // Track error if enabled
    if (this.config.trackErrors) {
      this.errorHistory.push(error);
    }
    
    // Use custom error handler if provided
    if (this.config.errorHandler) {
      const result = this.config.errorHandler(error);
      if (result && result.handled) {
        return;
      }
    }
    
    // Emit error event
    this.emit('error', error);
    
    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('[HierarchyEditor]', error);
    }
  }
  
  destroy() {
    if (this.destroyed) return;
    
    // Destroy plugins
    for (const plugin of this.config.plugins) {
      try {
        if (plugin.destroy) {
          plugin.destroy();
        }
      } catch (error) {
        console.error('Error destroying plugin:', error);
      }
    }
    
    // Destroy components
    if (this.viewModeManager) {
      this.viewModeManager.destroy();
    }
    
    if (this.viewModel) {
      this.viewModel.destroy();
    }
    
    if (this.view) {
      this.view.destroy();
    }
    
    if (this.model) {
      this.model.destroy();
    }
    
    // Clear DOM
    if (this.dom) {
      this.dom.innerHTML = '';
    }
    
    // Clear all event listeners
    this.removeAllListeners();
    
    this.destroyed = true;
    
    // Emit destroy event
    this.emit('destroy', { instance: this });
  }
}