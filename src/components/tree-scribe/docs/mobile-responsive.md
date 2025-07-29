# TreeScribe Mobile Responsiveness Guide

## Overview
TreeScribe is designed to provide an excellent user experience across all device sizes, from mobile phones to desktop monitors, with touch-friendly interactions and responsive layouts.

## Responsive Design Principles

### Mobile-First Approach
TreeScribe uses a mobile-first design strategy, starting with mobile layouts and progressively enhancing for larger screens.

```css
/* Base styles for mobile */
.tree-scribe {
  font-size: 16px; /* Prevent zoom on iOS */
  line-height: 1.5;
  padding: 8px;
}

/* Tablet styles */
@media (min-width: 768px) {
  .tree-scribe {
    font-size: 14px;
    padding: 16px;
  }
}

/* Desktop styles */
@media (min-width: 1024px) {
  .tree-scribe {
    font-size: 13px;
    padding: 24px;
  }
}
```

## Breakpoint Strategy

### Primary Breakpoints
- **Mobile**: 320px - 767px (portrait and landscape phones)
- **Tablet**: 768px - 1023px (tablets and small laptops)
- **Desktop**: 1024px+ (laptops and desktops)

### Component-Specific Breakpoints
```javascript
const breakpoints = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  widescreen: 1440
};

// Responsive configuration
const getResponsiveConfig = () => {
  const width = window.innerWidth;
  
  if (width < breakpoints.mobile) {
    return {
      nodeIndent: 12,
      fontSize: 16,
      touchTargetSize: 44,
      showAllControls: false,
      enableVirtualScroll: false // Better performance on small screens
    };
  } else if (width < breakpoints.tablet) {
    return {
      nodeIndent: 16,
      fontSize: 15,
      touchTargetSize: 40,
      showAllControls: true,
      enableVirtualScroll: false
    };
  } else {
    return {
      nodeIndent: 20,
      fontSize: 14,
      touchTargetSize: 32,
      showAllControls: true,
      enableVirtualScroll: true
    };
  }
};
```

## Touch-Friendly Interactions

### Touch Target Sizing
All interactive elements meet WCAG AA guidelines (minimum 44px for touch targets).

```css
/* Touch-friendly node toggles */
.tree-node-toggle {
  min-width: 44px;
  min-height: 44px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Larger touch targets on smaller screens */
@media (max-width: 480px) {
  .tree-node-toggle {
    min-width: 48px;
    min-height: 48px;
  }
}

/* Mouse-optimized targets on desktop */
@media (pointer: fine) {
  .tree-node-toggle {
    min-width: 32px;
    min-height: 32px;
    padding: 8px;
  }
}
```

### Touch Gestures Support
```javascript
class TouchGestureHandler {
  constructor(treeScribe) {
    this.treeScribe = treeScribe;
    this.touchStartY = 0;
    this.touchStartX = 0;
    this.touchThreshold = 50;
    
    this.setupTouchHandlers();
  }
  
  setupTouchHandlers() {
    const container = this.treeScribe.container;
    
    // Touch scroll optimization
    container.addEventListener('touchstart', (e) => {
      this.touchStartY = e.touches[0].clientY;
      this.touchStartX = e.touches[0].clientX;
    }, { passive: true });
    
    // Swipe gestures for navigation
    container.addEventListener('touchend', (e) => {
      if (!e.changedTouches[0]) return;
      
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndX = e.changedTouches[0].clientX;
      
      const deltaY = this.touchStartY - touchEndY;
      const deltaX = this.touchStartX - touchEndX;
      
      // Horizontal swipe for folding/expanding
      if (Math.abs(deltaX) > this.touchThreshold && Math.abs(deltaY) < this.touchThreshold) {
        const nodeElement = e.target.closest('.tree-node');
        if (nodeElement) {
          const nodeId = nodeElement.dataset.nodeId;
          if (deltaX > 0) {
            // Swipe left to collapse
            this.treeScribe.setNodeState(nodeId, { expanded: false });
          } else {
            // Swipe right to expand
            this.treeScribe.setNodeState(nodeId, { expanded: true });
          }
        }
      }
    }, { passive: true });
  }
}
```

## Responsive Layout Components

### Header Layout
```css
.tree-scribe-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
}

@media (min-width: 768px) {
  .tree-scribe-header {
    flex-direction: row;
    align-items: center;
    gap: 16px;
    padding: 16px;
  }
}

/* Search input responsive sizing */
.tree-scribe-search input {
  width: 100%;
  min-width: 200px;
  font-size: 16px; /* Prevent zoom on iOS */
}

@media (min-width: 768px) {
  .tree-scribe-search input {
    width: 300px;
    font-size: 14px;
  }
}
```

