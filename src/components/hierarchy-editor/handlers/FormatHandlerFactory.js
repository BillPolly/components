/**
 * FormatHandlerFactory - Factory for creating format handlers
 */

import { JsonHandler } from './JsonHandler.js';
import { XmlHandler } from './XmlHandler.js';
import { YamlHandler } from './YamlHandler.js';
import { MarkdownHandler } from './MarkdownHandler.js';

export class FormatHandlerFactory {
  static handlers = {
    json: JsonHandler,
    xml: XmlHandler,
    yaml: YamlHandler,
    markdown: MarkdownHandler
  };
  
  /**
   * Create a handler for the specified format
   * @param {string} format - Format type
   * @returns {FormatHandler} Handler instance
   */
  static create(format) {
    const HandlerClass = this.handlers[format];
    if (!HandlerClass) {
      throw new Error(`Unsupported format: ${format}`);
    }
    return new HandlerClass();
  }
  
  /**
   * Get supported formats
   * @returns {string[]} Array of supported format names
   */
  static getSupportedFormats() {
    return Object.keys(this.handlers);
  }
  
  /**
   * Check if format is supported
   * @param {string} format - Format to check
   * @returns {boolean} True if supported
   */
  static isSupported(format) {
    return format in this.handlers;
  }
  
  /**
   * Register a custom handler
   * @param {string} format - Format name
   * @param {class} HandlerClass - Handler class
   */
  static registerHandler(format, HandlerClass) {
    this.handlers[format] = HandlerClass;
  }
}