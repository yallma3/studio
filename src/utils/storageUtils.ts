import { Node, Connection, GraphState } from "../types/NodeTypes";
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';

export interface CanvasState {
  graphId: string;
  nodes: Node[];
  connections: Connection[];
  nextNodeId: number;
}

/**
 * Save canvas state to a JSON file
 */
export const saveCanvasState = async (graphId: string, nodes: Node[], connections: Connection[], nextNodeId: number): Promise<void> => {
 
  const canvasState: CanvasState = {
    graphId,
    nodes,
    connections,
    nextNodeId
  };
 
  
  // Convert to JSON string
  const stateJson = JSON.stringify(canvasState, null, 2);
  
  try {
    // Open a save dialog to let the user choose the file location and name
    const filePath = await save({
      filters: [{
        name: 'JSON',
        extensions: ['json']
      }],
      defaultPath: `${graphId}.json`
    });

    console.log('Selected save path:', filePath);

    // If user cancels the save dialog
    if (!filePath) {
      return;
    }

    // Write the file to the selected location
    await writeTextFile(filePath, stateJson);
    
    // Store graph state information
    const newGraphState: GraphState = {
      id: graphId,
      name: filePath.split('/').pop() || filePath,
      path: filePath,
      lastModified: Date.now()
    };

    localStorage.setItem(`agent-graph-${graphId}`, JSON.stringify(newGraphState));
    
    console.log('Canvas state saved to file successfully');
  } catch (error) {
    console.error('Error saving canvas state to file:', error);
    
    // Fallback to localStorage if file system access fails
    localStorage.setItem('nodeCanvasState', stateJson);
    console.log('Fallback: Canvas state saved to localStorage');
  }
};

/**
 * Load canvas state from a JSON file
 * Returns the canvas state if found, null otherwise
 */
export const loadCanvasState = async (): Promise<{canvasState: CanvasState, newGraphId: string} | null> => {
  try {
    
    const file = await open({
        multiple: false,
        directory: false,
      });
      

      if (!file) {
        return null;
      }
      const content = await readTextFile(file);
      
      const canvasState = JSON.parse(content);

    try {
      // Parse the JSON string

      const newGraphId = `graph-${Date.now()}`;
      const newGraphState: GraphState = {
        id: newGraphId,
        name: file.split('/').pop() || file,
        path: file,
        lastModified: Date.now()
      };
      localStorage.setItem(`agent-graph-${newGraphId}`, JSON.stringify(newGraphState));


      console.log('Canvas state loaded from file successfully');
      return {canvasState, newGraphId};
    } catch (parseError) {
      console.error('Failed to parse JSON from file:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error loading canvas state from file:', error);
    
    // Fallback to localStorage if file system access fails
    const savedState = localStorage.getItem('nodeCanvasState');
    
    if (savedState) {
      try {
        // Parse the JSON string
        const canvasState = JSON.parse(savedState);
        console.log('Fallback: Canvas state loaded from localStorage');
        return canvasState;
      } catch (parseError) {
        console.error('Failed to parse saved canvas state from localStorage:', parseError);
        return null;
      }
    }
    
    return null;
  }
};
/**
 * Load canvas state from a specified file path
 * Returns the canvas state if found, null otherwise
 * @param filePath - The path to the JSON file containing canvas state
 */
export const loadCanvasStateFromPath = async (filePath: string, graphId: string): Promise<CanvasState | null> => {
  try {
   console.log('Loading canvas state from path:', filePath);
    const content = await readTextFile(filePath);
        
    try {
      // Parse the JSON string
      const canvasState = JSON.parse(content);
      console.log('Canvas state loaded from specified path successfully:', filePath);
      return canvasState;
    } catch (parseError) {
      console.error('Failed to parse JSON from file:', parseError);
      return null;
    }
  } catch (e) {
    console.log('No file found', e);
    const canvasState: CanvasState = {
        graphId: graphId,
        nodes: [],
        connections: [],
        nextNodeId: 0
      }
      return canvasState;
  }
};

// Type definition for File System Access API
declare global {
  interface FileSystemFileHandle {
    getFile(): Promise<File>;
    createWritable(): Promise<FileSystemWritableFileStream>;
  }
  
  interface FileSystemWritableFileStream extends WritableStream {
    write(data: string | ArrayBuffer | ArrayBufferView | Blob): Promise<void>;
    close(): Promise<void>;
  }
  
  interface SaveFilePickerOptions {
    suggestedName?: string;
    types?: {
      description: string;
      accept: Record<string, string[]>;
    }[];
  }
  
  interface OpenFilePickerOptions {
    multiple?: boolean;
    types?: {
      description: string;
      accept: Record<string, string[]>;
    }[];
  }
  
  interface Window {
    showOpenFilePicker(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>;
    showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
  }
} 