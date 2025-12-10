import React, { ReactNode } from 'react';
import { PanelProps } from '@grafana/data';
import { useAsync } from 'react-use';
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
import { Entity } from '../../types/backstage';
import { Icons } from '../../components/icons/Icons';
import { AppPluginSettings } from '../../types/settings';
import {
  formatEntityRef,
  getEntityByRef,
  getLink,
  getSettings,
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
    entity?: Entity;
    owner?: Entity;
    system?: Entity;
  }> => {
    const settings = await getSettings();

    const entityRef = formatEntityRef(
      replaceVariables(options.entity),
      'component',
    );
    const entity = await getEntityByRef(entityRef);

    let ownerRef = entity?.spec.owner
      ? formatEntityRef(entity.spec.owner, 'group')
      : undefined;
    let systemRef = entity?.spec.system
      ? formatEntityRef(entity.spec.system, 'system')
      : undefined;
    const owner = ownerRef ? await getEntityByRef(ownerRef) : undefined;
    const system = systemRef ? await getEntityByRef(systemRef) : undefined;

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
