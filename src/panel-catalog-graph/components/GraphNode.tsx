import React from 'react';
import { Node, Position, Handle, NodeProps } from '@xyflow/react';

export const nodeWidth = 172;
export const nodeHeight = 36;

export const GraphNode: React.FC<
  NodeProps<
    Node<{ isRoot: boolean; kind: string; namespace: string; name: string }>
  >
> = ({ data }) => {
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <div
        style={{
          maxWidth: `${nodeWidth}px`,
          maxHeight: `${nodeHeight}px`,
          overflow: 'hidden',
          padding: '4px 8px',
          backgroundColor: data.isRoot
            ? 'rgb(242, 73, 92)'
            : 'rgb(87, 148, 242)',
          fontSize: '6px',
        }}
      >
        {data.name}
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
};
