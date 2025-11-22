export enum NodeType {
  PROCESS_STEP = 'PROCESS_STEP'
}

export interface ProcessNodeData {
  id: string; // Kept for reference in data
  type: NodeType;
  title: string;
  description?: string;
  // Update to accept new values
  onEdit?: (id: string, newTitle: string, newDescription: string) => void;
}

export interface EdgeData {
  label?: string;
}

export enum MessageRole {
  USER = 'user',
  MODEL = 'model'
}

export enum ContentType {
  TEXT = 'text',
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string; // Text content
  type: ContentType;
  timestamp: number;
  attachedFileName?: string;
}

export interface SimulationResult {
  bin: string;
  frequency: number;
}