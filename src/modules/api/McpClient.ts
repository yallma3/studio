export interface ServerConfig {
    command: string;
    args?: string[];
    env?: Record<string, string>;
}
  
export interface ToolCall {
    tool: string;
    input: Record<string, unknown>;
}

export class McpHttpClient {
    private apiBaseUrl: string = "http://localhost:3001/mcp";
  
    constructor(private serverUrl: string) {}
  
    // List tools
    async listTools() {
      const res = await fetch(
        `${this.apiBaseUrl}/http/tools?serverUrl=${encodeURIComponent(
          this.serverUrl
        )}`
      );
      if (!res.ok) throw new Error(`Failed to fetch tools: ${res.statusText}`);
      return res.json();
    }
  
    // Call tool
    async callTool(toolCall: ToolCall) {
      const res = await fetch(`${this.apiBaseUrl}/http/tools/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serverUrl: this.serverUrl,
          toolCall,
        }),
      });
      if (!res.ok) throw new Error(`Failed to call tool: ${res.statusText}`);
      return res.json();
    }
  
    // List prompts
    async listPrompts() {
      const res = await fetch(
        `${this.apiBaseUrl}/http/prompts?serverUrl=${encodeURIComponent(
          this.serverUrl
        )}`
      );
      if (!res.ok) throw new Error(`Failed to fetch prompts: ${res.statusText}`);
      return res.json();
    }
  
    // Get specific prompt
    async getPrompt(prompt: string) {
      const res = await fetch(
        `${this.apiBaseUrl}/http/prompts/${encodeURIComponent(
          prompt
        )}?serverUrl=${encodeURIComponent(this.serverUrl)}`
      );
      if (!res.ok) throw new Error(`Failed to fetch prompt: ${res.statusText}`);
      return res.json();
    }
  
    // List resources
    async listResources() {
      const res = await fetch(
        `${this.apiBaseUrl}/http/resources?serverUrl=${encodeURIComponent(
          this.serverUrl
        )}`
      );
      if (!res.ok) throw new Error(`Failed to fetch resources: ${res.statusText}`);
      return res.json();
    }
  
    // Get specific resource
    async getResource(resource: string) {
      const res = await fetch(
        `${this.apiBaseUrl}/http/resources/${encodeURIComponent(
          resource
        )}?serverUrl=${encodeURIComponent(this.serverUrl)}`
      );
      if (!res.ok)
        throw new Error(`Failed to fetch resource: ${res.statusText}`);
      return res.json();
    }
}

export class McpStdioClient {
    private apiBaseUrl: string = "http://localhost:3001/mcp";
  
    constructor(private serverConfig: ServerConfig) {}
  
    // List tools
    async listTools() {
      const res = await fetch(`${this.apiBaseUrl}/stdio/tools`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.serverConfig),
      });
      if (!res.ok) throw new Error(`Failed to list tools: ${res.statusText}`);
      return res.json();
    }
  
    // Call a tool
    async callTool(toolCall: ToolCall) {
      const res = await fetch(`${this.apiBaseUrl}/stdio/tools/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serverConfig: this.serverConfig,
          toolCall,
        }),
      });
      if (!res.ok) throw new Error(`Failed to call tool: ${res.statusText}`);
      return res.json();
    }
  
    // List prompts
    async listPrompts() {
      const res = await fetch(`${this.apiBaseUrl}/stdio/prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.serverConfig),
      });
      if (!res.ok) throw new Error(`Failed to list prompts: ${res.statusText}`);
      return res.json();
    }
  
    // Get specific prompt
    async getPrompt(prompt: string) {
      const res = await fetch(`${this.apiBaseUrl}/stdio/prompts/${prompt}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.serverConfig),
      });
      if (!res.ok) throw new Error(`Failed to get prompt: ${res.statusText}`);
      return res.json();
    }
  
    // List resources
    async listResources() {
      const res = await fetch(`${this.apiBaseUrl}/stdio/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.serverConfig),
      });
      if (!res.ok) throw new Error(`Failed to list resources: ${res.statusText}`);
      return res.json();
    }
  
    // Get specific resource
    async getResource(resource: string) {
      const res = await fetch(`${this.apiBaseUrl}/stdio/resources/${resource}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.serverConfig),
      });
      if (!res.ok) throw new Error(`Failed to get resource: ${res.statusText}`);
      return res.json();
    }
}
  