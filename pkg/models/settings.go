package models

// The PlguinID is the id of the plugin and must be the same as in the
// plugin.json file.
const PluginID = "ricoberger-backstage-app"

// PluginSettings holds the settings for the Kubernetes datasource plugin, which
// can be configured in the Grafana UI.
type PluginSettings struct {
	ApiUrl string `json:"apiUrl"`
}
