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
  
  export interface ArxivScraperNode extends BaseNode {
    nodeType: string;
    nodeValue?: NodeValue;
    process: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
  }
  
  export function createArxivScraperNode(
    id: number,
    type: { x: number; y: number }
  ): ArxivScraperNode {
    return {
      id,
      title: "Arxiv Scraper",
      nodeValue: "cs.AI",
      nodeType: "ArxivScraper",
      sockets: [
        {
          id: id * 100 + 1,
          title: "Category",
          type: "input",
          nodeId: id,
          dataType: "string",
        },
        {
          id: id * 100 + 2,
          title: "Results",
          type: "output",
          nodeId: id,
          dataType: "string", 
        },
        {
          id: id * 100 + 3,
          title: "Paper Count",
          type: "output",
          nodeId: id,
          dataType: "number",
        },
      ],
      x: type.x,
      y: type.y,
      width: 340,
      height: 260,
      selected: false,
      processing: false,
      process: async ({ node, getInputValue }) => {
        const n = node as ArxivScraperNode;

        const categoryInput = await getInputValue(n.id * 100 + 1);
        const category = String(categoryInput || n.nodeValue || "cs.AI");

        console.log(`📡 Scraping Arxiv category: ${category}`);

        try {
          // Use ArXiv API instead of web scraping to avoid CORS issues
          const papers = await fetchArxivAPI(category);

          console.log(`✅ Found ${papers.length} papers in ${category}`);

          return {
            [n.id * 100 + 2]: JSON.stringify(papers),
            [n.id * 100 + 3]: papers.length,
          };
        } catch (err) {
          console.error("❌ Arxiv Scraper Error:", err);
          return {
            [n.id * 100 + 2]: JSON.stringify([]),
            [n.id * 100 + 3]: 0,
          };
        }
      },
      configParameters: [
        {
          parameterName: "Default Category",
          parameterType: "string",
          defaultValue: "cs.AI",
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "Default Arxiv category to scrape",
          isNodeBodyContent: true,
        },
        {
          parameterName: "Max Results",
          parameterType: "number",
          defaultValue: 10,
          valueSource: "UserInput",
          UIConfigurable: true,
          description: "Maximum number of papers to fetch",
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

  // Use ArXiv API instead of scraping HTML to avoid CORS issues
  async function fetchArxivAPI(category: string, maxResults: number = 3) {// change the max result from here
    // ArXiv API endpoint
    const apiUrl = `https://export.arxiv.org/api/query?search_query=cat:${category}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;
    
    console.log(`Fetching from ArXiv API: ${apiUrl}`);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ArxivScraper/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const xmlText = await response.text();
      console.log(`Received XML response, length: ${xmlText.length}`);
      
      // Parse XML response
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      // Check for parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error(`XML parsing error: ${parseError.textContent}`);
      }

      const entries = xmlDoc.querySelectorAll('entry');
      console.log(`Found ${entries.length} entries in XML`);
      
      const papers = [];
      
      for (const entry of entries) {
        try {
          const id = entry.querySelector('id')?.textContent || '';
          const arxivId = id.split('/').pop()?.replace('v', 'v') || '';
          const cleanArxivId = arxivId.split('v')[0]; // Remove version number for clean ID
          
          const title = entry.querySelector('title')?.textContent?.trim() || '';
          const summary = entry.querySelector('summary')?.textContent?.trim() || '';
          const published = entry.querySelector('published')?.textContent || '';
          
          // Get PDF link
          const links = entry.querySelectorAll('link');
          let pdfUrl = '';
          for (const link of links) {
            if (link.getAttribute('title') === 'pdf') {
              pdfUrl = link.getAttribute('href') || '';
              break;
            }
          }
          
          // Format date
          let submittedDate = '';
          if (published) {
            try {
              const date = new Date(published);
              submittedDate = date.toISOString().split('T')[0];
            } catch (e) {
              console.warn('Date parsing failed:', published);
            }
          }
          
          if (title && cleanArxivId) {
            papers.push({
              arxivId: cleanArxivId,
              version: 1,
              title: title,
              pdfUrl: pdfUrl,
              submittedDate: submittedDate,
              abstract: summary,
            });
          }
        } catch (entryError) {
          console.warn('Error processing entry:', entryError);
          continue;
        }
      }
      
      return papers;
      
    } catch (error) {
      console.error('ArXiv API fetch failed:', error);
      
      // Fallback to mock data for testing
      console.log('Returning mock data for testing...');
      return [
        {
          arxivId: "2501.00001",
          version: 1,
          title: "Sample AI Paper Title",
          pdfUrl: "https://arxiv.org/pdf/2501.00001.pdf",
          submittedDate: "2025-01-01",
          abstract: "This is a sample abstract for testing purposes."
        }
      ];
    }
  }
  
  export function register(nodeRegistry: NodeRegistry): void {
    console.log("Registering Arxiv Scraper Node (API-based)");
    nodeRegistry.registerNodeType("ArxivScraper", createArxivScraperNode);
  }