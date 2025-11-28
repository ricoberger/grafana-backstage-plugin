import React from 'react';
import { getBackendSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';
import {
  InteractiveTable,
  Badge,
  Stack,
  LoadingPlaceholder,
  LinkButton,
  TextLink,
  Alert,
} from '@grafana/ui';
import { usePluginContext } from '@grafana/data';
import { useAsync } from 'react-use';

import {
  Filters,
  EntitiesResult,
  Entity,
  EntitiesTable,
} from '../../types/backstage';
import { AppPluginSettings } from '../../types/settings';
import { interpolateJSONPath } from '../../utils/utils.interpolate';

interface Props {
  filters: Filters;
}

export function CatalogTable({ filters }: Props) {
  const settings = usePluginContext<AppPluginSettings>();

  const state = useAsync(async (): Promise<EntitiesTable> => {
    let cursor = '';
    const tmpEntities: Entity[] = [];

    const filterParams = [`kind=${filters.kind}`];
    if (filters.type) {
      filterParams.push(`spec.type=${filters.type}`);
    }
    if (filters.namespace && filters.namespace.length > 0) {
      filterParams.push(
        filters.namespace
          .map((namespace) => `metadata.namespace=${namespace}`)
          .join(','),
      );
    }
    if (filters.lifecycle && filters.lifecycle.length > 0) {
      filterParams.push(
        filters.lifecycle
          .map((lifecycle) => `spec.lifecycle=${lifecycle}`)
          .join(','),
      );
    }
    if (filters.tag && filters.tag.length > 0) {
      filterParams.push(
        filters.tag.map((tag) => `metadata.tags=${tag}`).join(','),
      );
    }
    if (filters.owner && filters.owner.length > 0) {
      filterParams.push(
        filters.owner.map((owner) => `relations.ownedBy=${owner}`).join(','),
      );
    }

    while (true) {
      const response = getBackendSrv().fetch({
        url: `/api/plugins/ricoberger-backstage-app/resources/catalog/entities/by-query?filter=${filterParams.join(',')}${cursor ? `&cursor=${cursor}` : ''}`,
        method: 'GET',
      });
      const result = await lastValueFrom(response);
      const data = result.data as EntitiesResult;
      tmpEntities.push(...(data.items as Entity[]));

      if (data.pageInfo?.nextCursor) {
        cursor = data.pageInfo.nextCursor;
      } else {
        break;
      }
    }
    return convertEntitiesToTableData(
      settings?.meta.jsonData?.url || '',
      settings?.meta.jsonData?.dashboards,
      filters.kind || '',
      tmpEntities.filter((entity) =>
        entity.metadata.name?.includes(filters.filter || ''),
      ),
    );
  }, [filters]);

  return (
    <div>
      {state.loading ? (
        <LoadingPlaceholder text="Loading..." />
      ) : state.error ? (
        <Alert severity="error" title={`Failed to load ${filters.kind}`}>
          {state.error.message}
        </Alert>
      ) : state.value && state.value.data && state.value.data.length > 0 ? (
        <InteractiveTable
          columns={state.value.columns}
          data={state.value.data}
          getRowId={(r) => r.id}
          pageSize={20}
        />
      ) : null}
    </div>
  );
}

function convertEntitiesToTableData(
  backstageUrl: string,
  dashboards: Array<[string, string]> | undefined,
  kind: string,
  entities: Entity[],
): EntitiesTable {
  if (kind === 'API') {
    return {
      columns: [
        { id: 'name', header: 'Name', cell: NameCell },
        { id: 'system', header: 'System', cell: SystemCell },
        { id: 'owner', header: 'Owner', cell: OwnerCell },
        { id: 'type', header: 'Type', cell: TypeCell },
        { id: 'lifecycle', header: 'Lifecycle', cell: LifecycleCell },
        { id: 'description', header: 'Description', cell: DescriptionCell },
        { id: 'tags', header: 'Tags', cell: TagsCell },
        { id: 'backstage', header: '', cell: BackstageCell },
      ],
      data: entities.map((entity) => ({
        id: entity.metadata.uid,
        backstageUrl: backstageUrl,
        dashboards: dashboards,
        entity: entity,
      })),
    };
  }

  if (kind === 'Component') {
    return {
      columns: [
        { id: 'name', header: 'Name', cell: NameCell },
        { id: 'system', header: 'System', cell: SystemCell },
        { id: 'owner', header: 'Owner', cell: OwnerCell },
        { id: 'type', header: 'Type', cell: TypeCell },
        { id: 'lifecycle', header: 'Lifecycle', cell: LifecycleCell },
        { id: 'description', header: 'Description', cell: DescriptionCell },
        { id: 'tags', header: 'Tags', cell: TagsCell },
        { id: 'backstage', header: '', cell: BackstageCell },
      ],
      data: entities.map((entity) => ({
        id: entity.metadata.uid,
        backstageUrl: backstageUrl,
        dashboards: dashboards,
        entity: entity,
      })),
    };
  }

  if (kind === 'Domain') {
    return {
      columns: [
        { id: 'name', header: 'Name', cell: NameCell },
        { id: 'owner', header: 'Owner', cell: OwnerCell },
        { id: 'description', header: 'Description', cell: DescriptionCell },
        { id: 'tags', header: 'Tags', cell: TagsCell },
        { id: 'backstage', header: '', cell: BackstageCell },
      ],
      data: entities.map((entity) => ({
        id: entity.metadata.uid,
        backstageUrl: backstageUrl,
        dashboards: dashboards,
        entity: entity,
      })),
    };
  }

  if (kind === 'Group') {
    return {
      columns: [
        { id: 'name', header: 'Name', cell: NameCell },
        { id: 'type', header: 'Type', cell: TypeCell },
        { id: 'description', header: 'Description', cell: DescriptionCell },
        { id: 'tags', header: 'Tags', cell: TagsCell },
        { id: 'backstage', header: '', cell: BackstageCell },
      ],
      data: entities.map((entity) => ({
        id: entity.metadata.uid,
        backstageUrl: backstageUrl,
        dashboards: dashboards,
        entity: entity,
      })),
    };
  }

  if (kind === 'Location') {
    return {
      columns: [
        { id: 'name', header: 'Name', cell: NameCell },
        { id: 'type', header: 'Type', cell: TypeCell },
        { id: 'target', header: 'Targets', cell: TargetCell },
        { id: 'backstage', header: '', cell: BackstageCell },
      ],
      data: entities.map((entity) => ({
        id: entity.metadata.uid,
        backstageUrl: backstageUrl,
        dashboards: dashboards,
        entity: entity,
      })),
    };
  }

  if (kind === 'Resource') {
    return {
      columns: [
        { id: 'name', header: 'Name', cell: NameCell },
        { id: 'system', header: 'System', cell: SystemCell },
        { id: 'owner', header: 'Owner', cell: OwnerCell },
        { id: 'type', header: 'Type', cell: TypeCell },
        { id: 'lifecycle', header: 'Lifecycle', cell: LifecycleCell },
        { id: 'description', header: 'Description', cell: DescriptionCell },
        { id: 'tags', header: 'Tags', cell: TagsCell },
        { id: 'backstage', header: '', cell: BackstageCell },
      ],
      data: entities.map((entity) => ({
        id: entity.metadata.uid,
        backstageUrl: backstageUrl,
        dashboards: dashboards,
        entity: entity,
      })),
    };
  }

  if (kind === 'System') {
    return {
      columns: [
        { id: 'name', header: 'Name', cell: NameCell },
        { id: 'owner', header: 'Owner', cell: OwnerCell },
        { id: 'description', header: 'Description', cell: DescriptionCell },
        { id: 'tags', header: 'Tags', cell: TagsCell },
        { id: 'backstage', header: '', cell: BackstageCell },
      ],
      data: entities.map((entity) => ({
        id: entity.metadata.uid,
        backstageUrl: backstageUrl,
        dashboards: dashboards,
        entity: entity,
      })),
    };
  }

  if (kind === 'User') {
    return {
      columns: [
        { id: 'name', header: 'Name', cell: NameCell },
        { id: 'description', header: 'Description', cell: DescriptionCell },
        { id: 'tags', header: 'Tags', cell: TagsCell },
        { id: 'backstage', header: '', cell: BackstageCell },
      ],
      data: entities.map((entity) => ({
        id: entity.metadata.uid,
        backstageUrl: backstageUrl,
        dashboards: dashboards,
        entity: entity,
      })),
    };
  }

  return {
    columns: [
      { id: 'name', header: 'Name', cell: NameCell },
      { id: 'owner', header: 'Owner', cell: OwnerCell },
      { id: 'description', header: 'Description', cell: DescriptionCell },
      { id: 'tags', header: 'Tags', cell: TagsCell },
      { id: 'backstage', header: '', cell: BackstageCell },
    ],
    data: entities.map((entity) => ({
      id: entity.metadata.uid,
      backstageUrl: backstageUrl,
      dashboards: dashboards,
      entity: entity,
    })),
  };
}

const NameCell = (props: any) => {
  const entity = props.row.original.entity as Entity;

  if (
    entity.metadata.annotations &&
    entity.metadata.annotations['grafana.com/dashboard']
  ) {
    const link = interpolateJSONPath(
      entity.metadata.annotations['grafana.com/dashboard'],
      entity,
    );
    if (link) {
      return <TextLink href={`/d/${link}`}>{entity.metadata.name}</TextLink>;
    }
  }

  const dashboards = props.row.original.dashboards.filter(
    (dashboard: [string, string]) => dashboard[0] === entity.kind,
  );
  if (dashboards && dashboards.length === 1) {
    const link = interpolateJSONPath(dashboards[0][1], entity);
    if (link) {
      return <TextLink href={`/d/${link}`}>{entity.metadata.name}</TextLink>;
    }
  }

  return <span>{entity.metadata.name}</span>;
};

const SystemCell = (props: any) => {
  const entity = props.row.original.entity as Entity;
  return <span>{entity.spec.system}</span>;
};

const OwnerCell = (props: any) => {
  const entity = props.row.original.entity as Entity;
  return <span>{entity.spec.owner}</span>;
};

const TypeCell = (props: any) => {
  const entity = props.row.original.entity as Entity;
  return <span>{entity.spec.type}</span>;
};

const LifecycleCell = (props: any) => {
  const entity = props.row.original.entity as Entity;
  return <span>{entity.spec.lifecycle}</span>;
};

const DescriptionCell = (props: any) => {
  const entity = props.row.original.entity as Entity;
  return <span>{entity.metadata.description}</span>;
};

const TagsCell = (props: any) => {
  const entity = props.row.original.entity as Entity;
  return (
    <Stack direction="row" gap={1} wrap={true}>
      {entity.metadata.tags?.map((tag: string) => (
        <Badge key={tag} color="darkgrey" text={tag} />
      ))}
    </Stack>
  );
};

const TargetCell = (props: any) => {
  const entity = props.row.original.entity as Entity;
  return (
    <span>
      {entity.spec.targets
        ? entity.spec.targets.join(', ')
        : entity.spec.target}
    </span>
  );
};

const BackstageCell = (props: any) => {
  const entity = props.row.original.entity as Entity;
  return (
    <span>
      <LinkButton
        variant="secondary"
        icon="external-link-alt"
        size="sm"
        href={`${props.row.original.backstageUrl}/catalog/${entity.metadata.namespace}/${entity.kind.toLowerCase()}/${entity.metadata.name}`}
        target="_blank"
      >
        Backstage
      </LinkButton>
    </span>
  );
};
