import { ParsedData, DataPoint } from '../types';
import * as XLSX from 'xlsx';

const isMonthYear = (str: string) => {
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const s = str.toLowerCase();
  return months.some(m => s.startsWith(m)) && /\d{4}/.test(s);
};

export const parseFile = async (file: File): Promise<ParsedData> => {
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
  let rawData: any[][] = [];

  if (isExcel) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  } else {
    const text = await file.text();
    const delimiter = text.includes(';') ? ';' : ',';
    rawData = text.split(/\r?\n/).map(line => line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, '')));
  }

  if (rawData.length === 0) return { headers: [], rows: [], hasTimeAxis: false };

  const firstHeader = String(rawData[0][0]).toLowerCase();
  
  // DETECT TRANSPOSED DATA (like in the screenshot)
  if (firstHeader === 'metric' || firstHeader === 'label' || firstHeader === '') {
    const dateHeaders = rawData[0].slice(2); // Skip 'metric' and 'label'
    const metricsRows = rawData.slice(1).filter(r => r[0]); // Skip empty rows

    const transformedRows: DataPoint[] = dateHeaders.map((date, colIndex) => {
      const point: DataPoint = { "Date": date };
      metricsRows.forEach(row => {
        const metricName = row[0];
        let val = row[colIndex + 2];
        if (typeof val === 'string') val = val.replace(',', '.');
        point[metricName] = !isNaN(Number(val)) ? Number(val) : val;
      });
      return point;
    });

    const metricNames = metricsRows.map(r => String(r[0]));
    return {
      headers: ["Date", ...metricNames],
      rows: transformedRows,
      fileName: file.name,
      hasTimeAxis: true
    };
  }

  // STANDARD ROW-BASED PARSER (Fallback)
  const headers = rawData[0].map(h => String(h).trim());
  const rows = rawData.slice(1).map(r => {
    const obj: any = {};
    headers.forEach((h, i) => {
      let val = r[i];
      if (typeof val === 'string') val = val.replace(',', '.');
      obj[h] = !isNaN(Number(val)) ? Number(val) : val;
    });
    return obj;
  });

  return { headers, rows, fileName: file.name, hasTimeAxis: true };
};

export const mergeDatasets = (existing: ParsedData, incoming: ParsedData): ParsedData => {
  return incoming; // Simple overwrite for dashboard style
};
