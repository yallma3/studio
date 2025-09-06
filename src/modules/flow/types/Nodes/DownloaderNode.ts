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
  
  
  import { writeFile, mkdir, exists, readDir } from '@tauri-apps/plugin-fs';
  import { join } from '@tauri-apps/api/path';
  import { appDataDir } from "@tauri-apps/api/path";
  
  export interface PDFDownloaderNode extends BaseNode {
    nodeType: string;
    nodeValue?: NodeValue;
    process: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
  }
  
  export function createPDFDownloaderNode(
    id: number,
    type: { x: number; y: number }
  ): PDFDownloaderNode {
    return {
      id,
      title: "PDF Batch Downloader",
      nodeValue: "",
      nodeType: "PDFDownloader",
      sockets: [
        {
          id: id * 100 + 1,
          title: "PDF URL or Papers JSON",
          type: "input",
          nodeId: id,
          dataType: "string",
        },
        {
          id: id * 100 + 2,
          title: "Download Results",
          type: "output",
          nodeId: id,
          dataType: "string", 
        },
      ],
      x: type.x,
      y: type.y,
      width: 320,
      height: 320,
      selected: false,
      processing: false,
      process: async ({ node, getInputValue }) => {
        const n = node as PDFDownloaderNode;

        const urlOrJsonInput = await getInputValue(n.id * 100 + 1);
        const urlOrJson = String(urlOrJsonInput || "");

        if (!urlOrJson) {
          return {
            [n.id * 100 + 2]: JSON.stringify([{
              error: "No URL or papers data provided",
              status: "failed"
            }]),
          };
        }

        let papers = [];
        
     
        try {
          const parsedData = JSON.parse(urlOrJson);
          if (Array.isArray(parsedData)) {
            papers = parsedData;
            console.log(`📚 Received ${papers.length} papers from ArXiv Scraper`);
          } else {
            throw new Error("Not an array");
          }
        } catch (parseError) {
       
          papers = [{ pdfUrl: urlOrJson, title: "Direct URL", arxivId: "direct" }];
          console.log(`🔗 Processing single direct PDF URL: ${urlOrJson}`);
        }

        if (papers.length === 0) {
          return {
            [n.id * 100 + 2]: JSON.stringify([{
              error: "No papers to download",
              status: "failed"
            }]),
          };
        }

        console.log(`🚀 Starting batch download of ${papers.length} PDFs...`);
        
      
        const downloadsPath = await initializeDownloadsDirectory();
        
        const downloadResults = [];

       
        const maxSizeConfig = n.getConfigParameter?.("Max File Size (MB)");
        const maxSizeMB = Number(maxSizeConfig?.paramValue) || 50;
        
        const delayConfig = n.getConfigParameter?.("Download Delay (ms)");
        const downloadDelay = Number(delayConfig?.paramValue) || 1000;

        const customDirConfig = n.getConfigParameter?.("Custom Directory");
        const customDir = customDirConfig?.paramValue as string;

        const targetDir = customDir ? await join(await appDataDir(), customDir) : downloadsPath;
        
        if (!(await exists(targetDir))) {
          await mkdir(targetDir, { recursive: true });
        }

      
        for (let i = 0; i < papers.length; i++) {
          const paper = papers[i];
          const pdfUrl = paper.pdfUrl;
          
          if (!pdfUrl) {
            const errorResult = {
              index: i,
              arxivId: paper.arxivId || `paper_${i}`,
              title: paper.title || "Unknown",
              status: "failed",
              error: "No PDF URL provided",
              filePath: "",
              fileSize: 0,
            };
            downloadResults.push(errorResult);
            continue;
          }

          try {
            console.log(`📥 Downloading PDF ${i + 1}/${papers.length}: ${paper.title || paper.arxivId}`);
            
            const result = await downloadPDFToDirectory(pdfUrl, targetDir, paper, maxSizeMB);
            
            const successResult = {
              index: i,
              arxivId: paper.arxivId || `paper_${i}`,
              title: paper.title || "Unknown",
              status: "success",
              filePath: result.filePath,
              fileSize: result.fileSize,
              filename: result.filename,
            };
            
            downloadResults.push(successResult);
            
            console.log(`✅ Downloaded: ${result.filename} (${result.fileSize}KB) -> ${result.filePath}`);
            
          } catch (error) {
            const errorResult = {
              index: i,
              arxivId: paper.arxivId || `paper_${i}`,
              title: paper.title || "Unknown",
              status: "failed",
              error: error instanceof Error ? error.message : String(error),
              filePath: "",
              fileSize: 0,
            };
            
            downloadResults.push(errorResult);
            
            console.error(`❌ Failed to download paper ${i + 1}: ${error}`);
          }

          
          if (i < papers.length - 1 && downloadDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, downloadDelay));
          }
        }

        const successCount = downloadResults.filter(r => r.status === 'success').length;
        const failedCount = downloadResults.filter(r => r.status === 'failed').length;
        
        console.log(`🏁 Batch complete: ${successCount} downloaded, ${failedCount} failed`);
        console.log(`📁 Files saved to: ${targetDir}`);

       
        return {
          [n.id * 100 + 2]: JSON.stringify(downloadResults),
        };
      },
      configParameters: [
        {
          parameterName: "Auto Download",
          parameterType: "boolean",
          defaultValue: true,
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "Automatically download when data is provided",
          isNodeBodyContent: false,
        },
        {
          parameterName: "Max File Size (MB)",
          parameterType: "number",
          defaultValue: 50,
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "Maximum file size to download in MB",
          isNodeBodyContent: false,
        },
        {
          parameterName: "Download Delay (ms)",
          parameterType: "number",
          defaultValue: 1000,
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "Delay between downloads in milliseconds",
          isNodeBodyContent: true,
        },
        {
          parameterName: "Custom Directory",
          parameterType: "string",
          defaultValue: "",
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "Custom subdirectory name (e.g., 'research/papers')",
          isNodeBodyContent: false,
        },
        {
          parameterName: "Organize by Date",
          parameterType: "boolean",
          defaultValue: true,
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "Create date-based subdirectories (YYYY-MM-DD)",
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

 
  async function initializeDownloadsDirectory(): Promise<string> {
    try {
      const appDir = await appDataDir();
      const downloadsPath = await join(appDir, 'Downloads', 'PDFs');
      
      if (!(await exists(downloadsPath))) {
        await mkdir(downloadsPath, { recursive: true });
        console.log('Created Downloads/PDFs directory:', downloadsPath);
      }
      
      return downloadsPath;
    } catch (error) {
      console.error('Error initializing downloads directory:', error);
      throw error;
    }
  }

  
  function generateCleanFilename(paper: any): string {
    let filename = '';
   
    if (paper.arxivId && paper.arxivId !== 'direct') {
      filename = paper.arxivId.replace(/[\/\\:*?"<>|]/g, '_');
    }
   
    else if (paper.title && paper.title !== 'Unknown' && paper.title !== 'Direct URL') {
      filename = paper.title
        .replace(/[\/\\:*?"<>|]/g, '_') 
        .replace(/\s+/g, '_')            
        .substring(0, 100);             
    }
   
    else {
      filename = `paper_${Date.now()}`;
    }
    
    return `${filename}.pdf`;
  }

  
  async function getUniqueFilename(directory: string, baseFilename: string): Promise<string> {
    let filename = baseFilename;
    let counter = 1;
    
    while (await exists(await join(directory, filename))) {
      const nameWithoutExt = baseFilename.replace('.pdf', '');
      filename = `${nameWithoutExt}_${counter}.pdf`;
      counter++;
    }
    
    return filename;
  }

  
  async function downloadPDFToDirectory(
    url: string, 
    targetDir: string, 
    paper: any, 
    maxSizeMB: number = 50
  ) {
    try {
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      
      
      const corsProxy = "https://api.allorigins.win/raw?url=";
      const fetchUrl = url.startsWith('http') ? `${corsProxy}${encodeURIComponent(url)}` : url;
      
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/pdf,*/*',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download PDF. HTTP ${response.status}: ${response.statusText}`);
      }

      
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > maxSizeBytes) {
        throw new Error(`PDF too large: ${Math.round(parseInt(contentLength) / 1024 / 1024)}MB exceeds limit of ${maxSizeMB}MB`);
      }

    
      const arrayBuffer = await response.arrayBuffer();
      

      if (arrayBuffer.byteLength > maxSizeBytes) {
        throw new Error(`PDF too large: ${Math.round(arrayBuffer.byteLength / 1024 / 1024)}MB exceeds limit of ${maxSizeMB}MB`);
      }
      
      const uint8Array = new Uint8Array(arrayBuffer);
      
      
      const pdfHeader = new TextDecoder().decode(uint8Array.slice(0, 4));
      if (!pdfHeader.startsWith('%PDF')) {
        throw new Error('Downloaded file is not a valid PDF - missing PDF header');
      }

      
      const baseFilename = generateCleanFilename(paper);
      const filename = await getUniqueFilename(targetDir, baseFilename);
      
     
      const filePath = await join(targetDir, filename);
      
     
      await writeFile(filePath, uint8Array);
      
      return {
        filePath: filePath,
        fileSize: Math.round(arrayBuffer.byteLength / 1024),
        filename: filename,
      };
      
    } catch (error) {
      console.error('PDF download failed:', error);
      
      
      if (error instanceof Error && error.message.includes('fetch')) {
        console.log('Trying direct download...');
        try {
          const directResponse = await fetch(url);
          if (directResponse.ok) {
            const arrayBuffer = await directResponse.arrayBuffer();
            
            // Quick size check
            if (arrayBuffer.byteLength > maxSizeMB * 1024 * 1024) {
              throw new Error(`PDF too large: ${Math.round(arrayBuffer.byteLength / 1024 / 1024)}MB`);
            }
            
            const uint8Array = new Uint8Array(arrayBuffer);
            const baseFilename = generateCleanFilename(paper);
            const filename = await getUniqueFilename(targetDir, baseFilename);
            const filePath = await join(targetDir, filename);
            
            await writeFile(filePath, uint8Array);
            
            return {
              filePath: filePath,
              fileSize: Math.round(arrayBuffer.byteLength / 1024),
              filename: filename,
            };
          }
        } catch (directError) {
          console.error('Direct download also failed:', directError);
        }
      }
      
      throw error;
    }
  }

  // Enhanced version with date-based organization
  async function downloadPDFToDirectoryWithDateOrg(
    url: string, 
    baseDir: string, 
    paper: any, 
    maxSizeMB: number = 50,
    organizeByDate: boolean = true
  ) {
    let targetDir = baseDir;
    
    if (organizeByDate) {
      const today = new Date();
      const dateFolder = today.toISOString().split('T')[0]; 
      targetDir = await join(baseDir, dateFolder);
      
     
      if (!(await exists(targetDir))) {
        await mkdir(targetDir, { recursive: true });
      }
    }
    
    return await downloadPDFToDirectory(url, targetDir, paper, maxSizeMB);
  }
  
  export function register(nodeRegistry: NodeRegistry): void {
    console.log("Registering PDF Batch Downloader Node with Directory Storage");
    nodeRegistry.registerNodeType("PDFDownloader", createPDFDownloaderNode);
  }