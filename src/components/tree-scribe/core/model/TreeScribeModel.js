/**
 * TreeScribeModel - Core data model for TreeScribe component
 */

import { TreeNode } from './TreeNode.js';
import { YamlProcessor } from './YamlProcessor.js';

export class TreeScribeModel {
  constructor() {
    this.rootNode = null;
    this.nodeIndex = new Map(); // Fast node lookup by ID
    this.metadata = {};
    this.eventListeners = new Map();
  }

  /**
   * Load YAML content and build tree structure
   */
  loadYaml(yamlString) {
    try {
      // Validate input
      if (yamlString === null || yamlString === undefined || typeof yamlString !== 'string') {
        throw new Error('Invalid YAML content: must be a string');
      }

      // Handle empty string case
      if (yamlString.trim() === '') {
        const parsed = { title: 'Untitled', content: '' };
        this.rootNode = this._buildTreeFromObject(parsed);
        this._buildNodeIndex();
        this._emit('modelChanged', { 
          type: 'loaded', 
          rootNode: this.rootNode 
        });
        return { success: true, nodeCount: this.getNodeCount() };
      }

      // Parse YAML to normalized structure
      const parsed = YamlProcessor.parse(yamlString);
      
      // Validate parsed result
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid YAML structure: must contain valid document structure');
      }

      // Build tree from parsed data
      this.rootNode = this._buildTreeFromObject(parsed);
      
      // Validate root node was created
      if (!this.rootNode) {
        throw new Error('Failed to create tree structure from YAML content');
      }
      
      // Create node index for fast lookup
      this._buildNodeIndex();
      
      // Emit change event
      this._emit('modelChanged', { 
        type: 'loaded', 
        rootNode: this.rootNode 
      });
      
      return { success: true, nodeCount: this.getNodeCount() };
      
    } catch (error) {
      console.error('Failed to load YAML:', error);
      
      // Clean up any partial state
      this.rootNode = null;
      this.nodeIndex.clear();
      
      // Create more specific error messages
      let errorMessage = error.message;
      if (error.message.includes('YAML')) {
        errorMessage = `YAML parsing error: ${error.message}`;
      } else if (error.message.includes('structure')) {
        errorMessage = `Document structure error: ${error.message}`;
      } else {
        errorMessage = `Failed to load document: ${error.message}`;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Build tree structure from normalized object
   * @private
   */
  _buildTreeFromObject(obj, parent = null) {
    console.log('[TreeScribeModel] Building node from object:', {
      title: obj.title,
      contentType: obj.contentType,
      hasContent: !!obj.content
    });
    
    const node = new TreeNode({
      id: obj.id,
      title: obj.title,
      description: obj.content,
      contentType: obj.contentType,
      metadata: obj.metadata
    });

    node.parent = parent;
    
    // Process children recursively
    if (obj.children && Array.isArray(obj.children)) {
      obj.children.forEach(childData => {
        const childNode = this._buildTreeFromObject(childData, node);
        node.children.push(childNode);
      });
    }

    return node;
  }

  /**
   * Build node index for fast lookup
   * @private
   */
  _buildNodeIndex() {
    this.nodeIndex.clear();
    
    if (this.rootNode) {
      this._indexNode(this.rootNode);
    }
  }

  /**
   * Recursively index a node and its children
   * @private
   */
  _indexNode(node) {
    this.nodeIndex.set(node.id, node);
    
    node.children.forEach(child => {
      this._indexNode(child);
    });
  }

  /**
   * Get node by ID (O(1) lookup)
   */
  getNode(nodeId) {
    return this.nodeIndex.get(nodeId) || null;
  }

  /**
   * Get all nodes in the tree
   */
  getAllNodes() {
    const nodes = [];
    
    if (this.rootNode) {
      this._collectNodes(this.rootNode, nodes);
    }
    
    return nodes;
  }

  /**
   * Recursively collect all nodes
   * @private
   */
  _collectNodes(node, collection) {
    collection.push(node);
    
    node.children.forEach(child => {
      this._collectNodes(child, collection);
    });
  }

  /**
   * Get direct children of a node
   */
  getChildren(nodeId) {
    const node = this.getNode(nodeId);
    return node ? node.children : [];
  }

  /**
   * Get all descendants of a node
   */
  getDescendants(nodeId) {
    const node = this.getNode(nodeId);
    if (!node) return [];
    
    const descendants = [];
    node.children.forEach(child => {
      this._collectNodes(child, descendants);
    });
    
    return descendants;
  }

  /**
   * Get path from root to a specific node
   */
  getPathToNode(nodeId) {
    const node = this.getNode(nodeId);
    if (!node) return [];
    
    const path = [];
    let current = node;
    
    while (current) {
      path.unshift(current);
      current = current.parent;
    }
    
    return path;
  }

  /**
   * Export tree to JSON format
   */
  exportJson() {
    if (!this.rootNode) {
      return null;
    }
    
    return this._nodeToJson(this.rootNode);
  }

  /**
   * Convert node to JSON representation
   * @private
   */
  _nodeToJson(node) {
    const json = {
      id: node.id,
      title: node.title,
      content: node.content,
      contentType: node.contentType,
      metadata: node.metadata,
      children: node.children.map(child => this._nodeToJson(child))
    };
    
    return json;
  }

  /**
   * Add event listener
   */
  on(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    
    const listeners = this.eventListeners.get(eventType);
    listeners.push(callback);
    
    // Return function to remove listener
    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * Emit event to listeners
   * @private
   */
  _emit(eventType, data) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Event listener error:', error);
        }
      });
    }
  }

  /**
   * Get node by ID (alias for getNode)
   */
  getNodeById(nodeId) {
    return this.getNode(nodeId);
  }

  /**
   * Get root node
   */
  getRoot() {
    return this.rootNode;
  }

  /**
   * Get total node count
   */
  getNodeCount() {
    return this.nodeIndex.size;
  }

  /**
   * Get maximum depth in tree
   */
  getMaxDepth() {
    if (!this.rootNode) return 0;
    
    let maxDepth = 0;
    const traverse = (node) => {
      maxDepth = Math.max(maxDepth, node.getDepth());
      node.children.forEach(child => traverse(child));
    };
    
    traverse(this.rootNode);
    return maxDepth;
  }

  /**
   * Clean up model
   */
  destroy() {
    this.rootNode = null;
    this.nodeIndex.clear();
    this.eventListeners.clear();
    this.metadata = {};
  }
}