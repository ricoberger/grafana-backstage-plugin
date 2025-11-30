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
    const rootId = replaceVariables(options.entity);
    /**
     * Get the root node, for which the graph should be displayed. Afterwards
     * we get all leaf nodes, by looking at the relations of the root node.
     */
    const rootEntites = await getEntites([rootId]);
    if (rootEntites.length !== 1) {
      throw new Error('invalid root entity');
    }
    const rootEntity = rootEntites[0];

    const leafEntites = await getEntites(
      rootEntity.relations.map((relation) => relation.targetRef),
    );

    /**
     * Create the nodes and edges for the graph. The "isRoot" property is used
     * to indicate the root node in the graph by applying a custom style.
     */
    const nodes = [
      {
        id: rootId,
        type: 'catalog',
        data: {
          isRoot: true,
          kind: rootEntity.kind,
          namespace: rootEntity.metadata.namespace,
          name: rootEntity.metadata.name,
        },
        position: { x: 0, y: 0 },
      },
    ];
    const edges = [];

    for (const relation of rootEntity.relations) {
      /**
       * Loop trhough all relations of the root node and add them as nodes to
       * the graph. Then we get the fetched leaf node for the relation.
       */
      const leafEntity = leafEntites.filter((entity) => {
        const id =
          `${entity.kind}:${entity.metadata.namespace}/${entity.metadata.name}`.toLowerCase();
        return id === relation.targetRef;
      });
      const leafEntityRelation = leafEntity[0].relations.filter(
        (relation) => relation.targetRef === rootId,
      );

      nodes.push({
        id: relation.targetRef,
        type: 'catalog',
        data: {
          isRoot: false,
          kind: leafEntity[0].kind,
          namespace: leafEntity[0].metadata.namespace,
          name: leafEntity[0].metadata.name,
        },
        position: { x: 0, y: 0 },
      });

      /**
       * Use the leaf node to define, which of the nodes is the source and which
       * is the target in the edge.
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
        ].includes(relation.type)
      ) {
        source = relation.targetRef;
        target = rootId;
        label = `${leafEntityRelation[0].type} / ${relation.type}`;
      } else {
        source = rootId;
        target = relation.targetRef;
        label = `${relation.type} / ${leafEntityRelation[0].type}`;
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
