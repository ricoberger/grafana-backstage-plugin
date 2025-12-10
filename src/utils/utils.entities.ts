import { getBackendSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';

import { Entity, EntitiesResult } from '../types/backstage';
import { AppPluginSettings } from '../types/settings';
import { interpolateJSONPath } from './utils.interpolate';

/**
 * Formats an entity reference string to ensure that the reference can be used
 * to query the backstage API.
 */
export const formatEntityRef = (
  entityRef: string,
  defaultKind: string,
): string => {
  const refParts = entityRef.split(':');
  if (refParts.length === 2) {
    const kind = refParts[0].toLowerCase();
    const namespaceName = refParts[1].split('/');

    if (namespaceName.length === 2) {
      return `${kind}:${namespaceName[0]}/${namespaceName[1]}`;
    } else {
      return `${kind}:default/${namespaceName[0]}`;
    }
  } else if (refParts.length === 1) {
    const namespaceName = refParts[0].split('/');
    if (namespaceName.length === 2) {
      return `${defaultKind.toLowerCase()}:${namespaceName[0]}/${namespaceName[1]}`;
    } else {
      return `${defaultKind.toLowerCase()}:default/${namespaceName[0]}`;
    }
  } else {
    return entityRef;
  }
};

/**
 * Fetches an entity from the Backstage catalog by its reference.
 */
export const getEntityByRef = async (
  entityRef: string,
): Promise<Entity | undefined> => {
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

/**
 * Fetches multiple entities from the Backstage catalog by their references.
 */
export const getEntitesByRefs = async (
  entityRefs: string[],
): Promise<Entity[]> => {
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

/**
 * Fetches the Backstage app plugin settings.
 */
export const getSettings = async (): Promise<AppPluginSettings> => {
  const response = getBackendSrv().fetch({
    url: `/api/plugins/ricoberger-backstage-app/settings`,
    method: 'GET',
  });
  const result = await lastValueFrom(response);

  return (result.data as { jsonData: AppPluginSettings }).jsonData;
};

/**
 * Fetches the currently logged-in user and returns the Backstage reference for
 * the user.
 */
export const getUserRef = async (): Promise<string> => {
  const response = getBackendSrv().fetch({
    url: `/api/user`,
    method: 'GET',
  });
  const result = await lastValueFrom(response);

  return `user:default/${(result.data as { login: string }).login}`;
};

/**
 * Return the link to the Grafana dashboard for the given entity, if available.
 */
export const getLink = (
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
