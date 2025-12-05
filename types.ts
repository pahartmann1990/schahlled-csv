export interface DataPoint {
  [key: string]: string | number;
}

export interface ParsedData {
  headers: string[];
  rows: DataPoint[];
  fileName?: string;
  lastModified?: number;
}

export interface ChartConfigState {
  xAxisKey: string;
  activeLines: string[];
  smoothing: number; // Moving Average Window (0 = off)
  showGrid: boolean;
  strokeWidth: number;
}

export interface ProjectFile {
  version: string;
  type: 'csv-visualizer-project';
  data: ParsedData;
  config: ChartConfigState;
  savedAt: string;
}