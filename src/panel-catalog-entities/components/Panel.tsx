import React from 'react';
import { PanelProps } from '@grafana/data';
import { getBackendSrv, PanelDataErrorView } from '@grafana/runtime';
import { useAsync } from 'react-use';
import { lastValueFrom } from 'rxjs';
import { Alert, Card, LoadingPlaceholder, ScrollContainer } from '@grafana/ui';

import { Options } from '../types';
import { EntitiesResult, Entity } from '../../types/backstage';
import { Icons } from '../../components/icons/Icons';
import { interpolateJSONPath } from '../../utils/utils.interpolate';
import { AppPluginSettings } from '../../types/settings';
import { formatEntityRef } from '../../utils/utils.entities';

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

const getSettings = async (): Promise<AppPluginSettings> => {
  const response = getBackendSrv().fetch({
    url: `/api/plugins/ricoberger-backstage-app/settings`,
    method: 'GET',
  });
  const result = await lastValueFrom(response);

  return (result.data as { jsonData: AppPluginSettings }).jsonData;
};

const getUser = async (): Promise<string> => {
  const response = getBackendSrv().fetch({
    url: `/api/user`,
    method: 'GET',
  });
  const result = await lastValueFrom(response);

  return (result.data as { login: string }).login;
};

const getLink = (
  entity: Entity,
  dashboards?: Array<[string, string]>,
): string | undefined => {
  if (
    entity.metadata.annotations &&
    entity.metadata.annotations['grafana.com/dashboard']
  ) {
    const link = interpolateJSONPath(
      entity.metadata.annotations['grafana.com/dashboard'],
      entity,
    );
    if (link) {
      return `/d/${link}`;
    }
  }

  const dashboard = dashboards?.filter(
    (dashboard: [string, string]) => dashboard[0] === entity.kind,
  );
  if (dashboard && dashboard.length === 1) {
    const link = interpolateJSONPath(dashboard[0][1], entity);
    if (link) {
      return `/d/${link}`;
    }
  }

  return undefined;
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
    settings: AppPluginSettings;
    entities: Entity[];
  }> => {
    const settings = await getSettings();
    const user = await getUser();

    const owner = formatEntityRef(replaceVariables(options.owner));
    let groupRefs: string[] = [];
    let entities: Entity[] = [];

    if (!owner || owner.startsWith('user:')) {
      const userEntities = await getEntites([owner || `user:default/${user}`]);

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

      const tmpEntities = await getEntites(
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
      const groupEntities = await getEntites(groupRefs);

      const tmpEntities = await getEntites(
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
