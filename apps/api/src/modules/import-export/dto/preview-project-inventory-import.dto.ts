export class PreviewProjectInventoryImportDto {
  sourceFormat?: 'CSV' | 'JSON' | 'XLSX';
  originalFileName?: string;
  rows?: Array<Record<string, unknown>>;
  csv?: string;
}
