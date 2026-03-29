import { PanelPlugin } from '@grafana/data';

import { Panel } from './components/Panel';
import { Options } from './types';

export const plugin = new PanelPlugin<Options>(Panel).setPanelOptions(
  (builder) => {
    return builder.addTextInput({
      path: 'owner',
      name: 'Owner',
      description:
        'Owner of the entities which should be displayed "kind:namespace/name"',
      defaultValue: '',
    });
  },
);
