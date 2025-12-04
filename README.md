# Grafana Backstage Plugin

The Grafana Backstage Plugin allows you to explore your Backstage service
catalog within Grafana. The plugin also provides a way to link your service
catalog entries to your Grafana dashboards.

![Catalog](https://raw.githubusercontent.com/ricoberger/grafana-backstage-plugin/refs/heads/main/src/img/screenshots/catalog.png)

## Features

- Explore your Backstage service catalog within Grafana
- View the graph of your Backstage service catalog entities
- Link your Backstage service catalog entries to your Grafana dashboards
  - Define default dashboards for entity kinds via the configuration
  - Link dashboards via the `grafana.com/dashboard` annotation

## Installation

1. Before you can install the plugin, you have to add `ricoberger-backstage-app`
   and `ricoberger-backstagecataloggraph-panel` to the
   [`allow_loading_unsigned_plugins`](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#allow_loading_unsigned_plugins)
   configuration option or to the `GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS`
   environment variable.
2. The plugin can then be installed by adding
   `ricoberger-backstage-app@<VERSION>@https://github.com/ricoberger/grafana-backstage-plugin/releases/download/v<VERSION>/ricoberger-backstage-app-<VERSION>.zip`
   to the
   [`preinstall_sync`](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#preinstall_sync)
   configuration option or the `GF_PLUGINS_PREINSTALL_SYNC` environment
   variable.
3. Once the plugin is installed, you have to activate the app in you Grafana
   instance by navigating to **Administration** -> **Plugins and data** ->
   **Plugins** -> **Backstage** and clicking on the **Enable** button
   (`<GRAFANA-INSTANCE-URL>/plugins/ricoberger-backstage-app`).

### Configuration File

```ini
[plugins]
allow_loading_unsigned_plugins = ricoberger-backstage-app,ricoberger-backstagecataloggraph-panel
preinstall_sync = ricoberger-backstage-app@0.1.0@https://github.com/ricoberger/grafana-backstage-plugin/releases/download/v0.1.0/ricoberger-backstage-app-0.1.0.zip
```

### Environment Variables

```bash
export GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=ricoberger-backstage-app,ricoberger-backstagecataloggraph-panel
export GF_PLUGINS_PREINSTALL_SYNC=ricoberger-backstage-app@0.1.0@https://github.com/ricoberger/grafana-backstage-plugin/releases/download/v0.1.0/ricoberger-backstage-app-0.1.0.zip
```

## Configuration

The configuration allows you to define the Backstage url, the API key and the
default dashboards for your Backstage entity kinds.

![Configuration](https://raw.githubusercontent.com/ricoberger/grafana-backstage-plugin/refs/heads/main/src/img/screenshots/configuration.png)

In the **General** section you have to set the Backstage url and the API key,
which can be used by the plugin to access the Backstage API.

In the **Dashboards** section you can define default dashboards for your
Backstage entity kinds. The plugin will use these dashboards when no dashboard
is defined via the `grafana.com/dashboard` annotation.

- **Kind**: The Backstage entity kind (e.g. `Component`, `API`, `System`, etc.)
- **Dashboard**: The link to the Grafana dashboard (e.g.
  `component?var-name={{ $.metadata.name }}&var-namespace={{ $.metadata.namespace }}&var-description={{ $.metadata.description }}&var-owner={{ $.spec.owner }}&var-system={{ $.spec.system }}&var-type={{ $.spec.type }}&var-lifecycle={{ $.spec.lifecycle }}&var-tags={{ $.metadata.tags }}`).
  The dashboard link uses the following format:
  `<DASHBOARD-UID>/?<VARIABLE-AS-QUERY-PARAMETERS>`. The variables can reference
  properties of the Backstage entity using
  [JSONPath](https://www.npmjs.com/package/jsonpath-plus) syntax.
- **Annotation**: Instead of using the default dashboard defined for the entity
  kind, you can also define the dashboard via the `grafana.com/dashboard`
  annotation on the Backstage entity.

## Contributing

If you want to contribute to the project, please read through the
[contribution guideline](https://github.com/ricoberger/grafana-backstage-plugin/blob/main/CONTRIBUTING.md).
Please also follow our
[code of conduct](https://github.com/ricoberger/grafana-backstage-plugin/blob/main/CODE_OF_CONDUCT.md)
in all your interactions with the project.
