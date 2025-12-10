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
  getEntitiesByQuery,
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
    const ownerRef = options.owner
      ? formatEntityRef(replaceVariables(options.owner), 'group')
      : await getUserRef();

    const ownerRefs: string[] = [ownerRef];

    if (ownerRef.startsWith('user:')) {
      const groups = await getEntitiesByQuery(
        `filter=relations.hasMember=${ownerRef}`,
      );
      for (const group of groups) {
        if (group) {
          ownerRefs.push(
            `group:${group.metadata.namespace || 'default'}/${group.metadata.name}`,
          );
        }
      }
    }

    const query = ownerRefs
      .map((ownerRef) => `relations.ownedBy=${ownerRef}`)
      .join(',');
    const entities = await getEntitiesByQuery(`filter=${query}`);

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
