import { AppPlugin, type AppRootProps } from '@grafana/data';
import { LoadingPlaceholder } from '@grafana/ui';
import React, { Suspense, lazy } from 'react';

import type { AppConfigProps } from './components/appconfig/AppConfig';
const LazyApp = lazy(() => import('./components/app/App'));
const LazyAppConfig = lazy(() => import('./components/appconfig/AppConfig'));

function App(props: AppRootProps) {
  return (
    <Suspense fallback={<LoadingPlaceholder text="" />}>
      <LazyApp {...props} />
    </Suspense>
  );
}

function AppConfig(props: AppConfigProps) {
  return (
    <Suspense fallback={<LoadingPlaceholder text="" />}>
      <LazyAppConfig {...props} />
    </Suspense>
  );
}

export const plugin = new AppPlugin<{}>().setRootPage(App).addConfigPage({
  title: 'Configuration',
  icon: 'cog',
  body: AppConfig,
  id: 'configuration',
});
