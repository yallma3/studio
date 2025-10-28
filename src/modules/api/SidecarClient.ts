/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SidecarCommand {
  id?: string;
  type:
    | "run_workspace"
    | "stop_workspace"
    | "run_workflow"
    | "workflow_result"
    | "workflow_json"
    | "console_input"
    | "console_prompt"
    | "message"
    | "ping"
    | "pong"
    | "workflow_output";

  workspaceId?: string;
  data?: unknown;
  timestamp?: string;
}

export interface SidecarResponse {
  id: string;
  success: boolean;
  message: string;
  data?: unknown;
}

export class SidecarClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private shouldReconnect = true;
  private connectionStatus:
    | "disconnected"
    | "connecting"
    | "connected"
    | "error" = "disconnected";
  private statusCallbacks: ((status: string) => void)[] = [];
  private commandCallbacks: ((command: SidecarCommand) => void)[] = [];
  private consoleEventCallbacks: ((event: any) => void)[] = [];

  constructor(private wsUrl: string = "ws://localhost:3001") {}

  connect(): void {
    console.log("Connecting");
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.connectionStatus = "connecting";
    this.notifyStatusChange();
    this.shouldReconnect = true;

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log("Connected to sidecar WebSocket");
        this.connectionStatus = "connected";
        this.reconnectAttempts = 0;
        this.notifyStatusChange();
      };

      this.ws.onmessage = (event) => {
        try {
          const command: SidecarCommand = JSON.parse(event.data);
          this.handleCommand(command);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      this.ws.onclose = () => {
        console.log("Disconnected from sidecar WebSocket");
        this.connectionStatus = "disconnected";
        this.notifyStatusChange();
        if (this.shouldReconnect) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.connectionStatus = "error";
        this.notifyStatusChange();
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      this.connectionStatus = "error";
      this.notifyStatusChange();
      this.attemptReconnect();
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionStatus = "disconnected";
    this.notifyStatusChange();
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
    );

    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  private handleCommand(command: SidecarCommand): void {
    console.log("Received command from sidecar:", command);
    this.commandCallbacks.forEach((callback) => callback(command));
    if (command.type === "workflow_output" && command.data) {
      this.consoleEventCallbacks.forEach((cb) => cb(command.data));
    }
  }

  sendMessage(message: SidecarCommand): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("Cannot send message: WebSocket not connected");
    }
  }

  sendResponse(response: SidecarResponse): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(response));
    } else {
      console.warn("Cannot send response: WebSocket not connected");
    }
  }

  onStatusChange(callback: (status: string) => void): void {
    this.statusCallbacks.push(callback);
  }

  offStatusChange(callback: (status: string) => void): void {
    const index = this.statusCallbacks.indexOf(callback);
    if (index > -1) {
      this.statusCallbacks.splice(index, 1);
    }
  }

  onCommand(callback: (command: SidecarCommand) => void): void {
    this.commandCallbacks.push(callback);
  }

  offCommand(callback: (command: SidecarCommand) => void): void {
    const index = this.commandCallbacks.indexOf(callback);
    if (index > -1) {
      this.commandCallbacks.splice(index, 1);
    }
  }

  onConsoleEvent(callback: (event: any) => void): void {
    this.consoleEventCallbacks.push(callback);
  }

  offConsoleEvent(callback: (event: any) => void): void {
    const index = this.consoleEventCallbacks.indexOf(callback);
    if (index > -1) {
      this.consoleEventCallbacks.splice(index, 1);
    }
  }

  getConnectionStatus(): string {
    return this.connectionStatus;
  }

  private notifyStatusChange(): void {
    this.statusCallbacks.forEach((callback) => callback(this.connectionStatus));
  }
}

// Singleton instance
export const sidecarClient = new SidecarClient();
