/*
* yaLLMa3 - Framework for building AI agents that are capable of learning from their environment and interacting with it.
 
 * Copyright (C) 2025 yaLLMa3
 
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
   If a copy of the MPL was not distributed with this file, You can obtain one at https://www.mozilla.org/MPL/2.0/.
 
 * This software is distributed on an "AS IS" basis,
   WITHOUT WARRANTY OF ANY KIND, either express or implied.
   See the Mozilla Public License for the specific language governing rights and limitations under the License.
*/

import {
    BaseNode,
    ConfigParameterType,
    NodeValue,
    NodeExecutionContext,
  } from "../NodeTypes";
  import { NodeRegistry } from "../NodeRegistry";
  
 
  import { readFile } from '@tauri-apps/plugin-fs';
  
  export interface PDFTextExtractorNode extends BaseNode {
    nodeType: string;
    nodeValue?: NodeValue;
    process: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
  }
  
  export function createPDFTextExtractorNode(
    id: number,
    type: { x: number; y: number }
  ): PDFTextExtractorNode {
    return {
      id,
      title: "PDF Text Extractor",
      nodeValue: "",
      nodeType: "PDFTextExtractor",
      sockets: [
        {
          id: id * 100 + 1,
          title: "Download Results JSON",
          type: "input",
          nodeId: id,
          dataType: "string",
        },
        {
          id: id * 100 + 2,
          title: "Extracted Text",
          type: "output",
          nodeId: id,
          dataType: "string", 
        },
      ],
      x: type.x,
      y: type.y,
      width: 360,
      height: 280,
      selected: false,
      processing: false,
      process: async ({ node, getInputValue }) => {
        const n = node as PDFTextExtractorNode;

        const downloadResultsInput = await getInputValue(n.id * 100 + 1);
        const downloadResultsJson = String(downloadResultsInput || "[]");

        let downloadResults = [];
        try {
          downloadResults = JSON.parse(downloadResultsJson);
          if (!Array.isArray(downloadResults)) {
            throw new Error("Input is not an array");
          }
        } catch (parseError) {
          return {
            [n.id * 100 + 2]: JSON.stringify([{
              error: "Invalid download results JSON",
              status: "failed"
            }]),
          };
        }

        // Filter only successful downloads that have filePaths
        const successfulDownloads = downloadResults.filter(result => 
          result.status === 'success' && result.filePath
        );

        if (successfulDownloads.length === 0) {
          return {
            [n.id * 100 + 2]: JSON.stringify([{
              error: "No successful downloads with file paths to process",
              status: "failed"
            }]),
          };
        }

        console.log(`📖 Starting text extraction for ${successfulDownloads.length} PDFs...`);
        
        const extractionResults = [];

        // Get configuration
        const maxPagesConfig = n.getConfigParameter?.("Max Pages Per PDF");
        const maxPages = Number(maxPagesConfig?.paramValue) || 50;
        
        const includeMetadataConfig = n.getConfigParameter?.("Include Metadata");
        const includeMetadata = Boolean(includeMetadataConfig?.paramValue) ?? true;

        const minWordCountConfig = n.getConfigParameter?.("Min Word Count");
        const minWordCount = Number(minWordCountConfig?.paramValue) || 100;

        const cleanTextConfig = n.getConfigParameter?.("Clean Text");
        const cleanText = Boolean(cleanTextConfig?.paramValue) ?? true;

        // Process each successful download
        for (let i = 0; i < successfulDownloads.length; i++) {
          const downloadResult = successfulDownloads[i];
          
          try {
            console.log(`🔍 Extracting text from: ${downloadResult.title} (${downloadResult.filePath})`);
            
            const extractionResult = await extractTextFromPDFFile(
              downloadResult.filePath, 
              maxPages,
              includeMetadata,
              cleanText
            );
            
            // Check minimum word count
            if (extractionResult.wordCount < minWordCount) {
              throw new Error(`Extracted text too short: ${extractionResult.wordCount} words (minimum: ${minWordCount})`);
            }
            
            const result = {
              index: downloadResult.index,
              arxivId: downloadResult.arxivId,
              title: downloadResult.title,
              filename: downloadResult.filename,
              filePath: downloadResult.filePath,
              fileSize: downloadResult.fileSize,
              status: "success",
              extractedText: extractionResult.text,
              pageCount: extractionResult.pageCount,
              wordCount: extractionResult.wordCount,
              metadata: extractionResult.metadata,
            };
            
            extractionResults.push(result);
            
            console.log(`✅ Extracted ${extractionResult.wordCount} words from ${extractionResult.pageCount} pages`);
            
          } catch (error) {
            const errorResult = {
              index: downloadResult.index,
              arxivId: downloadResult.arxivId,
              title: downloadResult.title,
              filename: downloadResult.filename,
              filePath: downloadResult.filePath,
              fileSize: downloadResult.fileSize,
              status: "failed",
              error: error instanceof Error ? error.message : String(error),
              extractedText: "",
              pageCount: 0,
              wordCount: 0,
              metadata: {},
            };
            
            extractionResults.push(errorResult);
            console.error(`❌ Failed to extract text from ${downloadResult.title}: ${error}`);
          }
        }

        const successCount = extractionResults.filter(r => r.status === 'success').length;
        const totalWords = extractionResults.reduce((sum, r) => sum + r.wordCount, 0);
        
        console.log(`🏁 Text extraction complete: ${successCount}/${successfulDownloads.length} processed successfully`);
        console.log(`📊 Total words extracted: ${totalWords.toLocaleString()}`);

        // Return the extraction results
        return {
          [n.id * 100 + 2]: JSON.stringify(extractionResults),
        };
      },
      configParameters: [
        {
          parameterName: "Max Pages Per PDF",
          parameterType: "number",
          defaultValue: 50,
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "Maximum number of pages to extract per PDF",
          isNodeBodyContent: false,
        },
        {
          parameterName: "Include Metadata",
          parameterType: "boolean",
          defaultValue: true,
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "Include PDF metadata in extraction results",
          isNodeBodyContent: false,
        },
        {
          parameterName: "Min Word Count",
          parameterType: "number",
          defaultValue: 100,
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "Minimum word count to consider extraction successful",
          isNodeBodyContent: false,
        },
        {
          parameterName: "Clean Text",
          parameterType: "boolean",
          defaultValue: true,
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "Clean and normalize extracted text",
          isNodeBodyContent: true,
        },
        {
          parameterName: "Extract Images",
          parameterType: "boolean",
          defaultValue: false,
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "Attempt to extract image descriptions",
          isNodeBodyContent: false,
        },
        {
          parameterName: "Page Range",
          parameterType: "string",
          defaultValue: "",
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "Specific page range (e.g., '1-5,10,15-20'). Leave empty for all pages up to max.",
          isNodeBodyContent: false,
        },
      ],
      getConfigParameters: function (): ConfigParameterType[] {
        return this.configParameters || [];
      },
      getConfigParameter(parameterName: string): ConfigParameterType | undefined {
        return (this.configParameters ?? []).find(
          (param) => param.parameterName === parameterName
        );
      },
      setConfigParameter(parameterName, value): void {
        const parameter = (this.configParameters ?? []).find(
          (param) => param.parameterName === parameterName
        );
        if (parameter) {
          parameter.paramValue = value;
        }
      },
    };
  }

  // Extract text from PDF file using Tauri file system
  async function extractTextFromPDFFile(
    filePath: string, 
    maxPages: number = 50, 
    includeMetadata: boolean = true,
    cleanText: boolean = true
  ) {
    try {
      // Load PDF.js library if not already loaded
      if (typeof window !== 'undefined' && !(window as any).pdfjsLib) {
        await loadPDFJS();
      }

      const pdfjsLib = (window as any).pdfjsLib;
      
      // Read the PDF file from disk using Tauri
      console.log(`📁 Reading PDF file: ${filePath}`);
      const fileData = await readFile(filePath);
      
      if (!fileData || fileData.length === 0) {
        throw new Error("File is empty or could not be read");
      }

      // Validate PDF header
      const header = new TextDecoder().decode(fileData.slice(0, 4));
      if (!header.startsWith('%PDF')) {
        throw new Error('File is not a valid PDF - missing PDF header');
      }

      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: fileData });
      const pdf = await loadingTask.promise;

      let fullText = "";
      let metadata = {};
      
      // Extract metadata if requested
      if (includeMetadata) {
        try {
          const meta = await pdf.getMetadata();
          metadata = {
            title: meta.info?.Title || "",
            author: meta.info?.Author || "",
            subject: meta.info?.Subject || "",
            creator: meta.info?.Creator || "",
            producer: meta.info?.Producer || "",
            creationDate: meta.info?.CreationDate || "",
            modificationDate: meta.info?.ModDate || "",
            totalPages: pdf.numPages,
            pdfVersion: meta.info?.PDFFormatVersion || "",
            encrypted: meta.info?.IsEncrypted || false,
          };
        } catch (metaError) {
          console.warn("Could not extract metadata:", metaError);
        }
      }

      // Limit pages to extract
      const pagesToProcess = Math.min(pdf.numPages, maxPages);
      
      console.log(`📄 Extracting text from ${pagesToProcess} pages of ${pdf.numPages} total pages...`);

      // Extract text from each page
      for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Combine text items with proper spacing
          const pageText = textContent.items
            .map((item: any) => {
              // Handle text items that have string content
              if (typeof item.str === 'string') {
                return item.str;
              }
              return '';
            })
            .join(' ')
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
            
          if (pageText) {
            fullText += `--- PAGE ${pageNum} ---\n${pageText}\n\n`;
          }
          
          // Cleanup page resources
          page.cleanup();
          
        } catch (pageError) {
          console.warn(`Error extracting page ${pageNum}:`, pageError);
          fullText += `--- PAGE ${pageNum} ---\n[Error extracting page content]\n\n`;
        }
      }

      // Clean the text if requested
      const processedText = cleanText ? cleanExtractedText(fullText) : fullText;
      
      // Count words
      const wordCount = processedText.split(/\s+/).filter(word => word.length > 0).length;

      // Additional statistics
      const characterCount = processedText.length;
      const lineCount = processedText.split('\n').length;

      return {
        text: processedText,
        pageCount: pagesToProcess,
        wordCount: wordCount,
        characterCount: characterCount,
        lineCount: lineCount,
        metadata: metadata,
        extractionStats: {
          totalPages: pdf.numPages,
          processedPages: pagesToProcess,
          skippedPages: Math.max(0, pdf.numPages - pagesToProcess),
          fileSize: fileData.length,
        }
      };
      
    } catch (error) {
      console.error('PDF text extraction failed:', error);
      throw new Error(`PDF text extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Load PDF.js library dynamically
  async function loadPDFJS() {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }

      // Load PDF.js from CDN
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        // Set up worker
        const workerScript = document.createElement('script');
        workerScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        workerScript.onload = () => {
          (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve((window as any).pdfjsLib);
        };
        workerScript.onerror = reject;
        document.head.appendChild(workerScript);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Clean and normalize extracted text
  function cleanExtractedText(text: string): string {
    return text
      // Remove page markers
      .replace(/--- PAGE \d+ ---\n/g, '\n')
      // Fix common PDF extraction issues
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
      .replace(/(\.)([A-Z])/g, '$1 $2') // Add space after periods
      .replace(/([a-z])(\d)/g, '$1 $2') // Add space between letters and numbers
      .replace(/(\d)([a-z])/g, '$1 $2') // Add space between numbers and letters
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove excessive line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Fix hyphenated words at line breaks
      .replace(/-\s+/g, '')
      // Remove common PDF artifacts
      .replace(/[^\w\s\.\,\!\?\;\:\-\(\)\[\]\{\}\"\']/g, ' ')
      // Trim whitespace
      .trim();
  }

  // Parse page range string (e.g., "1-5,10,15-20")
  function parsePageRange(rangeStr: string, maxPages: number): number[] {
    if (!rangeStr.trim()) {
      return Array.from({ length: maxPages }, (_, i) => i + 1);
    }

    const pages = new Set<number>();
    const parts = rangeStr.split(',').map(s => s.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(s => parseInt(s.trim()));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= Math.min(end, maxPages); i++) {
            pages.add(i);
          }
        }
      } else {
        const page = parseInt(part);
        if (!isNaN(page) && page >= 1 && page <= maxPages) {
          pages.add(page);
        }
      }
    }

    return Array.from(pages).sort((a, b) => a - b);
  }

  // Enhanced extraction with page range support
  async function extractTextFromPDFFileWithRange(
    filePath: string,
    pageRange: string = "",
    includeMetadata: boolean = true,
    cleanText: boolean = true
  ) {
    try {
      if (typeof window !== 'undefined' && !(window as any).pdfjsLib) {
        await loadPDFJS();
      }

      const pdfjsLib = (window as any).pdfjsLib;
      const fileData = await readFile(filePath);
      
      const loadingTask = pdfjsLib.getDocument({ data: fileData });
      const pdf = await loadingTask.promise;

      // Parse page range
      const pagesToExtract = parsePageRange(pageRange, pdf.numPages);
      
      let fullText = "";
      let metadata = {};

      if (includeMetadata) {
        try {
          const meta = await pdf.getMetadata();
          metadata = {
            title: meta.info?.Title || "",
            author: meta.info?.Author || "",
            subject: meta.info?.Subject || "",
            creator: meta.info?.Creator || "",
            producer: meta.info?.Producer || "",
            creationDate: meta.info?.CreationDate || "",
            modificationDate: meta.info?.ModDate || "",
            totalPages: pdf.numPages,
          };
        } catch (metaError) {
          console.warn("Could not extract metadata:", metaError);
        }
      }

      console.log(`📄 Extracting text from pages: ${pagesToExtract.join(', ')}`);

      // Extract text from specified pages
      for (const pageNum of pagesToExtract) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          const pageText = textContent.items
            .map((item: any) => typeof item.str === 'string' ? item.str : '')
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
            
          if (pageText) {
            fullText += `--- PAGE ${pageNum} ---\n${pageText}\n\n`;
          }
          
          page.cleanup();
          
        } catch (pageError) {
          console.warn(`Error extracting page ${pageNum}:`, pageError);
          fullText += `--- PAGE ${pageNum} ---\n[Error extracting page content]\n\n`;
        }
      }

      const processedText = cleanText ? cleanExtractedText(fullText) : fullText;
      const wordCount = processedText.split(/\s+/).filter(word => word.length > 0).length;

      return {
        text: processedText,
        pageCount: pagesToExtract.length,
        wordCount: wordCount,
        metadata: metadata,
        extractedPages: pagesToExtract,
      };

    } catch (error) {
      throw new Error(`PDF text extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Batch process multiple PDFs with progress tracking
  async function batchExtractTextFromFiles(
    downloadResults: any[], 
    maxPages: number, 
    progressCallback?: (progress: number, current: string) => void
  ) {
    const results = [];
    const successfulDownloads = downloadResults.filter(result => 
      result.status === 'success' && result.filePath
    );

    for (let i = 0; i < successfulDownloads.length; i++) {
      const downloadResult = successfulDownloads[i];
      
      try {
        if (progressCallback) {
          progressCallback(
            Math.round((i / successfulDownloads.length) * 100),
            downloadResult.title || downloadResult.filename || 'Unknown'
          );
        }

        const extractionResult = await extractTextFromPDFFile(
          downloadResult.filePath, 
          maxPages, 
          true,
          true
        );
        
        results.push({
          ...downloadResult,
          extractedText: extractionResult.text,
          pageCount: extractionResult.pageCount,
          wordCount: extractionResult.wordCount,
          metadata: extractionResult.metadata,
          extractionStats: extractionResult.extractionStats,
          extractionStatus: "success",
        });
        
      } catch (error) {
        results.push({
          ...downloadResult,
          extractedText: "",
          pageCount: 0,
          wordCount: 0,
          metadata: {},
          extractionStatus: "failed",
          extractionError: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (progressCallback) {
      progressCallback(100, "Complete");
    }

    return results;
  }
  
  export function register(nodeRegistry: NodeRegistry): void {
    console.log("Registering PDF Text Extractor Node with File System Support");
    nodeRegistry.registerNodeType("PDFTextExtractor", createPDFTextExtractorNode);
  }

  // Export utility functions for external use
  export { 
    extractTextFromPDFFile, 
    extractTextFromPDFFileWithRange,
    batchExtractTextFromFiles, 
    cleanExtractedText,
    parsePageRange
  };