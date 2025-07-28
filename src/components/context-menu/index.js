import { UmbilicalUtils, UmbilicalError } from '../../umbilical/index.js';

/**
 * ContextMenu Component
 * 
 * A popup menu component that can display hierarchical menus with submenus.
 * Supports keyboard navigation, custom styling, and viewport-aware positioning.
 */
export const ContextMenu = {
  /**
   * Create a ContextMenu instance or provide introspection
   */
  create(umbilical) {
    // Introspection mode - describe requirements
    if (umbilical.describe) {
      const requirements = UmbilicalUtils.createRequirements();
      requirements.add('dom', 'HTMLElement', 'Parent DOM element for positioning (defaults to document.body)');
      requirements.add('items', 'Array', 'Menu items array with label, action, icon, and subitems');
      requirements.add('position', 'Object', 'Initial position {x, y} (optional)');
      requirements.add('trigger', 'string', 'Trigger type: "manual", "rightclick", or "click" (optional, defaults to "manual")');
      requirements.add('targetElement', 'HTMLElement', 'Element to attach trigger to (required for non-manual triggers)');
      requirements.add('showDelay', 'number', 'Delay before showing submenus in ms (optional, defaults to 200)');
      requirements.add('hideDelay', 'number', 'Delay before hiding submenus in ms (optional, defaults to 300)');
      requirements.add('theme', 'string', 'Theme: "light" or "dark" (optional, defaults to "light")');
      requirements.add('className', 'string', 'Additional CSS class name (optional)');
      requirements.add('onItemSelect', 'function', 'Callback when item is selected (optional)');
      requirements.add('onItemHover', 'function', 'Callback when item is hovered (optional)');
      requirements.add('onShow', 'function', 'Callback when menu is shown (optional)');
      requirements.add('onHide', 'function', 'Callback when menu is hidden (optional)');
      
      umbilical.describe(requirements);
      return;
    }

    // Validation mode
    if (umbilical.validate) {
      return umbilical.validate({
        hasValidItems: Array.isArray(umbilical.items),
        hasValidTrigger: !umbilical.trigger || ['manual', 'rightclick', 'click'].includes(umbilical.trigger),
        hasTargetForTrigger: umbilical.trigger === 'manual' || 
          (umbilical.targetElement && umbilical.targetElement.nodeType === Node.ELEMENT_NODE),
        hasValidTheme: !umbilical.theme || ['light', 'dark'].includes(umbilical.theme)
      });
    }

    // Instance creation mode
    const dom = umbilical.dom || document.body;
    const items = umbilical.items || [];
    const trigger = umbilical.trigger || 'manual';
    const theme = umbilical.theme || 'light';
    const showDelay = umbilical.showDelay || 200;
    const hideDelay = umbilical.hideDelay || 300;

    // Validate trigger requirements
    if (trigger !== 'manual' && !umbilical.targetElement) {
      throw new UmbilicalError(
        'ContextMenu requires targetElement for non-manual triggers',
        'ContextMenu'
      );
    }

    // State
    let isVisible = false;
    let position = umbilical.position || { x: 0, y: 0 };
    let activeSubmenu = null;
    let hoveredItem = null;
    let showTimer = null;
    let hideTimer = null;

    // Create styles
    const styleId = `umbilical-context-menu-styles-${theme}`;
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .umbilical-context-menu {
          position: absolute;
          z-index: 10000;
          min-width: 150px;
          max-width: 300px;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          padding: 4px 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          user-select: none;
          opacity: 0;
          transform: scale(0.95);
          transition: opacity 0.15s ease, transform 0.15s ease;
        }

        .umbilical-context-menu.visible {
          opacity: 1;
          transform: scale(1);
        }

        .umbilical-context-menu.light {
          background: white;
          border: 1px solid #e0e0e0;
          color: #333;
        }

        .umbilical-context-menu.dark {
          background: #2b2b2b;
          border: 1px solid #444;
          color: #e0e0e0;
        }

        .umbilical-menu-item {
          display: flex;
          align-items: center;
          padding: 6px 20px;
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
        }

        .umbilical-menu-item:hover {
          background: ${theme === 'dark' ? '#3a3a3a' : '#f0f0f0'};
        }

        .umbilical-menu-item.has-submenu::after {
          content: '▶';
          position: absolute;
          right: 10px;
          font-size: 10px;
          opacity: 0.6;
        }

        .umbilical-menu-item.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .umbilical-menu-item.disabled:hover {
          background: transparent;
        }

        .umbilical-menu-separator {
          height: 1px;
          margin: 4px 0;
          background: ${theme === 'dark' ? '#444' : '#e0e0e0'};
        }

        .umbilical-menu-icon {
          margin-right: 8px;
          width: 16px;
          text-align: center;
        }

        .umbilical-menu-label {
          flex: 1;
        }

        .umbilical-menu-shortcut {
          margin-left: 20px;
          opacity: 0.6;
          font-size: 12px;
        }
      `;
      document.head.appendChild(style);
    }

    // Create menu element
    const element = document.createElement('div');
    element.className = `umbilical-context-menu ${theme}`;
    if (umbilical.className) {
      element.className += ` ${umbilical.className}`;
    }
    element.style.display = 'none';

    // Helper functions
    const clearTimers = () => {
      if (showTimer) {
        clearTimeout(showTimer);
        showTimer = null;
      }
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
    };

    const hideSubmenu = () => {
      if (activeSubmenu) {
        activeSubmenu.hide();
        activeSubmenu = null;
      }
    };

    const renderItems = () => {
      element.innerHTML = '';
      
      items.forEach((item, index) => {
        if (item.type === 'separator') {
          const separator = document.createElement('div');
          separator.className = 'umbilical-menu-separator';
          element.appendChild(separator);
          return;
        }

        const itemEl = document.createElement('div');
        itemEl.className = 'umbilical-menu-item';
        
        if (item.disabled) {
          itemEl.className += ' disabled';
        }
        
        if (item.subitems && item.subitems.length > 0) {
          itemEl.className += ' has-submenu';
        }

        // Icon
        if (item.icon) {
          const icon = document.createElement('span');
          icon.className = 'umbilical-menu-icon';
          icon.textContent = item.icon;
          itemEl.appendChild(icon);
        }

        // Label
        const label = document.createElement('span');
        label.className = 'umbilical-menu-label';
        label.textContent = item.label || item.text || '';
        itemEl.appendChild(label);

        // Shortcut
        if (item.shortcut) {
          const shortcut = document.createElement('span');
          shortcut.className = 'umbilical-menu-shortcut';
          shortcut.textContent = item.shortcut;
          itemEl.appendChild(shortcut);
        }

        // Event handlers
        if (!item.disabled) {
          itemEl.addEventListener('mouseenter', () => {
            clearTimers();
            
            // Update hovered item
            if (hoveredItem !== item) {
              hoveredItem = item;
              if (umbilical.onItemHover) {
                umbilical.onItemHover(item, instance);
              }
            }

            // Handle submenu
            if (item.subitems && item.subitems.length > 0) {
              showTimer = setTimeout(() => {
                hideSubmenu();
                
                // Create submenu
                const itemRect = itemEl.getBoundingClientRect();
                activeSubmenu = ContextMenu.create({
                  dom: dom,
                  items: item.subitems,
                  position: {
                    x: itemRect.right - 2,
                    y: itemRect.top
                  },
                  theme: theme,
                  showDelay: showDelay,
                  hideDelay: hideDelay,
                  onItemSelect: (subItem) => {
                    instance.hide();
                    if (umbilical.onItemSelect) {
                      umbilical.onItemSelect(subItem, instance);
                    }
                  },
                  onItemHover: umbilical.onItemHover
                });
                
                activeSubmenu.show();
                
                // Adjust position if off-screen
                const submenuRect = activeSubmenu.element.getBoundingClientRect();
                if (submenuRect.right > window.innerWidth) {
                  activeSubmenu.setPosition({
                    x: itemRect.left - submenuRect.width + 2,
                    y: itemRect.top
                  });
                }
              }, showDelay);
            } else {
              hideTimer = setTimeout(hideSubmenu, hideDelay);
            }
          });

          itemEl.addEventListener('mouseleave', () => {
            clearTimers();
            hoveredItem = null;
            
            if (item.subitems) {
              hideTimer = setTimeout(hideSubmenu, hideDelay);
            }
          });

          itemEl.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (!item.subitems || item.subitems.length === 0) {
              instance.hide();
              if (item.action) {
                item.action(item, instance);
              }
              if (umbilical.onItemSelect) {
                umbilical.onItemSelect(item, instance);
              }
            }
          });
        }

        element.appendChild(itemEl);
      });
    };

    // Document click handler
    const handleDocumentClick = (e) => {
      if (isVisible && !element.contains(e.target)) {
        instance.hide();
      }
    };

    // Keyboard handler
    const handleKeyDown = (e) => {
      if (!isVisible) return;
      
      if (e.key === 'Escape') {
        instance.hide();
      }
    };

    // Initial render
    renderItems();

    // Create instance interface
    const instance = {
      get element() {
        return element;
      },

      get isVisible() {
        return isVisible;
      },

      show(pos) {
        if (pos) {
          position = pos;
        }

        // Ensure element is in DOM
        if (!element.parentNode) {
          dom.appendChild(element);
        }

        // Position menu
        element.style.left = `${position.x}px`;
        element.style.top = `${position.y}px`;
        element.style.display = 'block';

        // Trigger reflow before adding visible class
        void element.offsetWidth;
        element.classList.add('visible');

        isVisible = true;

        // Adjust position if off-screen
        const rect = element.getBoundingClientRect();
        const adjustedPos = { ...position };

        if (rect.right > window.innerWidth) {
          adjustedPos.x = window.innerWidth - rect.width - 10;
        }
        if (rect.bottom > window.innerHeight) {
          adjustedPos.y = window.innerHeight - rect.height - 10;
        }
        if (adjustedPos.x < 0) adjustedPos.x = 10;
        if (adjustedPos.y < 0) adjustedPos.y = 10;

        if (adjustedPos.x !== position.x || adjustedPos.y !== position.y) {
          element.style.left = `${adjustedPos.x}px`;
          element.style.top = `${adjustedPos.y}px`;
        }

        // Add event listeners
        document.addEventListener('click', handleDocumentClick);
        document.addEventListener('keydown', handleKeyDown);

        if (umbilical.onShow) {
          umbilical.onShow(instance);
        }

        return instance;
      },

      hide() {
        if (!isVisible) return instance;

        clearTimers();
        hideSubmenu();
        
        element.classList.remove('visible');
        
        setTimeout(() => {
          if (element.parentNode) {
            element.style.display = 'none';
          }
        }, 150);

        isVisible = false;
        hoveredItem = null;

        // Remove event listeners
        document.removeEventListener('click', handleDocumentClick);
        document.removeEventListener('keydown', handleKeyDown);

        if (umbilical.onHide) {
          umbilical.onHide(instance);
        }

        return instance;
      },

      toggle(pos) {
        if (isVisible) {
          return instance.hide();
        } else {
          return instance.show(pos);
        }
      },

      setPosition(pos) {
        position = pos;
        if (isVisible) {
          element.style.left = `${position.x}px`;
          element.style.top = `${position.y}px`;
        }
        return instance;
      },

      setItems(newItems) {
        items.length = 0;
        items.push(...newItems);
        renderItems();
        return instance;
      },

      destroy() {
        clearTimers();
        hideSubmenu();
        instance.hide();
        
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }

        if (triggerHandler) {
          umbilical.targetElement.removeEventListener(
            trigger === 'rightclick' ? 'contextmenu' : 'click',
            triggerHandler
          );
        }
      }
    };

    // Set up trigger if specified
    let triggerHandler = null;
    if (trigger !== 'manual' && umbilical.targetElement) {
      const eventType = trigger === 'rightclick' ? 'contextmenu' : 'click';
      
      triggerHandler = (e) => {
        e.preventDefault();
        instance.show({ x: e.clientX, y: e.clientY });
      };
      
      umbilical.targetElement.addEventListener(eventType, triggerHandler);
    }

    // Lifecycle
    if (umbilical.onMount) {
      umbilical.onMount(instance);
    }

    return instance;
  }
};