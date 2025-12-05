import { ParsedData, DataPoint } from '../types';
import * as XLSX from 'xlsx';

export const parseFile = async (file: File): Promise<ParsedData> => {
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

  if (isExcel) {
    return parseExcel(file);
  } else {
    const text = await file.text();
    return parseCSV(text, file.name);
  }
};

const parseExcel = async (file: File): Promise<ParsedData> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  
  // Use the first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (jsonData.length < 2) {
    return { headers: [], rows: [] };
  }

  // Headers are the first row
  const headers = (jsonData[0] as string[]).map(h => String(h).trim());
  const rows: DataPoint[] = [];

  // Data rows
  for (let i = 1; i < jsonData.length; i++) {
    const rowData = jsonData[i];
    if (!rowData || rowData.length === 0) continue;

    const row: DataPoint = {};
    headers.forEach((header, index) => {
      const val = rowData[index];
      if (val !== undefined && val !== null) {
         // Check if number
         if (typeof val === 'number') {
             row[header] = val;
         } else if (!isNaN(parseFloat(val))) {
             row[header] = parseFloat(val);
         } else {
             row[header] = val;
         }
      }
    });
    // Only add if not empty
    if (Object.keys(row).length > 0) {
        rows.push(row);
    }
  }

  return { headers, rows, fileName: file.name, lastModified: Date.now() };
};

const parseCSV = (csvText: string, fileName?: string): ParsedData => {
  const lines = csvText.trim().split(/\r\n|\n/);
  
  if (lines.length < 2) {
    return { headers: [], rows: [] };
  }

  // Parse Headers
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  const rows: DataPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i];
    if (!currentLine.trim()) continue;

    const values = currentLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    
    if (values.length === headers.length) {
      const row: DataPoint = {};
      
      headers.forEach((header, index) => {
        let val = values[index]?.trim();
        if (val) val = val.replace(/^"|"$/g, '');
        
        const numVal = parseFloat(val);
        if (!isNaN(numVal) && val !== '') {
           row[header] = numVal;
        } else {
           row[header] = val;
        }
      });
      
      rows.push(row);
    }
  }

  return { headers, rows, fileName, lastModified: Date.now() };
};

export const mergeDatasets = (existing: ParsedData, incoming: ParsedData): ParsedData => {
    // Check if headers roughly match (ignoring order or casing could be an improvement, but keeping it strict for safety)
    const existingHeaders = new Set(existing.headers);
    const incomingHeaders = incoming.headers.filter(h => existingHeaders.has(h));
    
    if (incomingHeaders.length === 0) {
        throw new Error("Die Dateien haben keine gemeinsamen Spalten.");
    }

    // Merge rows
    // We normalize the new rows to match the existing structure
    const normalizedNewRows = incoming.rows.map(row => {
        const newRow: DataPoint = {};
        existing.headers.forEach(h => {
            if (row[h] !== undefined) {
                newRow[h] = row[h];
            }
        });
        return newRow;
    });

    const newRows = [...existing.rows, ...normalizedNewRows];

    return {
        ...existing,
        rows: newRows,
        lastModified: Date.now()
    };
};