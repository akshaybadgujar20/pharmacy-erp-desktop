export interface GridDataSourceConfig {
  endpoint?: string;
  method?: 'GET' | 'POST';
  serverSide?: boolean;
  queryMapping?: {
    globalSearchParam?: string;
    filters?: Record<string, string>;
  };
}
