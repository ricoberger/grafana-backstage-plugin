import React, { useState } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Box, Card, useStyles2 } from '@grafana/ui';
import { PluginPage } from '@grafana/runtime';

import { Filters } from '../types/backstage';
import { testIds } from '../components/testIds';
import { CatalogFilters } from '../components/catalog/CatalogFilters';
import { CatalogTable } from '../components/catalog/CatalogTable';

function PageCatalog() {
  const styles = useStyles2((theme: GrafanaTheme2) => ({
    marginTop: css`
      margin-top: ${theme.spacing(2)};
    `,
  }));

  const [filters, setFilters] = useState<Filters>({
    kind: 'Component',
    namespace: [],
    filter: '',
    type: '',
    lifecycle: [],
    tag: [],
    owner: [],
  });

  return (
    <PluginPage>
      <div data-testid={testIds.pageCatalog.container}>
        <div className={styles.marginTop}>
          <Box display="flex" grow={1} gap={4}>
            <Box width="272px">
              <Card isCompact={true}>
                <CatalogFilters filters={filters} setFilters={setFilters} />
              </Card>
            </Box>
            <Box grow={1}>
              <Card isCompact={true}>
                <CatalogTable filters={filters} />
              </Card>
            </Box>
          </Box>
        </div>
      </div>
    </PluginPage>
  );
}

export default PageCatalog;
