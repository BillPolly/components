/**
 * @jest-environment jsdom
 */

// Create a simple mock for HierarchyEditor
const createMockEditor = (config) => {
  const mockEditor = {
    render: jest.fn(),
    destroy: jest.fn(),
    setMode: jest.fn(),
    expandAll: jest.fn(),
    collapseAll: jest.fn(),
    loadContent: jest.fn(),
    setContent: jest.fn(),
    getContent: jest.fn(() => '{"test": "data"}'),
    addNode: jest.fn(),
    editNode: jest.fn(),
    deleteNode: jest.fn(),
    bulkOperation: jest.fn((fn) => fn()),
    getTreeData: jest.fn(() => ({ id: 'root', children: [] })),
    setTheme: jest.fn(),
    setEditable: jest.fn(),
    validate: jest.fn(() => ({ valid: true }))
  };
  
  // Call mount callback if provided
  if (config.onMount) {
    config.onMount(mockEditor);
  }
  
  return mockEditor;
};

// Mock the HierarchyEditor module
jest.mock('../src/components/hierarchy-editor/index.js', () => ({
  HierarchyEditor: {
    create: createMockEditor
  }
}));

describe('HierarchyEditorDemo Simple Test', () => {
  let container;
  
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // Clear module cache to ensure clean state
    jest.resetModules();
  });
  
  afterEach(() => {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    jest.clearAllMocks();
  });
  
  test('should follow umbilical protocol', async () => {
    // Dynamically import after mocks are set up
    const { HierarchyEditorDemo } = await import('../src/components/hierarchy-editor-demo/index.js');
    
    // Test introspection mode
    let requirements = null;
    HierarchyEditorDemo.create({
      describe: (reqs) => { requirements = reqs; }
    });
    
    expect(requirements).toBeDefined();
    const reqList = requirements.getAll();
    expect(reqList.dom).toBeDefined();
    expect(reqList.theme).toBeDefined();
    
    // Test validation mode
    const validation = HierarchyEditorDemo.create({
      validate: (checks) => checks
    });
    
    expect(validation.hasValidTheme).toBeDefined();
    expect(validation.hasValidMaxEntries).toBeDefined();
    
    // Test instance creation
    const demo = HierarchyEditorDemo.create({
      dom: container
    });
    
    expect(demo).toBeDefined();
    expect(typeof demo.destroy).toBe('function');
    expect(typeof demo.getEditorInstance).toBe('function');
    
    demo.destroy();
  });
  
  test('should render demo sections and handle interactions', async () => {
    const { HierarchyEditorDemo } = await import('../src/components/hierarchy-editor-demo/index.js');
    const { HierarchyEditor } = await import('../src/components/hierarchy-editor/index.js');
    
    const demo = HierarchyEditorDemo.create({
      dom: container,
      theme: 'light'
    });
    
    // Check that HierarchyEditor.create was called
    expect(HierarchyEditor.create).toHaveBeenCalledTimes(5);
    
    // Check DOM rendering
    expect(container.querySelector('.hierarchy-editor-demo')).toBeTruthy();
    expect(container.querySelector('[data-demo="basic"]')).toBeTruthy();
    expect(container.querySelector('[data-demo="format"]')).toBeTruthy();
    expect(container.querySelector('[data-demo="edit"]')).toBeTruthy();
    expect(container.querySelector('[data-demo="event"]')).toBeTruthy();
    expect(container.querySelector('[data-demo="advanced"]')).toBeTruthy();
    
    // Test button interactions
    const treeModeBtn = container.querySelector('[data-action="tree-mode"][data-editor="basic"]');
    expect(treeModeBtn).toBeTruthy();
    
    const basicEditor = demo.getEditorInstance('basic');
    expect(basicEditor).toBeDefined();
    
    // Click tree mode button
    treeModeBtn.click();
    expect(basicEditor.setMode).toHaveBeenCalledWith('tree');
    
    // Test format card click
    const jsonCard = container.querySelector('[data-format="json"]');
    expect(jsonCard).toBeTruthy();
    jsonCard.click();
    
    const formatEditor = demo.getEditorInstance('format');
    expect(formatEditor.loadContent).toHaveBeenCalled();
    
    // Test event logging
    const eventLog = container.querySelector('[data-event-log]');
    expect(eventLog).toBeTruthy();
    
    // Should have events logged
    const events = demo.getEventLog();
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
    
    // Test theme toggle
    const themeBtn = container.querySelector('[data-action="toggle-theme"]');
    themeBtn.click();
    
    const demoEl = container.querySelector('.hierarchy-editor-demo');
    expect(demoEl.classList.contains('theme-dark')).toBe(true);
    
    // Test public API
    const state = demo.getState();
    expect(state).toHaveProperty('editorCount', 5);
    expect(state).toHaveProperty('theme', 'dark');
    
    demo.destroy();
  });
  
  test('should handle programmatic user interactions', async () => {
    const { HierarchyEditorDemo } = await import('../src/components/hierarchy-editor-demo/index.js');
    
    const demo = HierarchyEditorDemo.create({
      dom: container
    });
    
    // Test programmatic theme change
    demo.setTheme('dark');
    const demoEl = container.querySelector('.hierarchy-editor-demo');
    expect(demoEl.classList.contains('theme-dark')).toBe(true);
    
    // Test loading sample data
    demo.loadSampleData('format', 'yaml');
    const formatEditor = demo.getEditorInstance('format');
    expect(formatEditor.loadContent).toHaveBeenCalled();
    
    // Test clear event log
    demo.clearEventLog();
    const eventLog = demo.getEventLog();
    expect(eventLog).toHaveLength(0);
    
    // Test getting all editor instances
    const allEditors = demo.getAllEditorInstances();
    expect(allEditors).toHaveLength(5);
    expect(allEditors.map(([name]) => name)).toEqual(
      expect.arrayContaining(['basic', 'format', 'edit', 'event', 'advanced'])
    );
    
    demo.destroy();
  });
});