import { PanelProps } from '@grafana/data';
import { Alert, Card, LoadingPlaceholder, ScrollContainer } from '@grafana/ui';
import React from 'react';
import { useAsync } from 'react-use';

import { Icons } from '../../components/icons/Icons';
import { Entity } from '../../types/backstage';
import { AppPluginSettings } from '../../types/settings';
import {
  formatEntityRef,
  getEntitiesByQuery,
  getLink,
  getSettings,
  getUserRef,
} from '../../utils/utils.entities';
import { Options } from '../types';

interface Props extends PanelProps<Options> { }

export function Panel({ options, width, height, replaceVariables }: Props) {
  const entityRef = formatEntityRef(replaceVariables(options.owner), 'group');

  const state = useAsync(async (): Promise<{
    settings: AppPluginSettings;
    entities: Entity[];
  }> => {
    const settings = await getSettings();
    const ownerRef = options.owner ? entityRef : await getUserRef();

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
}
