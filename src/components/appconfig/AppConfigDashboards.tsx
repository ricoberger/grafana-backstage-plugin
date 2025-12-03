import React from 'react';

import {
  FieldSet,
  IconButton,
  InlineField,
  InlineFieldRow,
  Input,
} from '@grafana/ui';

interface Props {
  dashboards: Array<[string, string]>;
  onChange: (dashboards: Array<[string, string]>) => void;
}

export function AppConfigDashboards({ dashboards, onChange }: Props) {
  return (
    <FieldSet label="Dashboards">
      <IconButton
        name="plus"
        aria-label="Add dashboard"
        onClick={(e) => {
          e.preventDefault();
          onChange([...dashboards, ['', '']]);
        }}
      />

      {dashboards.map((dashboard, index) => (
        <InlineFieldRow key={index}>
          <InlineField label="Kind" labelWidth={10}>
            <Input
              width={40}
              name="kind"
              placeholder="Component"
              value={dashboard[0]}
              onChange={(e) => {
                const newDashboards = [...dashboards];
                newDashboards[index] = [
                  e.currentTarget.value,
                  dashboards[index][1],
                ];
                onChange(newDashboards);
              }}
            />
          </InlineField>
          <InlineField label="Dashboard" labelWidth={10}>
            <Input
              width={40}
              name="dashboard"
              placeholder="component?var-name={{ $.metadata.name }}"
              value={dashboard[1]}
              onChange={(e) => {
                const newDashboards = [...dashboards];
                newDashboards[index] = [
                  dashboards[index][0],
                  e.currentTarget.value,
                ];
                onChange(newDashboards);
              }}
            />
          </InlineField>
          <IconButton
            name="trash-alt"
            aria-label="Remove dashboard"
            onClick={(e) => {
              e.preventDefault();
              const newDashboards = [...dashboards];
              newDashboards.splice(index, 1);
              onChange(newDashboards);
            }}
          />
        </InlineFieldRow>
      ))}
    </FieldSet>
  );
}
