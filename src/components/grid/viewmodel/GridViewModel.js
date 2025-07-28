/**
 * GridViewModel - ViewModel layer for the grid component
 * 
 * Coordinates between Model and View, handles user interactions,
 * and manages the application logic following MVVM pattern.
 */
import { TextField } from '../../field-editors/text-field/index.js';
import { NumericField } from '../../field-editors/numeric-field/index.js';
import { BooleanField } from '../../field-editors/boolean-field/index.js';

export class GridViewModel {
  constructor(model, view, config) {
    this.model = model;
    this.view = view;
    this.config = config;
    
    // Editing state
    this.editingCell = null;
    this.currentEditor = null;
    
    // Bind view callbacks
    this.bindViewEvents();
    
    // Setup interactive features
    this.setupDragHandlers();
    this.setupResizeHandlers();
    this.setupSelectionHandlers();
    this.setupSortingHandlers();
  }
  
  get displayData() {
    return this.model.getOrderedData();
  }
  
  get displayColumns() {
    return this.model.getOrderedColumns();
  }
  
  // Initial render
  render() {
    this.view.render(this.displayData, this.displayColumns);
    this.updateSortIndicators();
    this.updateSelection();
  }
  
  // Cell editing
  startEdit(rowIndex, columnKey) {
    if (this.editingCell) {
      this.cancelEdit();
    }
    
    const column = this.displayColumns.find(col => col.key === columnKey);
    if (!column || !column.editable) return;
    
    this.editingCell = { rowIndex, columnKey };
    const cellValue = this.model.getRow(rowIndex)[columnKey];
    
    // Create editor container
    const editorContainer = document.createElement('div');
    editorContainer.style.cssText = 'width: 100%; position: relative;';
    
    // Create field editor
    this.currentEditor = this.createFieldEditor(column, cellValue, editorContainer);
    
    // Show editor in view
    this.view.showEditor(rowIndex, columnKey, editorContainer);
    
    // Focus editor
    setTimeout(() => {
      this.currentEditor.focus();
    }, 0);
    
    // Setup editor event handlers
    this.setupEditorHandlers();
  }
  
  saveEdit() {
    if (!this.editingCell || !this.currentEditor) return;
    
    const { rowIndex, columnKey } = this.editingCell;
    const newValue = this.currentEditor.getValue();
    const validation = this.currentEditor.validate();
    
    if (validation.valid) {
      const oldValue = this.model.getRow(rowIndex)[columnKey];
      this.model.updateRow(rowIndex, { [columnKey]: newValue });
      this.view.updateCell(rowIndex, columnKey, newValue);
      this.cancelEdit();
      
      // Notify external callbacks
      if (this.config.onDataChange) {
        this.config.onDataChange(this.displayData, this.model.getChanges());
      }
      
      return true;
    } else {
      // Show validation error (editor handles this internally)
      if (this.config.onValidationError) {
        this.config.onValidationError([{
          rowIndex,
          columnKey,
          message: validation.message
        }]);
      }
      return false;
    }
  }
  
  cancelEdit() {
    if (this.currentEditor) {
      this.currentEditor.destroy();
      this.currentEditor = null;
    }
    
    if (this.editingCell) {
      this.view.hideEditor(this.editingCell.rowIndex, this.editingCell.columnKey);
      this.editingCell = null;
    }
  }
  
  // Field editor creation
  createFieldEditor(column, value, container) {
    const editorType = column.type || 'text';
    const EditorClass = this.getFieldEditorClass(editorType);
    
    const editorConfig = {
      value,
      dom: container,
      ...this.getEditorConfig(column)
    };
    
    return EditorClass.create(editorConfig);
  }
  
  getFieldEditorClass(type) {
    const editors = {
      'text': TextField,
      'number': NumericField,
      'boolean': BooleanField
    };
    
    return editors[type] || TextField;
  }
  
  getEditorConfig(column) {
    const config = {
      placeholder: column.placeholder,
      required: column.required,
      disabled: column.disabled,
      readonly: column.readonly,
      validator: column.validator
    };
    
    // Type-specific configurations
    if (column.type === 'text') {
      config.maxLength = column.maxLength;
      config.multiline = column.multiline;
    } else if (column.type === 'number') {
      config.min = column.min;
      config.max = column.max;
      config.step = column.step;
      config.decimals = column.decimals;
      config.format = column.format;
    } else if (column.type === 'boolean') {
      config.style = column.style;
      config.trueLabel = column.trueLabel;
      config.falseLabel = column.falseLabel;
    }
    
    return config;
  }
  
