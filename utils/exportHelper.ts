import ExcelJS from 'exceljs';
import * as htmlToImage from 'html-to-image';
import { ParsedData, ChartConfigState } from '../types';

export const generateExcelReport = async (
  data: ParsedData, 
  config: ChartConfigState, 
  filteredRows: any[]
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Schal LED Control Center';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Report');

  // 1. Add Data Table
  // Define columns
  const columns = config.xAxisKey 
    ? [config.xAxisKey, ...config.activeLines].map(h => ({ header: h, key: h, width: 20 }))
    : data.headers.map(h => ({ header: h, key: h, width: 20 }));

  sheet.columns = columns;

  // Add rows (filtered data only)
  // Ensure we only export the columns defined above to keep it clean
  filteredRows.forEach(row => {
    const rowData: any = {};
    columns.forEach(col => {
        if(col.key) rowData[col.key] = row[col.key];
    });
    sheet.addRow(rowData);
  });

  // Style Header
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF166534' } // Corporate Green
  };

  // 2. Capture and Embed Chart (only if chart exists and active lines are selected)
  if (config.activeLines.length > 0 && data.hasTimeAxis) {
    const chartNode = document.getElementById('main-chart-container');
    
    if (chartNode) {
        try {
            // Create a temporary white background for the capture
            const originalBg = chartNode.style.backgroundColor;
            chartNode.style.backgroundColor = '#ffffff';
            
            const dataUrl = await htmlToImage.toPng(chartNode, { quality: 0.95, backgroundColor: '#ffffff' });
            
            // Restore style
            chartNode.style.backgroundColor = originalBg;

            const imageId = workbook.addImage({
                base64: dataUrl,
                extension: 'png',
            });

            // Insert image at A1 (shifting data down?) 
            // Better: Insert data starting at row 20, put image above
            // Re-organize: Clear current rows, put image, put rows below.
            
            // Actually, let's put the data on a second sheet called "Data" and Image on "Dashboard"
            const dashSheet = workbook.addWorksheet('Dashboard');
            dashSheet.addImage(imageId, {
                tl: { col: 1, row: 1 },
                ext: { width: 800, height: 450 }
            });
            
            // Move "Dashboard" to first position
            workbook.worksheets = [dashSheet, sheet];

        } catch (error) {
            console.error("Chart capture failed", error);
            // Proceed without chart
        }
    }
  }

  // 3. Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SchalLED_Report_${new Date().toISOString().slice(0,10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};