package main

import (
	"os"

	"github.com/ricoberger/grafana-backstage-plugin/pkg/models"
	"github.com/ricoberger/grafana-backstage-plugin/pkg/plugin"

	"github.com/grafana/grafana-plugin-sdk-go/backend/app"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/backend/tracing"
	"go.opentelemetry.io/otel/attribute"
)

func main() {
	// Start listening to requests sent from Grafana. This call is blocking so
	// it won't finish until Grafana shuts down the process or the plugin choose
	// to exit by itself using os.Exit. Manage automatically manages life cycle
	// of app instances. It accepts app instance factory as first
	// argument. This factory will be automatically called on incoming request
	// from Grafana to create different instances of `App` (per plugin
	// ID).
	if err := app.Manage("ricoberger-backstage-app", plugin.NewApp, app.ManageOpts{
		TracingOpts: tracing.Opts{
			CustomAttributes: []attribute.KeyValue{
				attribute.String("plugin_id", models.PluginID),
			},
		},
	}); err != nil {
		log.DefaultLogger.Error(err.Error())
		os.Exit(1)
	}
}
