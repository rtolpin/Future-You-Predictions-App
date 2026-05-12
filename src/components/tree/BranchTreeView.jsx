import { useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { DecisionNode } from './DecisionNode.jsx';
import { OutcomeEdge } from './OutcomeEdge.jsx';
import { getNodeColor } from '../../utils/scoreCalculator.js';

const nodeTypes = { decision: DecisionNode };
const edgeTypes = { outcome: OutcomeEdge };

function buildGraph(slots, predictions) {
  const nodes = [];
  const edges = [];
  let prevId = null;
  let y = 0;

  const sortedKeys = Object.keys(slots).sort();

  for (const timeKey of sortedKeys) {
    const cards = slots[timeKey];
    if (!cards?.length) continue;

    const pred = predictions[timeKey];
    const score = pred?.scores?.overall;
    const id = `node-${timeKey}`;

    nodes.push({
      id,
      type: 'decision',
      position: { x: 200, y },
      data: {
        label: cards.map(c => c.label).join(' + '),
        time: timeKey,
        score,
        emoji: cards[0]?.icon,
      },
    });

    if (prevId) {
      edges.push({
        id: `edge-${prevId}-${id}`,
        source: prevId,
        target: id,
        type: 'outcome',
        data: { score },
      });
    }

    prevId = id;
    y += 110;
  }

  return { nodes, edges };
}

export function BranchTreeView({ slots, predictions, onNodeClick }) {
  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildGraph(slots, predictions),
    [slots, predictions]
  );

  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);

  const onConnect = useCallback((params) => setEdges(eds => addEdge(params, eds)), [setEdges]);

  const onNodeClickHandler = useCallback((_, node) => {
    const timeKey = node.id.replace('node-', '');
    onNodeClick?.({ timeKey, prediction: predictions[timeKey] });
  }, [predictions, onNodeClick]);

  if (!nodes.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl">🌿</span>
          <p className="text-xs text-slate-500 mt-2">Add cards to the timeline to see your decision tree</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClickHandler}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        style={{ background: 'transparent' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgba(255,255,255,0.03)" gap={24} size={1} />
        <Controls
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
          }}
        />
        <MiniMap
          nodeColor={(n) => {
            const score = n.data?.score;
            return score ? getNodeColor(score) : '#334155';
          }}
          style={{ background: 'rgba(15,15,20,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}
        />
      </ReactFlow>
    </div>
  );
}
