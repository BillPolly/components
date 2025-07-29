/**
 * GraphEditorDemo Component Tests
 * 
 * Comprehensive testing of the entire demo page as an umbilical component
 */

import { GraphEditorDemo } from '../../../src/components/graph-editor-demo/index.js';

describe('GraphEditorDemo Component', () => {
  let container;
  let demo;
  
  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '1200px';
    container.style.height = '800px';
    document.body.appendChild(container);
  });
  
  afterEach(() => {
    if (demo && demo.destroy) {
      demo.destroy();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });
  
  describe('Umbilical Protocol Compliance', () => {
    test('should support introspection mode', () => {
      let requirements = null;
      
      GraphEditorDemo.create({
        describe: (reqs) => {
          requirements = reqs.getAll();
        }
      });
      
      expect(requirements).toBeDefined();
      expect(requirements.dom).toBeDefined();
      expect(requirements.dom.type).toBe('HTMLElement');
      expect(requirements.dom.description).toBe('Parent DOM element');
    });
    
    test('should support validation mode', () => {
      const validation = GraphEditorDemo.create({
        validate: (checks) => checks
      });
      
      expect(validation).toBeDefined();
      expect(validation.hasDomElement).toBeDefined();
    });
    
    test('should validate DOM element correctly', () => {
      const validValidation = GraphEditorDemo.create({
        validate: (checks) => checks,
        dom: container
      });
      
      const invalidValidation = GraphEditorDemo.create({
        validate: (checks) => checks,
        dom: null
      });
      
      expect(validValidation.hasDomElement).toBe(true);
      expect(invalidValidation.hasDomElement).toBe(false);
    });
  });
  
  describe('Component Creation and UI', () => {
    test('should create demo instance with complete UI', () => {
      let mountCalled = false;
      
      demo = GraphEditorDemo.create({
        dom: container,
        onMount: (instance) => {
          mountCalled = true;
          expect(instance.getEditor()).toBeDefined();
        }
      });
      
      expect(demo).toBeDefined();
      expect(mountCalled).toBe(true);
      
      // Check main structure
      const demoContainer = container.querySelector('.graph-editor-demo');
      expect(demoContainer).toBeTruthy();
      
      // Check header
      const header = demoContainer.querySelector('.demo-header');
      expect(header).toBeTruthy();
      expect(header.querySelector('h1').textContent).toBe('Graph Editor Demo');
      
      // Check toolbar
      const toolbar = demoContainer.querySelector('.demo-toolbar');
      expect(toolbar).toBeTruthy();
      
      // Check all required buttons exist
      const buttons = [
        'selectToolBtn', 'panToolBtn', 'addNodeBtn', 'deleteBtn', 'connectBtn',
        'undoBtn', 'redoBtn', 'clearBtn', 'layoutBtn', 'zoomFitBtn', 
        'resetBtn', 'saveBtn', 'loadBtn'
      ];
      
      buttons.forEach(buttonId => {
        const button = demoContainer.querySelector(`#${buttonId}`);
        expect(button).toBeTruthy();
        expect(button.tagName).toBe('BUTTON');
      });
      
      // Check editor container
      const editorContainer = demoContainer.querySelector('#editorContainer');
      expect(editorContainer).toBeTruthy();
      
      // Check status panel
      const statusElements = ['nodeCount', 'edgeCount', 'selectionCount', 'activeTool', 'zoomLevel'];
      statusElements.forEach(elementId => {
        const element = demoContainer.querySelector(`#${elementId}`);
        expect(element).toBeTruthy();
      });
      
      // Check event log
      const eventLog = demoContainer.querySelector('#eventLog');
      expect(eventLog).toBeTruthy();
    });
    
    test('should initialize with sample graph', async () => {
      demo = GraphEditorDemo.create({
        dom: container
      });
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const editor = demo.getEditor();
      expect(editor).toBeDefined();
      
      // Check sample graph was created
      const model = editor.getModel();
      const nodes = model.getSceneGraph().getAllNodes();
      const edges = model.getEdges();
      
      expect(nodes.length).toBe(6); // root + 5 sample nodes
      expect(edges.length).toBe(5); // 5 sample edges
      
      // Check specific nodes exist
      expect(model.getSceneGraph().getNodeById('start')).toBeDefined();
      expect(model.getSceneGraph().getNodeById('process1')).toBeDefined();
      expect(model.getSceneGraph().getNodeById('process2')).toBeDefined();
      expect(model.getSceneGraph().getNodeById('decision')).toBeDefined();
      expect(model.getSceneGraph().getNodeById('end')).toBeDefined();
    });
    
    test('should update status display correctly', async () => {
      demo = GraphEditorDemo.create({
        dom: container
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const demoContainer = container.querySelector('.graph-editor-demo');
      
      // Check initial status
      expect(demoContainer.querySelector('#nodeCount').textContent).toBe('5');
      expect(demoContainer.querySelector('#edgeCount').textContent).toBe('5');
      expect(demoContainer.querySelector('#selectionCount').textContent).toBe('0');
      expect(demoContainer.querySelector('#activeTool').textContent).toBe('select');
      expect(demoContainer.querySelector('#zoomLevel').textContent).toBe('100%');
    });
  });
  
  describe('Interactive Functionality', () => {
    beforeEach(async () => {
      demo = GraphEditorDemo.create({
        dom: container
      });
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    test('should handle add node button click', () => {
      const demoContainer = container.querySelector('.graph-editor-demo');
      const addButton = demoContainer.querySelector('#addNodeBtn');
      const editor = demo.getEditor();
      const model = editor.getModel();
      
      // Get initial count
      const initialNodeCount = model.getSceneGraph().getAllNodes().length;
      
      // Click add node button
      addButton.click();
      
      // Check node was added
      const newNodeCount = model.getSceneGraph().getAllNodes().length;
      expect(newNodeCount).toBe(initialNodeCount + 1);
      
      // Check status updated
      expect(demoContainer.querySelector('#nodeCount').textContent).toBe('6');
    });
    
    test('should handle multiple add node operations', () => {
      const demoContainer = container.querySelector('.graph-editor-demo');
      const addButton = demoContainer.querySelector('#addNodeBtn');
      const editor = demo.getEditor();
      const model = editor.getModel();
      
      const initialNodeCount = model.getSceneGraph().getAllNodes().length;
      
      // Add 3 nodes
      addButton.click();
      addButton.click();
      addButton.click();
      
      // Check all nodes were added
      const finalNodeCount = model.getSceneGraph().getAllNodes().length;
      expect(finalNodeCount).toBe(initialNodeCount + 3);
      
      // Check status updated
      expect(demoContainer.querySelector('#nodeCount').textContent).toBe('8');
    });
    
    test('should handle tool switching', () => {
      const demoContainer = container.querySelector('.graph-editor-demo');
      const selectBtn = demoContainer.querySelector('#selectToolBtn');
      const panBtn = demoContainer.querySelector('#panToolBtn');
      const editor = demo.getEditor();
      const coordinator = editor.getViewModel().getEventCoordinator();
      
      // Initially select tool should be active
      expect(coordinator.getActiveTool().name).toBe('select');
      expect(selectBtn.classList.contains('primary')).toBe(true);
      expect(panBtn.classList.contains('primary')).toBe(false);
      
      // Click pan tool
      panBtn.click();
      
      expect(coordinator.getActiveTool().name).toBe('pan');
      expect(selectBtn.classList.contains('primary')).toBe(false);
      expect(panBtn.classList.contains('primary')).toBe(true);
      expect(demoContainer.querySelector('#activeTool').textContent).toBe('pan');
      
      // Switch back to select
      selectBtn.click();
      
      expect(coordinator.getActiveTool().name).toBe('select');
      expect(selectBtn.classList.contains('primary')).toBe(true);
      expect(panBtn.classList.contains('primary')).toBe(false);
      expect(demoContainer.querySelector('#activeTool').textContent).toBe('select');
    });
    
    test('should handle undo/redo operations', () => {
      const demoContainer = container.querySelector('.graph-editor-demo');
      const addButton = demoContainer.querySelector('#addNodeBtn');
      const undoButton = demoContainer.querySelector('#undoBtn');
      const redoButton = demoContainer.querySelector('#redoBtn');
      const editor = demo.getEditor();
      const model = editor.getModel();
      const viewModel = editor.getViewModel();
      
      const initialNodeCount = model.getSceneGraph().getAllNodes().length;
      
      // Initially undo/redo should be disabled
      expect(undoButton.disabled).toBe(true);
      expect(redoButton.disabled).toBe(true);
      
      // Add a node
      addButton.click();
      expect(model.getSceneGraph().getAllNodes().length).toBe(initialNodeCount + 1);
      
      // Undo should now be enabled
      expect(undoButton.disabled).toBe(false);
      expect(redoButton.disabled).toBe(true);
      
      // Undo the add
      undoButton.click();
      expect(model.getSceneGraph().getAllNodes().length).toBe(initialNodeCount);
      
      // Redo should now be enabled
      expect(undoButton.disabled).toBe(true);
      expect(redoButton.disabled).toBe(false);
      
      // Redo the add
      redoButton.click();
      expect(model.getSceneGraph().getAllNodes().length).toBe(initialNodeCount + 1);
    });
    
    test('should handle clear operation', () => {
      const demoContainer = container.querySelector('.graph-editor-demo');
      const clearButton = demoContainer.querySelector('#clearBtn');
      const editor = demo.getEditor();
      const model = editor.getModel();
      
      // Mock confirm dialog
      const originalConfirm = window.confirm;
      window.confirm = () => true;
      
      try {
        // Clear the graph
        clearButton.click();
        
        // Check graph was cleared (only root should remain)
        expect(model.getSceneGraph().getAllNodes().length).toBe(1);
        expect(model.getEdges().length).toBe(0);
        
        // Check status updated
        expect(demoContainer.querySelector('#nodeCount').textContent).toBe('0');
        expect(demoContainer.querySelector('#edgeCount').textContent).toBe('0');
        
      } finally {
        window.confirm = originalConfirm;
      }
    });
    
    test('should handle save operation', () => {
      const demoContainer = container.querySelector('.graph-editor-demo');
      const saveButton = demoContainer.querySelector('#saveBtn');
      
      // Mock URL.createObjectURL and related APIs
      const mockCreateObjectURL = jest.fn(() => 'mock-url');
      const mockRevokeObjectURL = jest.fn();
      const mockClick = jest.fn();
      
      global.URL = {
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL
      };
      
      // Mock document.createElement for 'a' element
      const originalCreateElement = document.createElement;
      document.createElement = jest.fn((tagName) => {
        if (tagName === 'a') {
          return {
            href: '',
            download: '',
            click: mockClick
          };
        }
        return originalCreateElement.call(document, tagName);
      });
      
      try {
        // Click save button
        saveButton.click();
        
        // Check save process was initiated
        expect(mockCreateObjectURL).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
        expect(mockRevokeObjectURL).toHaveBeenCalled();
        
      } finally {
        document.createElement = originalCreateElement;
      }
    });
    
    test('should log events correctly', () => {
      const demoContainer = container.querySelector('.graph-editor-demo');
      const eventLog = demoContainer.querySelector('#eventLog');
      const addButton = demoContainer.querySelector('#addNodeBtn');
      
      // Check initial log entries exist
      const initialEntries = eventLog.querySelectorAll('.log-entry');
      expect(initialEntries.length).toBeGreaterThan(0);
      
      // Add a node and check log entry was added
      const initialCount = initialEntries.length;
      addButton.click();
      
      const newEntries = eventLog.querySelectorAll('.log-entry');
      expect(newEntries.length).toBeGreaterThan(initialCount);
      
      // Check the last entry is about adding a node
      const lastEntry = newEntries[newEntries.length - 1];
      expect(lastEntry.textContent).toContain('Added node:');
    });
  });
  
  describe('Component Lifecycle', () => {
    test('should call onMount callback', () => {
      let mountCalled = false;
      let mountedInstance = null;
      
      demo = GraphEditorDemo.create({
        dom: container,
        onMount: (instance) => {
          mountCalled = true;
          mountedInstance = instance;
        }
      });
      
      expect(mountCalled).toBe(true);
      expect(mountedInstance).toBe(demo);
      expect(mountedInstance.getEditor()).toBeDefined();
    });
    
    test('should call onDestroy callback', () => {
      let destroyCalled = false;
      let destroyedInstance = null;
      
      demo = GraphEditorDemo.create({
        dom: container,
        onDestroy: (instance) => {
          destroyCalled = true;
          destroyedInstance = instance;
        }
      });
      
      demo.destroy();
      
      expect(destroyCalled).toBe(true);
      expect(destroyedInstance).toBe(demo);
    });
    
    test('should clean up properly on destroy', () => {
      demo = GraphEditorDemo.create({
        dom: container
      });
      
      // Check component is mounted
      const demoContainer = container.querySelector('.graph-editor-demo');
      expect(demoContainer).toBeTruthy();
      
      // Destroy the component
      demo.destroy();
      
      // Check cleanup
      const cleanedContainer = container.querySelector('.graph-editor-demo');
      expect(cleanedContainer).toBeFalsy();
    });
    
    test('should handle multiple destroy calls gracefully', () => {
      demo = GraphEditorDemo.create({
        dom: container
      });
      
      expect(() => {
        demo.destroy();
        demo.destroy(); // Second call should not throw
        demo.destroy(); // Third call should not throw
      }).not.toThrow();
    });
  });
  
  describe('Error Handling', () => {
    test('should handle missing DOM gracefully', () => {
      expect(() => {
        GraphEditorDemo.create({
          dom: null
        });
      }).toThrow();
    });
    
    test('should handle editor initialization errors', () => {
      // This test verifies the component doesn't crash if editor fails to initialize
      const invalidContainer = document.createElement('span'); // Invalid container
      
      let demo;
      expect(() => {
        demo = GraphEditorDemo.create({
          dom: invalidContainer
        });
      }).not.toThrow();
      
      if (demo) {
        demo.destroy();
      }
    });
  });
});