### Control Button Layout
```css
.tree-scribe-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: space-between;
}

@media (max-width: 480px) {
  .tree-scribe-controls {
    flex-direction: column;
  }
  
  .tree-scribe-controls button {
    width: 100%;
    padding: 12px;
    font-size: 16px;
  }
}

@media (min-width: 768px) {
  .tree-scribe-controls {
    justify-content: flex-start;
  }
  
  .tree-scribe-controls button {
    width: auto;
    padding: 8px 16px;
    font-size: 14px;
  }
}
```

### Tree Node Layout
```css
.tree-node {
  display: flex;
  align-items: flex-start;
  min-height: 44px; /* Touch-friendly minimum */
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.tree-node-content {
  flex: 1;
  min-width: 0; /* Allow text to truncate */
  padding-left: 8px;
}

/* Mobile-specific node styling */
@media (max-width: 767px) {
  .tree-node {
    flex-direction: column;
    align-items: stretch;
  }
  
  .tree-node-content {
    padding-left: 0;
    padding-top: 8px;
  }
  
  /* Larger text on mobile for readability */
  .tree-node-title {
    font-size: 18px;
    line-height: 1.3;
  }
  
  .tree-node-description {
    font-size: 16px;
    line-height: 1.4;
    margin-top: 4px;
  }
}
```

## Viewport and Orientation Handling

### Viewport Meta Tag
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

### Orientation Change Handling
```javascript
class ResponsiveManager {
  constructor(treeScribe) {
    this.treeScribe = treeScribe;
    this.currentOrientation = screen.orientation?.type || 'portrait-primary';
    
    this.setupOrientationHandling();
    this.setupResizeHandling();
  }
  
  setupOrientationHandling() {
    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
      // Delay to allow browser to finish orientation change
      setTimeout(() => {
        this.handleOrientationChange();
      }, 100);
    });
    
    // Also listen for resize as fallback
    window.addEventListener('resize', this.debounce(() => {
      this.handleResize();
    }, 250));
  }
  
  handleOrientationChange() {
    const newOrientation = screen.orientation?.type || 'portrait-primary';
    
    if (newOrientation !== this.currentOrientation) {
      this.currentOrientation = newOrientation;
      
      // Recalculate layout
      this.treeScribe.viewModel.render();
      
      // Adjust virtual scrolling if enabled
      if (this.treeScribe.virtualScrollManager) {
        this.treeScribe.virtualScrollManager.recalculate();
      }
      
      // Update responsive configuration
      this.updateResponsiveConfig();
    }
  }
  
  updateResponsiveConfig() {
    const config = getResponsiveConfig();
    
    // Apply new configuration
    this.treeScribe.container.style.setProperty('--node-indent', `${config.nodeIndent}px`);
    this.treeScribe.container.style.setProperty('--font-size', `${config.fontSize}px`);
    this.treeScribe.container.style.setProperty('--touch-target-size', `${config.touchTargetSize}px`);
  }
  
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}
```

## Mobile-Specific Features

### Virtual Keyboard Handling
```javascript
class VirtualKeyboardHandler {
  constructor(treeScribe) {
    this.treeScribe = treeScribe;
    this.originalViewportHeight = window.visualViewport?.height || window.innerHeight;
    
    this.setupKeyboardHandling();
  }
  
  setupKeyboardHandling() {
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        this.handleKeyboardResize();
      });
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', () => {
        this.handleKeyboardResize();
      });
    }
  }
  
  handleKeyboardResize() {
    const currentHeight = window.visualViewport?.height || window.innerHeight;
    const heightDiff = this.originalViewportHeight - currentHeight;
    
    if (heightDiff > 150) {
      // Virtual keyboard is likely open
      this.treeScribe.container.classList.add('keyboard-open');
      
      // Adjust container height
      this.treeScribe.container.style.height = `${currentHeight - 60}px`;
    } else {
      // Virtual keyboard is likely closed
      this.treeScribe.container.classList.remove('keyboard-open');
      this.treeScribe.container.style.height = '';
    }
  }
}
```

### Pull-to-Refresh Prevention
```javascript
// Prevent pull-to-refresh on mobile browsers
function preventPullToRefresh(container) {
  let startY = 0;
  
  container.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
  }, { passive: true });
  
  container.addEventListener('touchmove', (e) => {
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;
    
    // If scrolling up and at the top, prevent default
    if (deltaY > 0 && container.scrollTop === 0) {
      e.preventDefault();
    }
  }, { passive: false });
}
```

