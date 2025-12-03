import React from 'react';
import {
  Edge,
  ConnectionLineType,
  Node,
  Position,
  ReactFlow,
} from '@xyflow/react';
import dagre from 'dagre';
import { css, cx } from '@emotion/css';

import { GraphEdge } from './GraphEdge';
import { GraphNode, nodeHeight, nodeWidth } from './GraphNode';

import '@xyflow/react/dist/style.css';

const getLayoutedElements = (
  dagreGraph: dagre.graphlib.Graph,
  nodes: Node[],
  edges: Edge[],
  direction = 'LR',
): { nodes: Node[]; edges: Edge[] } => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };

    return newNode;
  });

  return { nodes: newNodes, edges };
};

export const Graph: React.FC<{
  width: number;
  height: number;
  initialNodes: Node[];
  initialEdges: Edge[];
}> = ({ width, height, initialNodes, initialEdges }) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  const { nodes, edges } = getLayoutedElements(
    dagreGraph,
    initialNodes,
    initialEdges,
  );

  return (
    <div
      className={cx(css`
        width: ${width}px;
        height: ${height}px;
      `)}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        connectionLineType={ConnectionLineType.SmoothStep}
        nodeTypes={{
          catalog: GraphNode,
        }}
        edgeTypes={{
          catalog: GraphEdge,
        }}
        fitView={true}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      ></ReactFlow>
    </div>
  );
};
