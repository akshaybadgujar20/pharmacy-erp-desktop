export interface GridExportConfig {
  enabled?: boolean;
  formats?: ('csv' | 'excel' | 'pdf')[];
  fileName?: string;
  selectedRowsOnly?: boolean;
}
