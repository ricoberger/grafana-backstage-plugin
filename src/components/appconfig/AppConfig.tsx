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
  Field,
  FieldSet,
  Input,
  SecretInput,
  useStyles2,
} from '@grafana/ui';

import { testIds } from '../testIds';
import { AppPluginSettings } from '../../types/settings';

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
    apiUrl: string;
    isApiKeySet: boolean;
    apiKey: string;
  }>({
    apiUrl: jsonData?.apiUrl || '',
    apiKey: '',
    isApiKeySet: Boolean(secureJsonFields?.apiKey),
  });

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!state.apiUrl) {
      return;
    }

    await updatePluginAndReload(id, {
      enabled,
      pinned,
      jsonData: {
        apiUrl: state.apiUrl,
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
      <FieldSet label="Settings">
        <Field label="API Url">
          <Input
            width={60}
            name="apiUrl"
            id="config-api-url"
            data-testid={testIds.appConfig.apiUrl}
            value={state.apiUrl}
            placeholder="https://demo.backstage.io"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setState({
                ...state,
                apiUrl: event.target.value.trim(),
              });
            }}
          />
        </Field>
        <Field label="API Key" className={styles.marginTop}>
          <SecretInput
            width={60}
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
        </Field>
        <div className={styles.marginTop}>
          <Button
            type="submit"
            data-testid={testIds.appConfig.submit}
            disabled={!state.apiUrl}
          >
            Save settings
          </Button>
        </div>
      </FieldSet>
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
