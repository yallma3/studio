/**
 * DOM Parser utility that works in both browser and Node.js environments
 */

import { DOMParser as XmldomParser } from "@xmldom/xmldom";

// Check if we're in a browser environment
const isBrowser =
  typeof window !== "undefined" && typeof window.DOMParser !== "undefined";

// DOMParser implementation for Node.js
let DOMParserImpl: new () => { parseFromString(text: string, mimeType: string): Document };

if (!isBrowser) {
  // In Node.js, use the xmldom implementation
  try {
    DOMParserImpl = XmldomParser;
  } catch (error) {
    console.error("Failed to import @xmldom/xmldom:", error);
    throw new Error(
      "DOMParser polyfill not available. Please install @xmldom/xmldom package."
    );
  }
} else {
  // In browser, use the native implementation
  DOMParserImpl = window.DOMParser;
}

/**
 * Create a DOMParser instance that works in both browser and Node.js
 */
export function createDOMParser(): { parseFromString(text: string, mimeType: string): Document } {
  return new DOMParserImpl();
}

/**
 * Parse XML/HTML string into a DOM Document
 * @param text The XML/HTML string to parse
 * @param mimeType The MIME type of the content (e.g., 'text/html', 'application/xml')
 * @returns Parsed Document object
 */
export function parseFromString(text: string, mimeType: string): Document {
  const parser = new DOMParserImpl();
  return parser.parseFromString(text, mimeType);
}
