import ExcelJS from 'exceljs';
import { ParsedData, ChartConfigState } from '../types';

/**
 * Erzeugt einen professionellen Excel-Report mit Fokus auf kumulierten Werten und relativer Skalierung.
 */
export const generateExcelReport = async (
  data: ParsedData, 
  config: ChartConfigState, 
  filteredRows: any[]
) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Schal LED Energy Engine';
    workbook.lastModifiedBy = 'Schal LED User';
    workbook.created = new Date();

    // --- SHEET 1: VISUELLE ANALYSE (Das Zellen-Dashboard) ---
    const dashSheet = workbook.addWorksheet('1. Analyse-Dashboard');
    
    dashSheet.getColumn(2).width = 30; // Kennzahl Name
    dashSheet.getColumn(3).width = 12; // Einheit
    dashSheet.getColumn(4).width = 18; // GESAMT Spalte
    
    const metrics = data.headers.filter(h => h !== 'Date');
    const dates = filteredRows.map(r => r['Date']);
    
    // Titel Styling
    const titleCell = dashSheet.getCell('B2');
    titleCell.value = 'SCHAL LED - ENERGIE ANALYSE REPORT';
    titleCell.font = { name: 'Arial Black', size: 16, color: { argb: 'FF166534' } };

    // Header Zeile (Metadaten Spalten)
    const headerRowIdx = 4;
    dashSheet.getCell(headerRowIdx, 2).value = 'KENNZAHL';
    dashSheet.getCell(headerRowIdx, 3).value = 'EINHEIT';
    dashSheet.getCell(headerRowIdx, 4).value = 'GESAMT / Ø';
    
    // Header Styling für Metadaten
    [2, 3, 4].forEach(col => {
      const cell = dashSheet.getCell(headerRowIdx, col);
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } };
      cell.alignment = { horizontal: 'center' };
    });

    // Header Zeile (Die Monate)
    dates.forEach((date, i) => {
      const cell = dashSheet.getCell(headerRowIdx, i + 5);
      cell.value = date;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
      cell.alignment = { horizontal: 'center' };
      dashSheet.getColumn(i + 5).width = 15;
    });

    // Daten befüllen
    metrics.forEach((metric, mIdx) => {
      const rowIdx = headerRowIdx + 1 + mIdx;
      const row = dashSheet.getRow(rowIdx);
      const isPercent = metric.toLowerCase().includes('%');
      
      row.getCell(2).value = metric;
      row.getCell(2).font = { bold: true };
      
      let unit = '-';
      let barColor = 'FF3B82F6'; 
      const lowMetric = metric.toLowerCase();
      if (lowMetric.includes('kwh')) { unit = 'kWh'; barColor = 'FF10B981'; }
      else if (lowMetric.includes('eur')) { unit = 'EUR'; barColor = 'FFF59E0B'; }
      else if (lowMetric.includes('%')) { unit = '%'; barColor = 'FFEF4444'; }
      else if (lowMetric.includes('kg') || lowMetric.includes('co2')) { unit = 'kg'; barColor = 'FF64748B'; }
      
      row.getCell(3).value = unit;
      row.getCell(3).alignment = { horizontal: 'center' };

      // Werte sammeln und Gesamt/Ø berechnen
      let total = 0;
      const values: number[] = [];
      dates.forEach((date) => {
        const dataPoint = filteredRows.find(r => r['Date'] === date);
        const val = dataPoint ? (Number(dataPoint[metric]) || 0) : 0;
        values.push(val);
        total += val;
      });

      const finalAggregatedValue = isPercent ? (total / Math.max(1, values.length)) : total;
      
      // Gesamt/Ø Zelle befüllen
      const totalCell = row.getCell(4);
      totalCell.value = finalAggregatedValue;
      totalCell.numFmt = '#,##0.0';
      totalCell.font = { bold: true };
      totalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      totalCell.alignment = { horizontal: 'right' };

      // Monatswerte befüllen
      values.forEach((val, dIdx) => {
        const colIdx = dIdx + 5;
        const cell = row.getCell(colIdx);
        cell.value = val;
        cell.numFmt = '#,##0.0';
      });

      // RELATIVE DATENBALKEN SKALIERUNG
      // Wenn nicht Prozent: Skala geht von 0 bis zum Gesamtwert (Januar ist soundsoviel vom Jahr)
      // Wenn Prozent: Skala geht von 0 bis 100
      const startCol = dashSheet.getColumn(5).letter;
      const endCol = dashSheet.getColumn(dates.length + 4).letter;
      const range = `${startCol}${rowIdx}:${endCol}${rowIdx}`;
      
      dashSheet.addConditionalFormatting({
        ref: range,
        rules: [
          {
            type: 'dataBar',
            cfvo: [
              { type: 'num', value: 0 },
              { 
                type: isPercent ? 'num' : 'num', 
                value: isPercent ? 100 : finalAggregatedValue 
              }
            ],
            color: { argb: barColor },
            showValue: true
          }
        ]
      });
    });

    // --- SHEET 2: ROHDATEN (Echte Excel Tabelle) ---
    const dataSheet = workbook.addWorksheet('2. Messwerte (Tabelle)');
    const tableRows = filteredRows.map(r => data.headers.map(h => r[h]));

    dataSheet.addTable({
      name: 'MessdatenTabelle',
      ref: 'A1',
      headerRow: true,
      totalsRow: true,
      style: { theme: 'TableStyleMedium9', showRowStripes: true },
      columns: data.headers.map(h => ({
        name: h,
        filterButton: true,
        totalsRowFunction: h === 'Date' ? 'custom' : (h.toLowerCase().includes('%') ? 'average' : 'sum')
      })),
      rows: tableRows,
    });
    dataSheet.columns.forEach(col => { col.width = 20; });

    // --- DOWNLOAD ---
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `SchalLED_Energiebericht_${new Date().toISOString().slice(0,10)}.xlsx`;
    document.body.appendChild(anchor);
    anchor.click();
    
    setTimeout(() => {
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    }, 500);

  } catch (error) {
    console.error("Excel Export Fehler:", error);
    alert("Export fehlgeschlagen. Bitte prüfen Sie die Browser-Konsole.");
  }
};