## Performance Optimizations for Mobile

### Reduced Animation on Low-End Devices
```javascript
function detectLowEndDevice() {
  // Simple heuristics for low-end device detection
  const memoryLimit = navigator.deviceMemory && navigator.deviceMemory < 4;
  const slowConnection = navigator.connection && 
    (navigator.connection.effectiveType === 'slow-2g' || 
     navigator.connection.effectiveType === '2g');
  const oldDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
  
  return memoryLimit || slowConnection || oldDevice;
}

// Apply performance optimizations
const isLowEndDevice = detectLowEndDevice();

const treeScribe = new TreeScribeInstance({
  dom: container,
  options: {
    enableAnimations: !isLowEndDevice,
    enableVirtualScroll: !isLowEndDevice,
    maxCacheSize: isLowEndDevice ? 50 : 200,
    debounceSearch: isLowEndDevice ? 500 : 300
  }
});
```

### Touch Scroll Optimization
```css
/* Enable momentum scrolling on iOS */
.tree-scribe-content {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

/* Optimize rendering during scroll */
.tree-scribe-tree {
  will-change: scroll-position;
  transform: translateZ(0); /* Create compositing layer */
}

/* Reduce paint during scroll */
@media (max-width: 767px) {
  .tree-node {
    will-change: transform;
    contain: layout style paint;
  }
}
```

## Testing Strategy

### Device Testing Matrix
| Device Category | Screen Size | Test Scenarios |
|----------------|-------------|----------------|
| Small Phone | 320px-480px | Basic functionality, touch targets |
| Large Phone | 480px-767px | Full features, landscape mode |
| Tablet | 768px-1023px | Split view, multitasking |
| Desktop | 1024px+ | Full feature set, mouse interaction |

### Responsive Test Scenarios

#### Mobile Portrait (320px-767px)
```javascript
// Test mobile portrait layout
describe('Mobile Portrait Layout', () => {
  beforeEach(() => {
    // Set viewport size
    Object.defineProperty(window, 'innerWidth', { value: 375 });
    Object.defineProperty(window, 'innerHeight', { value: 667 });
    
    // Trigger resize
    window.dispatchEvent(new Event('resize'));
  });
  
  test('should stack controls vertically', () => {
    const controls = container.querySelector('.tree-scribe-controls');
    const computedStyle = getComputedStyle(controls);
    expect(computedStyle.flexDirection).toBe('column');
  });
  
  test('should have touch-friendly target sizes', () => {
    const toggles = container.querySelectorAll('.tree-node-toggle');
    toggles.forEach(toggle => {
      const rect = toggle.getBoundingClientRect();
      expect(Math.min(rect.width, rect.height)).toBeGreaterThanOrEqual(44);
    });
  });
  
  test('should prevent text zoom on iOS', () => {
    const searchInput = container.querySelector('.tree-scribe-search input');
    const fontSize = parseInt(getComputedStyle(searchInput).fontSize);
    expect(fontSize).toBeGreaterThanOrEqual(16);
  });
});
```

#### Tablet Landscape (768px-1023px)
```javascript
describe('Tablet Landscape Layout', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1024 });
    Object.defineProperty(window, 'innerHeight', { value: 768 });
    window.dispatchEvent(new Event('resize'));
  });
  
  test('should show horizontal control layout', () => {
    const header = container.querySelector('.tree-scribe-header');
    const computedStyle = getComputedStyle(header);
    expect(computedStyle.flexDirection).toBe('row');
  });
  
  test('should enable advanced features', () => {
    expect(treeScribe.virtualScrollManager).toBeDefined();
    expect(treeScribe.searchManager).toBeDefined();
  });
});
```

### Touch Interaction Testing
```javascript
// Simulate touch events for testing
function simulateTouch(element, type, coords) {
  const touch = new Touch({
    identifier: 1,
    target: element,
    clientX: coords.x,
    clientY: coords.y,
    radiusX: 2.5,
    radiusY: 2.5,
    force: 0.5
  });
  
  const touchEvent = new TouchEvent(type, {
    cancelable: true,
    bubbles: true,
    touches: [touch],
    targetTouches: [touch],
    changedTouches: [touch]
  });
  
  element.dispatchEvent(touchEvent);
}

// Test touch interactions
test('should handle node toggle on touch', () => {
  const nodeToggle = container.querySelector('.tree-node-toggle');
  const nodeId = nodeToggle.closest('.tree-node').dataset.nodeId;
  
  // Simulate touch tap
  simulateTouch(nodeToggle, 'touchstart', { x: 100, y: 100 });
  simulateTouch(nodeToggle, 'touchend', { x: 100, y: 100 });
  
  // Verify state change
  const nodeState = treeScribe.getNodeState(nodeId);
  expect(nodeState.expanded).toBe(true);
});
```

