import React from 'react';
import { PanelProps } from '@grafana/data';
import { useAsync } from 'react-use';
import { Alert, Card, LoadingPlaceholder, ScrollContainer } from '@grafana/ui';

import { Options } from '../types';
import { Entity } from '../../types/backstage';
import { Icons } from '../../components/icons/Icons';
import { AppPluginSettings } from '../../types/settings';
import {
  formatEntityRef,
  getEntitesByRefs,
  getLink,
  getSettings,
  getUserRef,
} from '../../utils/utils.entities';

interface Props extends PanelProps<Options> { }

export const Panel: React.FC<Props> = ({
  options,
  width,
  height,
  replaceVariables,
}) => {
  const state = useAsync(async (): Promise<{
    settings: AppPluginSettings;
    entities: Entity[];
  }> => {
    const settings = await getSettings();
    const userRef = await getUserRef();

    const owner = formatEntityRef(replaceVariables(options.owner), 'group');
    let groupRefs: string[] = [];
    let entities: Entity[] = [];

    if (!owner || owner.startsWith('user:')) {
      const userEntities = await getEntitesByRefs([owner || userRef]);

      const tmpGroupRefs = userEntities.flatMap((user) => {
        const groups =
          user.relations?.filter(
            (relation) =>
              relation.type === 'memberOf' ||
              relation.type === 'hasMember' ||
              relation.type === 'childOf',
          ) || [];
        return groups.map((group) => group.targetRef);
      });
      groupRefs.push(...tmpGroupRefs);

      const tmpEntities = await getEntitesByRefs(
        userEntities.flatMap((entity) => {
          const entities =
            entity.relations?.filter(
              (relation) =>
                relation.type !== 'memberOf' &&
                relation.type !== 'hasMember' &&
                relation.type !== 'childOf',
            ) || [];
          return entities.map((entity) => entity.targetRef);
        }),
      );
      entities.push(...tmpEntities);
    } else if (owner.startsWith('group:')) {
      groupRefs = [owner];
    }

    if (groupRefs.length > 0) {
      const groupEntities = await getEntitesByRefs(groupRefs);

      const tmpEntities = await getEntitesByRefs(
        groupEntities.flatMap((group) => {
          const entities =
            group.relations?.filter(
              (relation) =>
                relation.targetRef !== 'memberOf' &&
                relation.type !== 'hasMember' &&
                relation.type !== 'childOf',
            ) || [];
          return entities.map((entity) => entity.targetRef);
        }),
      );
      entities.push(...tmpEntities);
    }

    return { settings, entities };
  }, [options.owner]);

  if (state.loading) {
    return <LoadingPlaceholder text={'Loading...'} />;
  }

  if (state.error) {
    return (
      <Alert severity="error" title="Failed to load entities">
        {state.error.message}
      </Alert>
    );
  }

  return (
    <ScrollContainer maxWidth={width} height={height}>
      <ul
        style={{
          listStyle: 'none',
          display: 'grid',
          gap: '8px',
        }}
      >
        {state.value?.entities?.map((entity) => (
          <li
            key={`${entity.kind}:${entity.metadata.namespace}/${entity.metadata.name}`}
          >
            <Card
              noMargin
              href={getLink(entity, state.value.settings.dashboards)}
            >
              <Card.Heading>{entity.metadata.name}</Card.Heading>
              <Card.Figure>
                <Icons icon={entity.kind} size={40} />
              </Card.Figure>
              <Card.Description>{entity.metadata.description}</Card.Description>
            </Card>
          </li>
        ))}
      </ul>
    </ScrollContainer>
  );
};
