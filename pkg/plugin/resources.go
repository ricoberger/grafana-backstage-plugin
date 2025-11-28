package plugin

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"

	"github.com/ricoberger/grafana-backstage-plugin/pkg/models"

	"github.com/grafana/grafana-plugin-sdk-go/backend/tracing"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
)

// registerRoutes takes a *http.ServeMux and registers some HTTP handlers.
func (a *App) registerRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/catalog/entity-facets", a.handleCatalogEntityFacets)
	mux.HandleFunc("/catalog/entities/by-query", a.handleCatalogEntitiesByQuery)
}

func (a *App) handleCatalogEntityFacets(w http.ResponseWriter, r *http.Request) {
	ctx, span := tracing.DefaultTracer().Start(r.Context(), "handleCatalogEntityFacets")
	defer span.End()

	filter := r.URL.Query().Get("filter")
	facet := r.URL.Query().Get("facet")
	a.logger.Info("handleCatalogEntityFacets", "facet", facet)
	span.SetAttributes(attribute.Key("facet").String(facet))
	span.SetAttributes(attribute.Key("filter").String(filter))

	filterParam := ""
	if filter != "" {
		filterParam = fmt.Sprintf("&filter=%s&", url.QueryEscape(filter))
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/api/catalog/entity-facets?facet=%s%s", a.url, facet, filterParam), nil)
	if err != nil {
		a.logger.Error("Failed to create request", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	resp, err := a.httpClient.Do(req)
	if err != nil {
		a.logger.Error("Failed to run request", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		var result models.Facets
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			a.logger.Error("Failed to decode result", "error", err.Error())
			span.RecordError(err)
			span.SetStatus(codes.Error, err.Error())

			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var facets []string

		if facetValues, ok := result.Facets[facet]; ok {
			for _, value := range facetValues {
				facets = append(facets, value.Value)
			}
		}

		data, err := json.Marshal(facets)
		if err != nil {
			a.logger.Error("Failed to marshal facets", "error", err.Error())
			span.RecordError(err)
			span.SetStatus(codes.Error, err.Error())

			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Write(data)
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		a.logger.Error("Failed to read response body", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = fmt.Errorf("invalid response: %s", string(body))
	a.logger.Error("Failed request", "status", resp.StatusCode, "error", err.Error())
	span.SetAttributes(attribute.Key("status").Int(resp.StatusCode))
	span.RecordError(err)
	span.SetStatus(codes.Error, err.Error())

	http.Error(w, err.Error(), http.StatusInternalServerError)
}

func (a *App) handleCatalogEntitiesByQuery(w http.ResponseWriter, r *http.Request) {
	ctx, span := tracing.DefaultTracer().Start(r.Context(), "handleCatalogEntitiesByQuery")
	defer span.End()

	filter := r.URL.Query().Get("filter")
	cursor := r.URL.Query().Get("cursor")
	a.logger.Info("handleCatalogEntitiesByQuery", "filter", filter, "cursor", cursor)
	span.SetAttributes(attribute.Key("filter").String(filter))
	span.SetAttributes(attribute.Key("cursor").String(cursor))

	filterParam := ""
	if filter != "" {
		filterParam = fmt.Sprintf("&filter=%s&", url.QueryEscape(filter))
	}
	cursorParam := ""
	if cursor != "" {
		cursorParam = fmt.Sprintf("&cursor=%s", cursor)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/api/catalog/entities/by-query?orderField=metadata.name,asc&limit=100&%s%s", a.url, filterParam, cursorParam), nil)
	if err != nil {
		a.logger.Error("Failed to create request", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	resp, err := a.httpClient.Do(req)
	if err != nil {
		a.logger.Error("Failed to run request", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		_, err = io.Copy(w, resp.Body)
		if err != nil {
			a.logger.Error("Failed to copy response body", "error", err.Error())
			span.RecordError(err)
			span.SetStatus(codes.Error, err.Error())

			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		a.logger.Error("Failed to read response body", "error", err.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = fmt.Errorf("invalid response: %s", string(body))
	a.logger.Error("Failed request", "status", resp.StatusCode, "error", err.Error())
	span.SetAttributes(attribute.Key("status").Int(resp.StatusCode))
	span.RecordError(err)
	span.SetStatus(codes.Error, err.Error())

	http.Error(w, err.Error(), http.StatusInternalServerError)
}
