import { Column } from '@grafana/ui';

export interface Filters {
  kind?: string;
  namespace?: string[];
  filter?: string;
  type?: string;
  lifecycle?: string[];
  tag?: string[];
  owner?: string[];
}

export interface EntitiesResult {
  items?: Entity[];
  pageInfo?: {
    nextCursor?: string;
    prevCursor?: string;
  };
  totalItems?: number;
}

export type Entity = {
  kind: string;
  metadata: {
    namespace?: string;
    annotations?: Record<string, string>;
    name?: string;
    description?: string;
    tags?: string[];
    uid: string;
  };
  spec: {
    type?: string;
    system?: string;
    lifecycle?: string;
    subcomponentOf?: string;
    owner?: string;
    target?: string;
    targets?: string[];
  };
  relations: Array<{ type?: string; targetRef?: string }>;
};

export interface EntitiesTable {
  columns: Array<Column<EntityData>>;
  data: Array<{
    id: string;
    backstageUrl: string;
    entity: Entity;
  }>;
}

export type EntityData = any;
