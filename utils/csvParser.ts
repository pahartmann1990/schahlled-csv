import { ParsedData, DataPoint } from '../types';
import * as XLSX from 'xlsx';

// Helper to check if a string looks like a date
const isDateString = (val: any): boolean => {
    if (typeof val !== 'string') return false;
    // Matches YYYY-MM-DD, DD.MM.YYYY, YYYY/MM/DD
    return /^\d{4}-\d{2}-\d{2}/.test(val) || 
           /^\d{2}\.\d{2}\.\d{4}/.test(val) ||
           /^\d{2}\/\d{2}\/\d{4}/.test(val);
};

// Helper to parse a date string into a comparable timestamp number
const parseDateToTimestamp = (val: any): number => {
    if (val instanceof Date) return val.getTime();
    if (typeof val === 'number') return val; // Excel serial?
    if (typeof val !== 'string') return 0;

    // Handle YYYY-MM-DD (ISO) explicitly to avoid timezone issues
    if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
        const parts = val.split(/[-T ]/); // Split on -, T, or space
        if (parts.length >= 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1; // Month is 0-index
            const d = parseInt(parts[2], 10);
            return new Date(y, m, d).getTime();
        }
    }

    // Handle DD.MM.YYYY
    if (/^\d{2}\.\d{2}\.\d{4}/.test(val)) {
        const parts = val.split('.');
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
    }

    // Fallback
    const d = new Date(val);
    return !isNaN(d.getTime()) ? d.getTime() : 0;
};

const processData = (headers: string[], rawRows: any[], fileName?: string): ParsedData => {
    // 1. Clean Data & Detect Types
    const rows: DataPoint[] = [];
    
    // Identify potential Time Axis
    const timeKeywords = ['datum', 'date', 'zeit', 'time', 'timestamp', 'created'];
    const timeHeader = headers.find(h => timeKeywords.some(k => h.toLowerCase().includes(k))) || '';
    const hasTimeAxis = !!timeHeader;

    for (let i = 0; i < rawRows.length; i++) {
        const rawRow = rawRows[i];
        if (!rawRow || Object.keys(rawRow).length === 0) continue;

        const row: DataPoint = {};
        let isEmpty = true;

        headers.forEach((header, index) => {
             // Access by index if array, or by key if object
             let val = Array.isArray(rawRow) ? rawRow[index] : rawRow[header];
             
             if (val !== undefined && val !== null && val !== '') {
                 isEmpty = false;
                 // Normalize Numbers
                 if (typeof val === 'string') {
                     val = val.trim().replace(/^"|"$/g, '');
                     // Check if it's a pure number (and not a date string)
                     if (!isNaN(Number(val)) && val !== '' && !isDateString(val)) {
                         row[header] = Number(val);
                     } else {
                         row[header] = val;
                     }
                 } else {
                     row[header] = val;
                 }
             }
        });

        if (!isEmpty) rows.push(row);
    }

    // 2. Sort by Time if applicable
    if (hasTimeAxis) {
        rows.sort((a, b) => {
            const tA = parseDateToTimestamp(a[timeHeader]);
            const tB = parseDateToTimestamp(b[timeHeader]);
            return tA - tB;
        });
    }

    return { headers, rows, fileName, lastModified: Date.now(), hasTimeAxis };
};

export const parseFile = async (file: File): Promise<ParsedData> => {
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

  if (isExcel) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Get headers first
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (jsonData.length < 2) return { headers: [], rows: [], hasTimeAxis: false };

    const headers = (jsonData[0] as string[]).map(h => String(h).trim());
    const dataRows = jsonData.slice(1);

    return processData(headers, dataRows, file.name);

  } else {
    const text = await file.text();
    const lines = text.trim().split(/\r\n|\n/);
    if (lines.length < 2) return { headers: [], rows: [], hasTimeAxis: false };

    // Smart split handling quotes
    const headers = lines[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.trim().replace(/^"|"$/g, ''));
    
    const dataRows = lines.slice(1).map(line => {
        const vals = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        // Map array to object based on headers to match processData expectation
        const rowObj: any = {};
        headers.forEach((h, i) => {
            rowObj[h] = vals[i];
        });
        return rowObj;
    });

    return processData(headers, dataRows, file.name);
  }
};

export const mergeDatasets = (existing: ParsedData, incoming: ParsedData): ParsedData => {
    // Determine the master time header from existing data
    const timeKeywords = ['datum', 'date', 'zeit', 'time'];
    const timeHeader = existing.headers.find(h => timeKeywords.some(k => h.toLowerCase().includes(k)));

    // New combined headers (union)
    const newHeaders = Array.from(new Set([...existing.headers, ...incoming.headers]));

    const newRows = [...existing.rows, ...incoming.rows];

    // Re-Sort if time axis exists
    if (timeHeader) {
         newRows.sort((a, b) => {
            const tA = parseDateToTimestamp(a[timeHeader] || '');
            const tB = parseDateToTimestamp(b[timeHeader] || '');
            return tA - tB;
        });
    }

    return {
        headers: newHeaders,
        rows: newRows,
        fileName: existing.fileName, // Keep original filename
        lastModified: Date.now(),
        hasTimeAxis: existing.hasTimeAxis || incoming.hasTimeAxis
    };
};