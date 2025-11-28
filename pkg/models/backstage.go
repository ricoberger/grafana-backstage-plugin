package models

type Facets struct {
	Facets map[string][]FacetValue `json:"facets"`
}

type FacetValue struct {
	Value string `json:"value"`
	Count int    `json:"count"`
}
