import React, { ChangeEvent } from 'react';
import { Input, Label, Stack } from '@grafana/ui';

import { Filters } from '../../types/backstage';
import { CatalogFiltersSelect } from './CatalogFiltersSelect';

interface Props {
  filters: Filters;
  setFilters: (filters: Filters) => void;
}

export function CatalogFilters({ filters, setFilters }: Props) {
  return (
    <Stack direction="column" gap={2}>
      <CatalogFiltersSelect<string>
        label="Kind"
        facet="kind"
        multiple={false}
        value={filters.kind}
        setValue={(value) => setFilters({ ...filters, kind: value })}
      />
      <Stack direction="column" gap={0}>
        <Label>Filter</Label>
        <Input
          value={filters.filter}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setFilters({ ...filters, filter: event.target.value })
          }
        />
      </Stack>
      {(filters.kind === 'API' ||
        filters.kind === 'Component' ||
        filters.kind === 'Group' ||
        filters.kind === 'Resource') && (
          <CatalogFiltersSelect<string>
            label="Type"
            kind={filters.kind}
            facet="spec.type"
            multiple={false}
            value={filters.type}
            setValue={(value) => setFilters({ ...filters, type: value })}
          />
        )}
      {(filters.kind === 'API' ||
        filters.kind === 'Component' ||
        filters.kind === 'Domain' ||
        filters.kind === 'Resource' ||
        filters.kind === 'System') && (
          <CatalogFiltersSelect<string[]>
            label="Owner"
            kind={filters.kind}
            facet="relations.ownedBy"
            multiple={true}
            value={filters.owner}
            setValue={(value) => setFilters({ ...filters, owner: value })}
          />
        )}
      {(filters.kind === 'API' ||
        filters.kind === 'Component' ||
        filters.kind === 'Domain' ||
        filters.kind === 'Resource' ||
        filters.kind === 'System') && (
          <CatalogFiltersSelect<string[]>
            label="Lifecycle"
            kind={filters.kind}
            facet="spec.lifecycle"
            multiple={true}
            value={filters.lifecycle}
            setValue={(value) => setFilters({ ...filters, lifecycle: value })}
          />
        )}
      <CatalogFiltersSelect<string[]>
        label="Tags"
        kind={filters.kind}
        facet="metadata.tags"
        multiple={true}
        value={filters.tag}
        setValue={(value) => setFilters({ ...filters, tag: value })}
      />
      <CatalogFiltersSelect<string[]>
        label="Namespace"
        kind={filters.kind}
        facet="metadata.namespace"
        multiple={true}
        value={filters.namespace}
        setValue={(value) => setFilters({ ...filters, namespace: value })}
      />
    </Stack>
  );
}