## Accessibility on Mobile

### Screen Reader Support
```javascript
// Mobile screen reader optimizations
if (isMobileDevice()) {
  // Add more descriptive labels for touch interaction
  nodeElements.forEach(node => {
    const toggle = node.querySelector('.tree-node-toggle');
    if (toggle) {
      toggle.setAttribute('aria-label', 
        `${node.expanded ? 'Collapse' : 'Expand'} ${node.title}. Double tap to toggle.`
      );
    }
  });
}
```

### High Contrast and Dark Mode
```css
/* Respect system preferences */
@media (prefers-color-scheme: dark) {
  .tree-scribe {
    --bg-color: #1a1a1a;
    --text-color: #ffffff;
    --border-color: #333333;
  }
}

@media (prefers-contrast: high) {
  .tree-scribe {
    --border-width: 2px;
    --focus-outline-width: 3px;
  }
  
  .tree-node-toggle {
    border: 1px solid currentColor;
  }
}

/* Reduce motion for users who prefer it */
@media (prefers-reduced-motion: reduce) {
  .tree-scribe * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Implementation Example

### Complete Responsive TreeScribe Setup
```javascript
class ResponsiveTreeScribe {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    
    // Initialize responsive system
    this.responsiveManager = new ResponsiveManager(this);
    this.touchHandler = new TouchGestureHandler(this);
    this.keyboardHandler = new VirtualKeyboardHandler(this);
    
    // Create TreeScribe with responsive configuration
    this.treeScribe = new TreeScribeInstance({
      dom: container,
      ...this.getResponsiveOptions(),
      ...options
    });
    
    // Setup responsive event handlers
    this.setupResponsiveHandlers();
    
    // Apply initial configuration
    this.applyResponsiveStyles();
  }
  
  getResponsiveOptions() {
    const config = getResponsiveConfig();
    return {
      enableVirtualScroll: config.enableVirtualScroll,
      options: {
        nodeIndent: config.nodeIndent,
        touchTargetSize: config.touchTargetSize,
        maxCacheSize: config.maxCacheSize || 200
      }
    };
  }
  
  setupResponsiveHandlers() {
    // Handle window resize
    window.addEventListener('resize', this.debounce(() => {
      this.handleResize();
    }, 250));
    
    // Handle orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.handleOrientationChange(), 100);
    });
  }
  
  applyResponsiveStyles() {
    const config = getResponsiveConfig();
    
    // Apply CSS custom properties
    this.container.style.setProperty('--node-indent', `${config.nodeIndent}px`);
    this.container.style.setProperty('--font-size', `${config.fontSize}px`);
    this.container.style.setProperty('--touch-target-size', `${config.touchTargetSize}px`);
    
    // Add responsive classes
    this.container.classList.add('tree-scribe-responsive');
    
    if (window.innerWidth < 768) {
      this.container.classList.add('mobile-layout');
    } else {
      this.container.classList.remove('mobile-layout');
    }
  }
  
  handleResize() {
    this.applyResponsiveStyles();
    
    // Recalculate virtual scrolling
    if (this.treeScribe.virtualScrollManager) {
      this.treeScribe.virtualScrollManager.recalculate();
    }
    
    // Re-render if needed
    this.treeScribe.viewModel.render();
  }
  
  handleOrientationChange() {
    this.handleResize();
    
    // Additional orientation-specific handling
    if (screen.orientation) {
      const isLandscape = screen.orientation.type.includes('landscape');
      this.container.classList.toggle('landscape-mode', isLandscape);
    }
  }
  
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  destroy() {
    this.treeScribe.destroy();
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleOrientationChange);
  }
}

// Usage
const responsiveTreeScribe = new ResponsiveTreeScribe(
  document.getElementById('tree-container'),
  {
    theme: 'auto', // Respect system preference
    enableAccessibility: true
  }
);
```

## Conclusion

TreeScribe's responsive design ensures excellent user experience across all devices:

- **Mobile-first approach** provides solid foundation for all screen sizes
- **Touch-friendly interactions** meet accessibility guidelines
- **Performance optimizations** ensure smooth experience on mobile devices
- **Adaptive layouts** maximize usability at each breakpoint
- **Comprehensive testing strategy** validates functionality across device matrix

The responsive implementation demonstrates how complex components can maintain full functionality while adapting to different interaction paradigms and screen constraints.