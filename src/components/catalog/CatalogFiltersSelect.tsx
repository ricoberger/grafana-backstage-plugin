import React from 'react';
import {
  Combobox,
  ComboboxOption,
  Label,
  MultiCombobox,
  Stack,
} from '@grafana/ui';
import { getBackendSrv } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';
import { useAsync } from 'react-use';

interface Pops<T> {
  label: string;
  kind?: string;
  facet: string;
  multiple: boolean;
  value?: T;
  setValue: (value: T) => void;
}

export function CatalogFiltersSelect<T>({
  label,
  kind,
  facet,
  multiple,
  value,
  setValue,
}: Pops<T>) {
  const state = useAsync(async (): Promise<ComboboxOption[]> => {
    const filterParams = [];
    if (kind) {
      filterParams.push(`kind=${kind}`);
    }

    const response = getBackendSrv().fetch({
      url: `/api/plugins/ricoberger-backstage-app/resources/catalog/entity-facets?facet=${facet}&filter=${filterParams.join(',')}`,
      method: 'GET',
    });
    const result = await lastValueFrom(response);
    return (result.data as string[]).map((value) => ({ value: value }));
  }, [facet, kind]);

  // eslint-disable-next-line @typescript-eslint/array-type
  const onMultiChange = (option: ComboboxOption<string>[]) => {
    setValue(Array.from(option.values()).map((value) => value.value) as T);
  };

  const onSingleChange = (option: ComboboxOption<string> | null) => {
    setValue(!option ? ('' as T) : (option.value as T));
  };

  return (
    <Stack direction="column" gap={0}>
      <Label>{label}</Label>
      {multiple ? (
        <MultiCombobox
          width="auto"
          minWidth={32}
          maxWidth={32}
          isClearable={true}
          value={value as string[]}
          options={state.value || []}
          onChange={onMultiChange}
        />
      ) : (
        <Combobox<string>
          isClearable={true}
          value={value as string}
          options={state.value || []}
          onChange={onSingleChange}
        />
      )}
    </Stack>
  );
}
