import { NodeRegistry } from "../NodeRegistry";
import {
  BaseNode,
  NodeValue,
  NodeExecutionContext,
  Position,
} from "../NodeTypes";


export interface ArxivNewPapersNode extends BaseNode {
  nodeType: "ArxivPapers";
  nodeValue?: NodeValue;
  process: (context: NodeExecutionContext) => Promise<NodeValue | string[] | undefined>;
}


// arxivApi.ts
export interface ArxivPaper {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published: string;
  link: string;
}

export async function fetchArxivPdfUrls(maxResults = 10): Promise<string[]> {
  const url = `https://export.arxiv.org/api/query?search_query=cat:cs.AI&sortBy=submittedDate&sortOrder=descending&max_results=${maxResults}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ArXiv: ${res.status}`);
  }

  const xmlText = await res.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "application/xml");

  const entries = Array.from(xmlDoc.getElementsByTagName("entry"));

  return entries.map(entry => {
    const id = entry.getElementsByTagName("id")[0]?.textContent || "";
    const arxivId = id.split("/abs/")[1]; // extract e.g. "2508.12345v1"
    return `https://arxiv.org/pdf/${arxivId}.pdf`;
  });
}



//function register(nodeRegistry: NodeRegistry): void {
export  const createArxivNewPapersNode = (
    id: number,
    type: Position,
    nodeValue: number = 10
  ): ArxivNewPapersNode => ({
    id,
    title: "Arxiv Papers",
    nodeValue: nodeValue,
    nodeType: "ArxivPapers",
     sockets: [
        {
          id: id * 100 + 1,
          title: "Input",
          type: "input",
          nodeId: id,
          dataType: "number",
        },
        {
          id: id * 100 + 2,
          title: "Output",
          type: "output",
          nodeId: id,
          dataType: "string",
        },
      ],
    x: type.x,
    y: type.y,
    width: 280,
    height: 200,
    selected: false,
    processing: false,
    process:async (context: NodeExecutionContext) => {
        try {
          const n = context.node
          console.log("NODE VALUE", n.nodeValue)
          const maxResults = n.nodeValue as number
          const pdfUrls = await fetchArxivPdfUrls(maxResults);
          console.log('PDF URLs:', pdfUrls);
          return pdfUrls;
        } catch (error) {
          console.error('Error in ArxivNewPapersNode process:', error instanceof Error ? error.message : error);
          return `Error in ArxivNewPapersNode process: ${error instanceof Error ? error.message : error}`;
        }
    },
    // process: async ({ node }) => {
    //   return {
    //     [node.id * 100 + 1]: ur,// ✅ constant output
    //   };
    // },

    configParameters: [
      {
        parameterName: "Max Results",
        parameterType: "number",
        defaultValue: 10,
        valueSource: "UserInput",
        UIConfigurable: true,
        description: "Max number of results to return",
        isNodeBodyContent: true,
      },
    ],
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

 
export function register(nodeRegistry: NodeRegistry): void {
  console.log("Registering Arxiv New Papers Node");
  nodeRegistry.registerNodeType("ArxivPapers", createArxivNewPapersNode);
}
