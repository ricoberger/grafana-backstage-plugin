import React, { ReactNode } from 'react';
import { PanelProps } from '@grafana/data';
import { getBackendSrv, PanelDataErrorView } from '@grafana/runtime';
import { useAsync } from 'react-use';
import { lastValueFrom } from 'rxjs';
import {
  Alert,
  Text,
  LoadingPlaceholder,
  ScrollContainer,
  Stack,
  Badge,
  TextLink,
} from '@grafana/ui';

import { Options } from '../types';
import { EntitiesResult, Entity } from '../../types/backstage';
import { Icons } from '../../components/icons/Icons';
import { interpolateJSONPath } from '../../utils/utils.interpolate';
import { AppPluginSettings } from '../../types/settings';
import { formatEntityRef } from '../../utils/utils.entities';

const getEntity = async (entityRef: string): Promise<Entity | undefined> => {
  const response = getBackendSrv().fetch({
    url: `/api/plugins/ricoberger-backstage-app/resources/catalog/entities/by-refs`,
    method: 'POST',
    headers: {
      Accept: 'application/json, */*',
      'Content-Type': 'application/json',
    },
    data: { entityRefs: [entityRef] },
  });
  const result = await lastValueFrom(response);
  const data = result.data as EntitiesResult;

  if (!data.items || data.items.length !== 1) {
    return undefined;
  }
  return data.items[0];
};

const getSettings = async (): Promise<AppPluginSettings> => {
  const response = getBackendSrv().fetch({
    url: `/api/plugins/ricoberger-backstage-app/settings`,
    method: 'GET',
  });
  const result = await lastValueFrom(response);

  return (result.data as { jsonData: AppPluginSettings }).jsonData;
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
    entity?: Entity;
    owner?: Entity;
    system?: Entity;
  }> => {
    const settings = await getSettings();

    const entityRef = formatEntityRef(
      replaceVariables(options.entity),
      'component',
    );
    const entity = await getEntity(entityRef);

    let ownerRef = entity?.spec.owner
      ? formatEntityRef(entity.spec.owner, 'group')
      : undefined;
    let systemRef = entity?.spec.system
      ? formatEntityRef(entity.spec.system, 'system')
      : undefined;
    const owner = ownerRef ? await getEntity(ownerRef) : undefined;
    const system = systemRef ? await getEntity(systemRef) : undefined;

    return { settings, entity, owner, system };
  }, [options.entity]);

  const renderLink = (
    settings: AppPluginSettings,
    entityKind: 'group' | 'system',
    entityRef: string,
    entity?: Entity,
  ): ReactNode => {
    if (!entity) {
      const kind =
        entityKind === 'system'
          ? 'system'
          : entityRef.startsWith('user:')
            ? 'user'
            : 'group';

      return (
        <Stack direction="row" alignItems="center" gap={1}>
          <Icons icon={kind} size={14} />
          <span>{entityRef}</span>
        </Stack>
      );
    }

    const link = getLink(entity, settings.dashboards);
    if (link) {
      return (
        <TextLink href={link}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Icons icon={entity.kind} size={14} />
            <span>{entity.metadata.name}</span>
          </Stack>
        </TextLink>
      );
    }

    return (
      <Stack direction="row" alignItems="center" gap={1}>
        <Icons icon={entity.kind} size={14} />
        <span>{entity.metadata.name}</span>
      </Stack>
    );
  };

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
      <Alert severity="error" title="Failed to load entity">
        {state.error.message}
      </Alert>
    );
  }

  if (!state.value?.entity) {
    return (
      <Alert severity="error" title="Failed to load entity">
        Entity not found
      </Alert>
    );
  }

  return (
    <ScrollContainer maxWidth={width} height={height}>
      <Stack direction="column" gap={4}>
        {state.value?.entity.metadata.description && (
          <Stack direction="column" gap={0}>
            <Text weight="bold">Description</Text>
            <div>{state.value?.entity.metadata.description}</div>
          </Stack>
        )}
        <Stack direction="row" wrap="wrap" gap={4}>
          {state.value?.entity.spec.owner && (
            <Stack direction="column" gap={0}>
              <Text weight="bold">Owner</Text>
              {renderLink(
                state.value.settings,
                'group',
                state.value?.entity.spec.owner,
                state.value.owner,
              )}
            </Stack>
          )}
          {state.value?.entity.spec.system && (
            <Stack direction="column" gap={0}>
              <Text weight="bold">System</Text>
              {renderLink(
                state.value.settings,
                'system',
                state.value?.entity.spec.system,
                state.value.system,
              )}
            </Stack>
          )}
          {state.value?.entity.spec.type && (
            <Stack direction="column" gap={0}>
              <Text weight="bold">Type</Text>
              <div>{state.value?.entity.spec.type}</div>
            </Stack>
          )}
          {state.value?.entity.spec.lifecycle && (
            <Stack direction="column" gap={0}>
              <Text weight="bold">Lifecycle</Text>
              <div>{state.value?.entity.spec.lifecycle}</div>
            </Stack>
          )}
          {state.value?.entity.metadata.tags && (
            <Stack direction="column" gap={0}>
              <Text weight="bold">Tags</Text>
              <Stack direction="row" gap={1} wrap={true}>
                {state.value.entity.metadata.tags?.map((tag: string) => (
                  <Badge key={tag} color="darkgrey" text={tag} />
                ))}
              </Stack>
            </Stack>
          )}
        </Stack>
      </Stack>
    </ScrollContainer>
  );
};