  setupEditorHandlers() {
    if (!this.currentEditor) return;
    
    // Handle escape key to cancel
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        this.cancelEdit();
        document.removeEventListener('keydown', handleKeyDown);
      } else if (e.key === 'Enter' && !e.shiftKey) {
        if (this.saveEdit()) {
          document.removeEventListener('keydown', handleKeyDown);
        }
        e.preventDefault();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    // Handle clicks outside editor
    const handleClickOutside = (e) => {
      const editorElement = this.view.element.querySelector(`[data-row-index="${this.editingCell.rowIndex}"][data-column-key="${this.editingCell.columnKey}"]`);
      if (editorElement && !editorElement.contains(e.target)) {
        if (this.saveEdit()) {
          document.removeEventListener('click', handleClickOutside);
        }
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
  }
  
  // Bind view events
  bindViewEvents() {
    // Cell click handler
    this.view.onCellClick = (rowIndex, columnKey) => {
      this.startEdit(rowIndex, columnKey);
    };
    
    // Row selection callback
    this.view.isRowSelected = (rowIndex) => {
      return this.model.isRowSelected(rowIndex);
    };
    
    // Column width callback
    this.view.getStoredWidth = (columnKey) => {
      return this.model.getColumnWidth(columnKey);
    };
  }
  
  // Selection management
  setupSelectionHandlers() {
    if (!this.config.selectable || this.config.selectable === 'none') return;
    
    // Handle row selection clicks
    this.view.addEventListener(this.view.element, 'click', (e) => {
      const selector = e.target.closest('.row-selector');
      if (selector) {
        const rowIndex = parseInt(selector.getAttribute('data-row-index'));
        this.toggleRowSelection(rowIndex);
      }
    }, 'selection');
    
    // Handle select all checkbox
    if (this.config.selectable === 'multiple') {
      this.view.addEventListener(this.view.element, 'click', (e) => {
        if (e.target.classList.contains('select-all-checkbox')) {
          this.toggleSelectAll(e.target.checked);
        }
      }, 'select-all');
    }
  }
  
  toggleRowSelection(rowIndex) {
    this.model.toggleRowSelection(rowIndex);
    this.updateSelection();
    
    if (this.config.onSelectionChange) {
      this.config.onSelectionChange(this.model.getSelectedRows());
    }
  }
  
  toggleSelectAll(isChecked) {
    if (isChecked) {
      // Select all rows
      for (let i = 0; i < this.displayData.length; i++) {
        this.model.selectRow(i);
      }
    } else {
      this.model.clearSelection();
    }
    
    this.updateSelection();
    
    if (this.config.onSelectionChange) {
      this.config.onSelectionChange(this.model.getSelectedRows());
    }
  }
  
  updateSelection() {
    const selectedRows = this.model.getSelectedRows();
    
    // Update individual row selections
    for (let i = 0; i < this.displayData.length; i++) {
      this.view.updateRowSelection(i, selectedRows.includes(i));
    }
    
    // Update select all checkbox
    if (this.config.selectable === 'multiple') {
      const totalRows = this.displayData.length;
      const selectedCount = selectedRows.length;
      
      if (selectedCount === 0) {
        this.view.updateSelectAllCheckbox(false, false);
      } else if (selectedCount === totalRows) {
        this.view.updateSelectAllCheckbox(true, false);
      } else {
        this.view.updateSelectAllCheckbox(false, true); // indeterminate
      }
    }
  }
  
  // Sorting
  setupSortingHandlers() {
    this.view.addEventListener(this.view.element, 'click', (e) => {
      const header = e.target.closest('.column-header');
      if (header) {
        const columnKey = header.getAttribute('data-column-key');
        const column = this.displayColumns.find(col => col.key === columnKey);
        
        if (column && column.sortable) {
          this.toggleSort(columnKey);
        }
      }
    }, 'sorting');
  }
  
  toggleSort(columnKey) {
    let direction = 'asc';
    
    if (this.model.sortColumn === columnKey) {
      direction = this.model.sortDirection === 'asc' ? 'desc' : 'asc';
    }
    
    this.model.sort(columnKey, direction);
    this.view.updateRowOrder(this.displayData);
    this.updateSortIndicators();
    this.updateSelection(); // Refresh selection display after reorder
  }
  
  updateSortIndicators() {
    if (this.model.sortColumn) {
      this.view.updateSortIndicators(this.model.sortColumn, this.model.sortDirection);
    }
  }
  
  // Row drag & drop
  setupDragHandlers() {
    if (this.config.rowDragging?.enabled) {
      this.setupRowDragging();
    }
    
    if (this.config.columnDragging?.enabled) {
      this.setupColumnDragging();
    }
  }
  
  setupRowDragging() {
    this.view.addEventListener(this.view.element, 'dragstart', (e) => {
      const dragHandle = e.target.closest('.drag-handle');
      if (dragHandle) {
        const row = dragHandle.closest('tr');
        const rowIndex = parseInt(row.getAttribute('data-row-index'));
        
        this.model.startDrag('row', rowIndex);
        this.view.showRowDragFeedback(rowIndex);
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', row.outerHTML);
        
        if (this.config.rowDragging.onDragStart) {
          this.config.rowDragging.onDragStart(rowIndex, this.model.getRow(rowIndex));
        }
      }
    }, 'row-drag');
    
    this.view.addEventListener(this.view.element, 'dragover', (e) => {
      if (this.model.dragType === 'row') {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const row = e.target.closest('tr');
        if (row) {
          const targetIndex = parseInt(row.getAttribute('data-row-index'));
          this.model.setDropTarget(targetIndex);
          this.view.showRowDropZone(targetIndex);
          
          if (this.config.rowDragging.onDragOver) {
            this.config.rowDragging.onDragOver(this.model.dragIndex, targetIndex);
          }
        }
      }
    }, 'row-drag');
    
    this.view.addEventListener(this.view.element, 'drop', (e) => {
      if (this.model.dragType === 'row') {
        e.preventDefault();
        
        const row = e.target.closest('tr');
        if (row) {
          const targetIndex = parseInt(row.getAttribute('data-row-index'));
          const sourceIndex = this.model.dragIndex;
          
          if (sourceIndex !== null && sourceIndex !== targetIndex) {
            const newData = this.model.moveRow(sourceIndex, targetIndex);
            this.view.updateRowOrder(newData);
            this.updateSelection();
            
            if (this.config.rowDragging.onDrop) {
              this.config.rowDragging.onDrop(sourceIndex, targetIndex, newData);
            }
          }
        }
        
        this.view.hideRowDragFeedback();
        this.model.endDrag();
      }
    }, 'row-drag');
    
    this.view.addEventListener(this.view.element, 'dragend', () => {
      if (this.model.dragType === 'row') {
        this.view.hideRowDragFeedback();
        this.model.endDrag();
        
        if (this.config.rowDragging.onDragCancel) {
          this.config.rowDragging.onDragCancel();
        }
      }
    }, 'row-drag');
  }
  
  setupColumnDragging() {
    this.view.addEventListener(this.view.element, 'dragstart', (e) => {
      const header = e.target.closest('.column-header');
      if (header) {
        const columnIndex = parseInt(header.getAttribute('data-column-index'));
        const column = this.displayColumns[columnIndex];
        
        // Check if column is fixed
        if (this.config.columnDragging.fixedColumns?.includes(column.key)) {
          e.preventDefault();
          return;
        }
        
        this.model.startDrag('column', columnIndex);
        this.view.showColumnDragFeedback(columnIndex);
        
        e.dataTransfer.effectAllowed = 'move';
        
        if (this.config.columnDragging.onColumnDragStart) {
          this.config.columnDragging.onColumnDragStart(column.key, columnIndex);
        }
      }
    }, 'column-drag');
    
    this.view.addEventListener(this.view.element, 'dragover', (e) => {
      if (this.model.dragType === 'column') {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }
    }, 'column-drag');
    
    this.view.addEventListener(this.view.element, 'drop', (e) => {
      if (this.model.dragType === 'column') {
        e.preventDefault();
        
        const header = e.target.closest('.column-header');
        if (header) {
          const targetIndex = parseInt(header.getAttribute('data-column-index'));
          const sourceIndex = this.model.dragIndex;
          
          if (sourceIndex !== null && sourceIndex !== targetIndex) {
            const newColumns = this.model.moveColumn(sourceIndex, targetIndex);
            this.view.updateColumnOrder(newColumns);
            
            if (this.config.columnDragging.onColumnDrop) {
              this.config.columnDragging.onColumnDrop(sourceIndex, targetIndex, newColumns);
            }
            
            if (this.config.columnDragging.onColumnOrderChange) {
              this.config.columnDragging.onColumnOrderChange(newColumns.map(col => col.key));
            }
          }
        }
        
        this.view.hideColumnDragFeedback();
        this.model.endDrag();
      }
    }, 'column-drag');
    
    this.view.addEventListener(this.view.element, 'dragend', () => {
      if (this.model.dragType === 'column') {
        this.view.hideColumnDragFeedback();
        this.model.endDrag();
      }
    }, 'column-drag');
    
    // Make column headers draggable
    setTimeout(() => {
      const headers = this.view.element.querySelectorAll('.column-header');
      headers.forEach(header => {
        header.setAttribute('draggable', 'true');
      });
    }, 0);
  }
  
  // Column resizing
  setupResizeHandlers() {
    if (!this.config.columnResizing?.enabled) return;
    
    this.view.addEventListener(this.view.element, 'mousedown', (e) => {
      const resizeHandle = e.target.closest('.resize-handle');
      if (resizeHandle) {
        this.startColumnResize(e, resizeHandle);
      }
    }, 'column-resize');
  }
  
  startColumnResize(e, resizeHandle) {
    e.preventDefault();
    
    const columnKey = resizeHandle.getAttribute('data-column-key');
    const th = resizeHandle.parentElement;
    const startX = e.clientX;
    const startWidth = th.offsetWidth;
    
    this.view.showResizeFeedback(columnKey);
    
    if (this.config.columnResizing.onResizeStart) {
      this.config.columnResizing.onResizeStart(columnKey);
    }
    
    const handleMouseMove = (e) => {
      const diff = e.clientX - startX;
      const newWidth = startWidth + diff;
      
      // Apply constraints
      const column = this.displayColumns.find(col => col.key === columnKey);
      const minWidth = this.parseWidth(column.minWidth || this.config.columnResizing.minWidth || '50px');
      const maxWidth = this.parseWidth(column.maxWidth || this.config.columnResizing.maxWidth || '800px');
      
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      const widthStr = `${constrainedWidth}px`;
      
      this.model.resizeColumn(columnKey, widthStr);
      this.view.updateColumnWidth(columnKey, widthStr);
      
      if (this.config.columnResizing.onColumnResize) {
        this.config.columnResizing.onColumnResize(columnKey, `${startWidth}px`, widthStr);
      }
    };
    
    const handleMouseUp = () => {
      this.view.hideResizeFeedback();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      if (this.config.columnResizing.onResizeEnd) {
        const finalWidth = this.model.getColumnWidth(columnKey);
        this.config.columnResizing.onResizeEnd(columnKey, finalWidth);
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
  
  parseWidth(widthStr) {
    return parseInt(String(widthStr).replace('px', '')) || 150;
  }
  
  // Public API methods
  getData() {
    return this.displayData;
  }
  
  setData(newData) {
    this.model.setData(newData);
    this.render();
  }
  
  getSelectedRows() {
    return this.model.getSelectedRows();
  }
  
  selectRow(index) {
    this.model.selectRow(index);
    this.updateSelection();
  }
  
  deselectRow(index) {
    this.model.deselectRow(index);
    this.updateSelection();
  }
  
  clearSelection() {
    this.model.clearSelection();
    this.updateSelection();
  }
  
  addRow(newRow) {
    const newIndex = this.model.addRow(newRow);
    this.render();
    return newIndex;
  }
  
  deleteRows(indices) {
    this.model.deleteRows(indices);
    this.render();
  }
  
  validateAll() {
    return this.model.validateAll();
  }
  
  // Cleanup
  destroy() {
    this.cancelEdit();
    this.view.destroy();
  }
}