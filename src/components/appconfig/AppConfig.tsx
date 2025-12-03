import React, { ChangeEvent, FormEvent, useState } from 'react';
import { lastValueFrom } from 'rxjs';
import { css } from '@emotion/css';
import {
  AppPluginMeta,
  GrafanaTheme2,
  PluginConfigPageProps,
  PluginMeta,
} from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import {
  Button,
  FieldSet,
  InlineField,
  Input,
  SecretInput,
  useStyles2,
} from '@grafana/ui';

import { testIds } from '../testIds';
import { AppPluginSettings } from '../../types/settings';
import { AppConfigDashboards } from './AppConfigDashboards';

export interface AppConfigProps
  extends PluginConfigPageProps<AppPluginMeta<AppPluginSettings>> { }

const AppConfig = ({
  plugin: {
    meta: { id, enabled, pinned, jsonData, secureJsonFields },
  },
}: AppConfigProps) => {
  const styles = useStyles2((theme: GrafanaTheme2) => ({
    marginTop: css`
      margin-top: ${theme.spacing(3)};
    `,
  }));

  const [state, setState] = useState<{
    url: string;
    isApiKeySet: boolean;
    apiKey: string;
    dashboards: Array<[string, string]>;
  }>({
    url: jsonData?.url || '',
    apiKey: '',
    isApiKeySet: Boolean(secureJsonFields?.apiKey),
    dashboards: jsonData?.dashboards || [],
  });

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!state.url) {
      return;
    }

    await updatePluginAndReload(id, {
      enabled,
      pinned,
      jsonData: {
        url: state.url,
        dashboards: state.dashboards,
      },
      secureJsonData: state.isApiKeySet
        ? undefined
        : {
          apiKey: state.apiKey,
        },
    });
  };

  return (
    <form onSubmit={onSubmit}>
      <FieldSet label="General">
        <InlineField label="Url" labelWidth={10}>
          <Input
            width={40}
            name="url"
            id="config-url"
            data-testid={testIds.appConfig.url}
            value={state.url}
            placeholder="https://demo.backstage.io"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setState({
                ...state,
                url: event.target.value.trim(),
              });
            }}
          />
        </InlineField>

        <InlineField label="API Key" labelWidth={10}>
          <SecretInput
            width={40}
            id="config-api-key"
            data-testid={testIds.appConfig.apiKey}
            name="apiKey"
            value={state.apiKey}
            isConfigured={state.isApiKeySet}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setState({
                ...state,
                apiKey: event.target.value.trim(),
              });
            }}
            onReset={() =>
              setState({
                ...state,
                apiKey: '',
                isApiKeySet: false,
              })
            }
          />
        </InlineField>
      </FieldSet>

      <AppConfigDashboards
        dashboards={state.dashboards}
        onChange={(dashboards) =>
          setState({ ...state, dashboards: dashboards })
        }
      />

      <div className={styles.marginTop}>
        <Button
          type="submit"
          data-testid={testIds.appConfig.submit}
          disabled={!state.url}
        >
          Save
        </Button>
      </div>
    </form>
  );
};

export default AppConfig;

const updatePluginAndReload = async (
  pluginId: string,
  data: Partial<PluginMeta<AppPluginSettings>>,
) => {
  try {
    await updatePlugin(pluginId, data);

    /**
     * Reloading the page as the changes made here wouldn't be propagated to the
     * actual plugin otherwise. This is not ideal, however unfortunately
     * currently there is no supported way for updating the plugin state.
     */
    window.location.reload();
  } catch (e) {
    console.error('Error while updating the plugin', e);
  }
};

const updatePlugin = async (pluginId: string, data: Partial<PluginMeta>) => {
  const response = await getBackendSrv().fetch({
    url: `/api/plugins/${pluginId}/settings`,
    method: 'POST',
    data,
  });

  return lastValueFrom(response);
};
