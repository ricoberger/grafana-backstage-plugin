import React from 'react';
import { PanelProps } from '@grafana/data';
import { getBackendSrv, PanelDataErrorView } from '@grafana/runtime';
import { useAsync } from 'react-use';
import { lastValueFrom } from 'rxjs';
import { Edge, Node } from '@xyflow/react';
import { Alert, LoadingPlaceholder } from '@grafana/ui';

import { Options } from '../types';
import { EntitiesResult, Entity } from '../../types/backstage';
import { Graph } from './Graph';

const getEntites = async (entityRefs: string[]): Promise<Entity[]> => {
  const response = getBackendSrv().fetch({
    url: `/api/plugins/ricoberger-backstage-app/resources/catalog/entities/by-refs`,
    method: 'POST',
    headers: {
      Accept: 'application/json, */*',
      'Content-Type': 'application/json',
    },
    data: { entityRefs: entityRefs },
  });
  const result = await lastValueFrom(response);
  const data = result.data as EntitiesResult;

  if (!data.items) {
    return [];
  }
  return data.items;
};

interface Props extends PanelProps<Options> { }

export const Panel: React.FC<Props> = ({
  options,
  data,
  width,
  height,
  replaceVariables,
  fieldConfig,
  id,
}) => {
  const state = useAsync(async (): Promise<{
    nodes: Node[];
    edges: Edge[];
  }> => {
    /**
     * Get the entity spec and the entity spec for all relations.
     */
    const entityId = replaceVariables(options.entity);
    const entity = (await getEntites([entityId]))[0];
    const relationEntites = (
      await getEntites(entity.relations.map((relation) => relation.targetRef))
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

  if (data.series.length === 0) {
    return (
      <PanelDataErrorView
        fieldConfig={fieldConfig}
        panelId={id}
        data={data}
        needsStringField
      />
    );
  }

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
