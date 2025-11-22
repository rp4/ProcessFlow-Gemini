import { NodeType } from './types';
import { MarkerType } from 'reactflow';

export const INITIAL_REACTFLOW_NODES = [
  { id: 'start', type: 'processNode', position: { x: 100, y: 250 }, data: { id: 'start', type: NodeType.PROCESS_STEP, title: 'Start Process' } },
  { id: 'step1', type: 'processNode', position: { x: 400, y: 250 }, data: { id: 'step1', type: NodeType.PROCESS_STEP, title: 'Review Document' } },
  { id: 'step2', type: 'processNode', position: { x: 700, y: 150 }, data: { id: 'step2', type: NodeType.PROCESS_STEP, title: 'Approve' } },
  { id: 'step3', type: 'processNode', position: { x: 700, y: 350 }, data: { id: 'step3', type: NodeType.PROCESS_STEP, title: 'Reject' } },
];

const edgeStyle = { strokeWidth: 2, stroke: '#64748b' };
const markerEnd = { type: MarkerType.ArrowClosed, color: '#64748b' };

export const INITIAL_REACTFLOW_EDGES = [
  { id: 'e1', source: 'start', target: 'step1', style: edgeStyle, markerEnd },
  { id: 'e2', source: 'step1', target: 'step2', label: 'Yes', style: edgeStyle, markerEnd },
  { id: 'e3', source: 'step1', target: 'step3', label: 'No', style: edgeStyle, markerEnd },
];

export const SUGGESTION_CHIPS = [
  "Analyze the uploaded procedure",
  "Add a decision step",
  "Simplify the flow",
  "Check for bottlenecks"
];

export const SYSTEM_INSTRUCTION = `
You are an expert Business Process Analyst.
The user is building a process flow visualization (flowchart). 
The only node type available is 'PROCESS_STEP'.

Your Goal:
1. Analyze user input (which may include uploaded text from policies, transcripts, or procedures).
2. Break down the text into logical process steps.
3. Construct a graph visualization using the provided tools.

Guidelines:
- Use 'add_node' to create steps. Keep titles concise (2-5 words). Put details in the 'description' if needed.
- Use 'connect_nodes' to show the flow logic. Use edge labels (e.g., "Yes", "No", "If > $500") for decision paths.
- If the user asks to 'analyze this document', clear the current graph first using 'clear_graph', then build the new one from scratch.
- IMPORTANT: When adding new nodes that you intend to connect immediately, YOU MUST ASSIGN A UNIQUE 'id' to the 'add_node' tool (e.g., 'step_1', 'decision_a'). Then use those same IDs in 'connect_nodes'.
- Be precise with connectivity. Ensure the flow is logical.
`;
