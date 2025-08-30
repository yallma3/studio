import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { NodeRegistry } from "../NodeRegistry";
import {
  BaseNode,
  NodeValue,
  NodeExecutionContext,
} from "../NodeTypes";


export interface ArxivNewPapersNode extends BaseNode {
  nodeType: "ArxivNewPapers";
  nodeValue?: NodeValue;
  process: (context: NodeExecutionContext) => Promise<NodeValue | undefined>;
}


export async function scrapeCategoryPdfUrls(
  baseUrl: string,
  category: string
): Promise<string[]> {
  const url = `${baseUrl}/list/${category}/new`;

  // const res = await fetch(url, {
  //   headers: { "User-Agent": "Mozilla/5.0 (compatible; ArXiv-Summarizer/1.0)" },
  //   //method: 'GET',
  // });

  // if (!res.ok) {
  //   throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  // }

  // const html = await res.text();
  // const $ = cheerio.load(html);
  // const urls: string[] = [];

  // $("dl").children("dt").each((_, el) => {
  //   const pdfLink = $(el).find('a[title="Download PDF"]').attr("href");
  //   if (pdfLink) {
  //     urls.push(`${baseUrl}${pdfLink}`);
  //   }
  // });
// try {
//     const res = await fetch(url, {
//       headers: { "User-Agent": "Mozilla/5.0 (compatible; ArXiv-Summarizer/1.0)" },
// //method: 'GET',
//     });

//     if (!res.ok) {
//       throw new Error(`HTTP ${res.status}: ${res.statusText}`);
//     }

//     const html = await res.text();
//     const $ = cheerio.load(html);
//     const urls: string[] = [];

//     $("dl").children("dt").each((_, el) => {
//       const pdfLink = $(el).find('a[title="Download PDF"]').attr("href");
//       if (pdfLink) {
//         urls.push(`${baseUrl}${pdfLink}`);
//       }
//     });

//     return urls;
//   } catch (error) {
//     console.error("Error scraping arXiv PDFs:", error);
//     return []; // Return empty array on error to prevent crashes
//   }
  return ur;
}
const ur = [
  "https://arxiv.org/list/cs.AI/recent",
  "https://arxiv.org/list/cs.LG/recent",
  "https://arxiv.org/list/cs.CV/recent",
  "https://arxiv.org/list/cs.CL/recent",
  "https://arxiv.org/list/cs.NE/recent",
  "https://arxiv.org/list/cs.RO/recent",
  "https://arxiv.org/list/cs.DS/recent",
  "https://arxiv.org/list/cs.CR/recent",
  "https://arxiv.org/list/cs.SE/recent",
  "https://arxiv.org/list/cs.SI/recent",
  "https://arxiv.org/list/cs.HC/recent",
  "https://arxiv.org/list/cs.OH/recent",
  "https://arxiv.org/list/cs.GT/recent",
  "https://arxiv.org/list/cs.CY/recent",
  "https://arxiv.org/list/cs.AR/recent",
  "https://arxiv.org/list/cs.MM/recent",
  "https://arxiv.org/list/cs.NI/recent",
  "https://arxiv.org/list/cs.IT/recent",
  "https://arxiv.org/list/cs.DL/recent",
  "https://arxiv.org/list/cs.FL/recent"
]; 
//function register(nodeRegistry: NodeRegistry): void {
export  const createArxivNewPapersNode = (
    id: number,
    type: { x: number; y: number }
  ): ArxivNewPapersNode => ({
    id,
    title: "Arxiv New Papers",
    nodeValue: undefined,
    nodeType: "ArxivNewPapers",
    sockets: [
      {
        id: id * 100 + 1,
        title: "Output URL",
        type: "output",
        nodeId: id,
        dataType: "string",
      },
    ],
    x: type.x,
    y: type.y,
    width: 240,
    height: 120,
    selected: false,
    processing: false,
process:async ({ node }) => {
    const baseUrl = 'https://arxiv.org';
    const category = 'cs.AI';

    try {
      const pdfUrls = await scrapeCategoryPdfUrls(baseUrl, category);
      console.log('PDF URLs:', pdfUrls);
      return { [node.id * 100 + 1]: pdfUrls };
    } catch (error) {
      console.error('Error in ArxivNewPapersNode process:', error instanceof Error ? error.message : error);
      return { [node.id * 100 + 1]: '' };
    }
  },
    // process: async ({ node }) => {
    //   return {
    //     [node.id * 100 + 1]: ur,// ✅ constant output
    //   };
    // },

    configParameters: [],
    getConfigParameters() {
      return this.configParameters || [];
    },
    getConfigParameter(parameterName) {
      return (this.configParameters ?? []).find(
        (param) => param.parameterName === parameterName
      );
    },
    setConfigParameter(parameterName, value) {
      const parameter = (this.configParameters ?? []).find(
        (param) => param.parameterName === parameterName
      );
      if (parameter) parameter.paramValue = value;
    },
  });

 
  // ✅ Correct registration
 
export function register(nodeRegistry: NodeRegistry): void {
  console.log("Registering Claude Chat Node");
  nodeRegistry.registerNodeType("ArxivNewPapers", createArxivNewPapersNode);
}