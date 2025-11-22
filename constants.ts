import { NodeType } from './types';
import { MarkerType } from 'reactflow';

export const INITIAL_REACTFLOW_NODES = [
  { 
    id: 'start', 
    type: 'processNode', 
    position: { x: 100, y: 250 }, 
    data: { 
      id: 'start', 
      type: NodeType.PROCESS_STEP, 
      title: 'Start Process',
      risks: [] 
    } 
  },
  { 
    id: 'step1', 
    type: 'processNode', 
    position: { x: 400, y: 250 }, 
    data: { 
      id: 'step1', 
      type: NodeType.PROCESS_STEP, 
      title: 'Review Document',
      risks: [] 
    } 
  },
];

const edgeStyle = { strokeWidth: 2, stroke: '#64748b' };
const markerEnd = { type: MarkerType.ArrowClosed, color: '#64748b' };

export const INITIAL_REACTFLOW_EDGES = [
  { id: 'e1', source: 'start', target: 'step1', style: edgeStyle, markerEnd, data: { risks: [] } },
];

export const SUGGESTION_CHIPS = [
  "Identify risks in this process",
  "Add controls to the approval step",
  "Analyze for segregation of duties",
  "Generate a risk control matrix"
];

export const SYSTEM_INSTRUCTION = `
You are an expert Internal Auditor and Process Analyst.
The user is building a process flow visualization with embedded Risks and Controls.

Your Goal:
1. Analyze user input (uploaded procedures, policies, etc.).
2. Construct a process flow using 'add_node' and 'connect_nodes'.
3. Identify RISKS associated with specific steps or links and use 'add_risk' to attach them.
4. Identify CONTROLS that mitigate those risks and use 'add_control' to attach them to the specific risk.

Data Model:
- Nodes: Process Steps. Can contain multiple Risks.
- Edges: Connections. Can also contain multiple Risks.
- Risks: Have a name and description.
- Controls: Have a name and description. They belong to a specific Risk.

Visual Logic:
- Nodes with Risks that have NO controls appear with a Red warning.
- Nodes with Risks that have at least one control appear with a Yellow warning.

Guidelines:
- Use 'add_node' to create steps.
- Use 'add_risk' to add a risk to a node or edge.
- Use 'add_control' to add a control to a previously added risk.
- If the user uploads a text, extract the process first, then perform a risk assessment on it if asked.
- Be precise with 'targetId' when adding risks. Use the IDs you assigned in 'add_node'.
`;