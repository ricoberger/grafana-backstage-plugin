import React from 'react';
import { Node, Position, Handle, NodeProps } from '@xyflow/react';
import { Stack, useTheme2 } from '@grafana/ui';

import { Icons } from '../../components/icons/Icons';

export const nodeWidth = 172;
export const nodeHeight = 36;

export const GraphNode: React.FC<
  NodeProps<Node<{ isRoot: boolean; kind: string; name: string }>>
> = ({ data }) => {
  const theme = useTheme2();

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: 'rgba(0, 0, 0, 0)',
          borderStyle: 'none',
        }}
      />
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
          borderRadius: theme.shape.radius.default,
        }}
      >
        <Stack direction="row" alignItems="center" gap={0.25}>
          <Icons icon={data.kind} size={6} />
          <span>{data.name}</span>
        </Stack>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: 'rgba(0, 0, 0, 0)',
          borderStyle: 'none',
        }}
      />
    </>
  );
};
