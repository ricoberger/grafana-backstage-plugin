import { PanelPlugin } from '@grafana/data';

import { Options } from './types';
import { Panel } from './components/Panel';

export const plugin = new PanelPlugin<Options>(Panel).setPanelOptions(
  (builder) => {
    return builder.addTextInput({
      path: 'entity',
      name: 'Entity',
      description: 'Entity reference in the form "kind:namespace/name"',
      defaultValue: '',
    });
  },
);
