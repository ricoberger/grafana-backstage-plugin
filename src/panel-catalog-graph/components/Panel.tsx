import React from 'react';
import { PanelProps } from '@grafana/data';
import { useAsync } from 'react-use';
import { Edge, Node } from '@xyflow/react';
import { Alert, LoadingPlaceholder } from '@grafana/ui';

import { Options } from '../types';
import { Graph } from './Graph';
import { formatEntityRef, getEntitesByRefs } from '../../utils/utils.entities';

interface Props extends PanelProps<Options> { }

export const Panel: React.FC<Props> = ({
  options,
  width,
  height,
  replaceVariables,
}) => {
  const state = useAsync(async (): Promise<{
    nodes: Node[];
    edges: Edge[];
  }> => {
    /**
     * Get the entity spec and the entity spec for all relations.
     */
    const entityId = formatEntityRef(
      replaceVariables(options.entity),
      'component',
    );
    const entity = (await getEntitesByRefs([entityId]))[0];
    const relationEntites = (
      await getEntitesByRefs(
        entity.relations.map((relation) => relation.targetRef),
      )
    ).filter((entity) => entity !== null);

    /**
     * Create the nodes and edges for the graph. The "isRoot" property is used
     * to indicate the entity for which the graph should be displayed, set via
     * the panel options.
     */
    const nodes = [
      {
        id: entityId,
        type: 'catalog',
        data: {
          isRoot: true,
          kind: entity.kind,
          namespace: entity.metadata.namespace,
          name: entity.metadata.name,
        },
        position: { x: 0, y: 0 },
      },
    ];
    const edges = [];

    for (const relationEntity of relationEntites) {
      /**
       * Add the relation entity as node to the graph. Also determine the
       * relation types bwtween the entity and the relation and the relation and
       * the entity.
       */
      const relationEntityId = `${relationEntity.kind.toLowerCase()}:${relationEntity.metadata.namespace}/${relationEntity.metadata.name}`;
      const relationEntityRelationType = relationEntity.relations.filter(
        (relation) => relation.targetRef === entityId,
      )[0].type;
      const entityRelationType = entity.relations.filter(
        (r) => r.targetRef === relationEntityId,
      )[0].type;

      nodes.push({
        id: relationEntityId,
        type: 'catalog',
        data: {
          isRoot: false,
          kind: relationEntity.kind,
          namespace: relationEntity.metadata.namespace,
          name: relationEntity.metadata.name,
        },
        position: { x: 0, y: 0 },
      });

      /**
       * Use the relation type to determine the direction of the edge.
       * See: https://github.com/backstage/backstage/blob/master/plugins/catalog-graph/src/lib/types/relations.ts
       */
      let source = '';
      let target = '';
      let label = '';
      if (
        [
          'ownedBy',
          'apiConsumedBy',
          'providesApi',
          'partOf',
          'childOf',
          'memberOf',
          'dependencyOf',
        ].includes(entityRelationType)
      ) {
        source = relationEntityId;
        target = entityId;
        label = `${relationEntityRelationType} / ${entityRelationType}`;
      } else {
        source = entityId;
        target = relationEntityId;
        label = `${entityRelationType} / ${relationEntityRelationType}`;
      }

      edges.push({
        id: `${source}-${target}`,
        type: 'catalog',
        source: source,
        target: target,
        label: label,
      });
    }

    return { nodes: nodes, edges: edges };
  }, [options.entity]);

  if (state.loading) {
    return <LoadingPlaceholder text={'Loading...'} />;
  }

  if (state.error) {
    return (
      <Alert severity="error" title="Failed to load graph">
        {state.error.message}
      </Alert>
    );
  }

  return (
    <Graph
      width={width}
      height={height}
      initialNodes={state.value!.nodes}
      initialEdges={state.value!.edges}
    />
  );
};
