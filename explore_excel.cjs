const XLSX = require('xlsx');
const workbook = XLSX.readFile('Tablero de Precios 29-04-2026 VALORES SURMOTOR.xlsx');

const sheetsToExplore = ['Cada 10K', 'Repuestos'];
for (const sheetName of sheetsToExplore) {
  console.log(`\n--- First few rows of sheet: ${sheetName} ---`);
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  for (let i = 0; i < Math.min(10, json.length); i++) {
    console.log(json[i]);
  }
}
