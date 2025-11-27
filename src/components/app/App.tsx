import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';

import { ROUTES } from '../../constants';
import { AppPluginSettings } from '../../types/settings';
const PageCatalog = React.lazy(() => import('../../pages/PageCatalog'));

function App({ }: AppRootProps<AppPluginSettings>) {
  return (
    <Routes>
      <Route path={ROUTES.Catalog} element={<PageCatalog />} />
      <Route path="*" element={<PageCatalog />} />
    </Routes>
  );
}

export default App;
