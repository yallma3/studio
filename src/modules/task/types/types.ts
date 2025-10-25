import { Position } from "../../flow/types/NodeTypes";

export interface TaskSocket {
  id: number;
  title: string;
  type: "input" | "output";
}

export interface Task {
  id: string;
  title: string;
  description: string;
  expectedOutput: string;
  type: string;
  executorId: string | null;
  position: Position;
  selected: boolean;
  sockets: TaskSocket[];
}

export interface TaskConnection {
  fromSocket: number;
  toSocket: number;
}

export interface TaskGraph {
  tasks: Task[];
  connections: TaskConnection[];
}
