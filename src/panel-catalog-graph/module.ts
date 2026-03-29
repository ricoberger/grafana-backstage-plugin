import { PanelPlugin } from '@grafana/data';

import { Panel } from './components/Panel';
import { Options } from './types';

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
