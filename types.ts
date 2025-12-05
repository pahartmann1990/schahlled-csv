export interface DataPoint {
  [key: string]: string | number;
}

export interface ParsedData {
  headers: string[];
  rows: DataPoint[];
  fileName?: string;
  lastModified?: number;
  hasTimeAxis: boolean; // Detected type (Chartable vs List)
}

export interface ChartConfigState {
  xAxisKey: string;
  activeLines: string[];
  showGrid: boolean;
  filterStart: string; // YYYY-MM-DD
  filterEnd: string; // YYYY-MM-DD
}

export interface ProjectFile {
  version: string;
  type: 'schal-led-project';
  data: ParsedData;
  config: ChartConfigState;
  savedAt: string;
}