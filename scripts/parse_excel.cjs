const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Segment legend:
// A = Entry (Picanto)
// B = Mid (Rio, K3, Sonet, Soul, Seltos, Cerato, Carens, Niro, Stonic + compact EVs)
// C = Premium (Sportage, Sorento, Stinger, Carnival, K5, Optima + large EVs)

const workbook = XLSX.readFile(path.join(__dirname, '../Tablero de Precios 29-04-2026 VALORES SURMOTOR.xlsx'));

const finalCatalog = {};
const finalPricing = {};
const finalGroups = {};

const MANUAL_MAPPING = {
  // Picanto JA — Seg A
  'JAGSL1000M42': { m: 'Picanto JA', mo: '1.0 Gasolina', tr: 'MT', sg: 'A' },
  'JAGSL1200M42': { m: 'Picanto JA', mo: '1.2 Gasolina', tr: 'MT', sg: 'A' },
  'JAGSL1200A42': { m: 'Picanto JA', mo: '1.2 Gasolina', tr: 'AT', sg: 'A' },
  // Picanto TA — Seg A
  'TAGSL1000M42': { m: 'Picanto TA', mo: '1.0 Gasolina', tr: 'MT', sg: 'A' },
  'TAGSL1200M42': { m: 'Picanto TA', mo: '1.2 Gasolina', tr: 'MT', sg: 'A' },
  // Rio SC — Seg A
  'SCGSL1400M42': { m: 'Rio SC', mo: '1.4 Gasolina', tr: 'MT', sg: 'A' },
  'SCGSL1400A42': { m: 'Rio SC', mo: '1.4 Gasolina', tr: 'AT', sg: 'A' },
  // Soluto AB — Seg A
  'ABGSL1400M42': { m: 'Soluto AB', mo: '1.4 Gasolina', tr: 'MT', sg: 'A' },
  // Stonic YBCVU — Seg B
  'YBCUVHEV1000M42': { m: 'Stonic YBCVU', mo: '1.0 Gasolina', tr: 'MT', sg: 'B' },
  'YBCUVHEV1000A42': { m: 'Stonic YBCVU', mo: '1.0 Gasolina', tr: 'DCT', sg: 'B' },
  // Seltos SP2i — Seg B
  'SP2IGSL1600M42': { m: 'Seltos SP2i', mo: '1.6 Gasolina', tr: 'MT', sg: 'B' },
  'SP2IGSL1600A42': { m: 'Seltos SP2i', mo: '1.6 Gasolina', tr: 'AT', sg: 'B' },
  // Seltos SP2c — Seg B
  'SP2CGSL1500M42': { m: 'Seltos SP2c', mo: '1.5 Gasolina', tr: 'MT', sg: 'B' },
  'SP2CGSL1500A42': { m: 'Seltos SP2c', mo: '1.5 Gasolina', tr: 'IVT', sg: 'B' },
  // Cerato BDm — Seg B
  'BDMGSL1600M42': { m: 'Cerato BDm', mo: '1.6 Gasolina', tr: 'MT', sg: 'B' },
  'BDMGSL1600A42': { m: 'Cerato BDm', mo: '1.6 Gasolina', tr: 'AT', sg: 'B' },
  // Optima JF HEV — Seg C
  'JFHEV2000A42': { m: 'Optima JF HEV', mo: '2.0 Gasolina', tr: 'DCT', sg: 'C' },
  // K5 DL3 HEV — Seg C
  'DL3HEV2000A42': { m: 'K5 DL3 HEV', mo: '2.0 Gasolina', tr: 'DCT', sg: 'C' },
  // Sonet QY — Seg A
  'QYGSL1500M42': { m: 'Sonet QY', mo: '1.5 Gasolina', tr: 'MT', sg: 'A' },
  'QYGSL1500A42': { m: 'Sonet QY', mo: '1.5 Gasolina', tr: 'IVT', sg: 'A' },
  // SOUL SK3 — Seg B
  'SK3GSL1600M42': { m: 'SOUL SK3', mo: '1.6 Gasolina', tr: 'MT', sg: 'B' },
  // Carens KY — Seg B
  'KY1GSL1500M42': { m: 'Carens KY', mo: '1.5 Gasolina', tr: 'MT', sg: 'B' },
  'KY1GSL1500A42': { m: 'Carens KY', mo: '1.5 Gasolina', tr: 'IVT', sg: 'B' },
  // Niro DE HEV — Seg C
  'DEHEV1600A42': { m: 'Niro DE HEV', mo: '1.6 Gasolina', tr: 'DCT', sg: 'C' },
  // Niro SG2 HEV — Seg C (same family)
  'SG2HEV1600A42': { m: 'Niro SG2 HEV', mo: '1.6 Gasolina', tr: 'DCT', sg: 'C' },
  // Sportage SL — Seg C
  'SLGSL2000M42': { m: 'Sportage SL', mo: '2.0 Gasolina', tr: 'MT', sg: 'C' },
  'SLGSL2000A42': { m: 'Sportage SL', mo: '2.0 Gasolina', tr: 'AT', sg: 'C' },
  // Sportage QL — Seg C
  'QLGSL2000M42': { m: 'Sportage QL', mo: '2.0 Gasolina', tr: 'MT', sg: 'C' },
  'QLGSL2000A42': { m: 'Sportage QL', mo: '2.0 Gasolina', tr: 'AT', sg: 'C' },
  'QLGSL2400A42': { m: 'Sportage QL', mo: '2.4 Gasolina', tr: 'AT', sg: 'C' },
  // Sportage NQ5 — Seg C
  'NQ5GSL2000M42': { m: 'Sportage NQ5', mo: '2.0 Gasolina', tr: 'MT 4X2', sg: 'C' },
  'NQ5GSL2000A42': { m: 'Sportage NQ5', mo: '2.0 Gasolina', tr: 'AT 4X2', sg: 'C' },
  'NQ5GSL2000A44': { m: 'Sportage NQ5', mo: '2.0 Gasolina', tr: 'AT 4X4', sg: 'C' },
  // Sorento UM — Seg C
  'UMGSL3300A42': { m: 'Sorento UM', mo: '3.3 Gasolina', tr: 'AT 4X2', sg: 'C' },
  'UMGSL3300A44': { m: 'Sorento UM', mo: '3.3 Gasolina', tr: 'AT 4X4', sg: 'C' },
  'UMGSL3500A42': { m: 'Sorento UM', mo: '3.5 Gasolina', tr: 'AT 4X2', sg: 'C' },
  'UMGSL3500A44': { m: 'Sorento UM', mo: '3.5 Gasolina', tr: 'AT 4X4', sg: 'C' },
  'UMGSL2400M42': { m: 'Sorento UM', mo: '2.4 Gasolina', tr: 'MT 4X2', sg: 'C' },
  // Sorento MQ4 — Seg C
  'MQ4KDGSL3500A44': { m: 'Sorento MQ4', mo: '3.5 Gasolina', tr: 'AT', sg: 'C' },
  // Stinger CK — Seg C
  'CKGSL2000A42': { m: 'Stinger CK', mo: '2.0 Gasolina', tr: 'AT RWD', sg: 'C' },
  'CKGSL3300A44': { m: 'Stinger CK', mo: '3.3 Gasolina', tr: 'AT AWD', sg: 'C' },
  // Carnival YP — Seg C
  'YPGSL3300A42': { m: 'Carnival YP', mo: '3.3 Gasolina', tr: 'AT', sg: 'C' },
  // Carnival KA4 — Seg C
  'KA4KAGSL3500A42': { m: 'Carnival KA4', mo: '3.5 Gasolina', tr: 'AT', sg: 'C' },
  // K3 BL7m — Seg B
  'BL7GSL1400M42': { m: 'K3 BL7m', mo: '1.4 Gasolina', tr: 'MT', sg: 'B' },
  'BL7GSL1600M42': { m: 'K3 BL7m', mo: '1.6 Gasolina', tr: 'MT', sg: 'B' },
  'BL7GSL1600A42': { m: 'K3 BL7m', mo: '1.6 Gasolina', tr: 'AT', sg: 'B' },
  // K3 BL7m Cross — Seg B
  'BL7 CROSSGSL1400M42': { m: 'K3 BL7m Cross', mo: '1.4 Gasolina', tr: 'MT', sg: 'B' },
  'BL7 CROSSGSL1400A42': { m: 'K3 BL7m Cross', mo: '1.4 Gasolina', tr: 'AT', sg: 'B' },
  // EV Lineup
  'PS EVEV9999A42': { m: 'SOUL PS EV', mo: 'Electrico', tr: 'AT', sg: 'B' },
  'SK3EVEV9999A42': { m: 'SOUL SK3 EV', mo: 'Electrico', tr: 'AT', sg: 'B' },
  'SG2EV9999A42': { m: 'Niro SG2 EV', mo: 'Electrico', tr: 'AT', sg: 'B' },
  'SVEV9999A42': { m: 'EV3 SV EV', mo: 'Electrico', tr: 'AT', sg: 'B' },
  'OV1CEV9999A42': { m: 'EV5 OV EV 4x2', mo: 'Electrico', tr: 'AT', sg: 'B' },
  'OV1CEV9999A44': { m: 'EV5 OV EV 4x4', mo: 'Electrico', tr: 'AT AWD', sg: 'B' },
  'CV1EV9999A42': { m: 'EV6 CV EV 4x2', mo: 'Electrico', tr: 'AT', sg: 'C' },
  'CV1EV9999A44': { m: 'EV6 CV EV 4x4', mo: 'Electrico', tr: 'AT AWD', sg: 'C' },
  'MVEV9999A44': { m: 'EV9 MV EV', mo: 'Electrico', tr: 'AT AWD', sg: 'C' },
  'CTEV9999A42': { m: 'EV4 CT EV', mo: 'Electrico', tr: 'AT', sg: 'B' },
  'SWEV9999A42': { m: 'PV5 SW EV', mo: 'Electrico', tr: 'AT', sg: 'C' },
  'QVEV9999A42': { m: 'EV2 QV EV', mo: 'Electrico', tr: 'AT', sg: 'A' },
  // Commercials
  'K3NDSL3000M42': { m: 'K3000 K3N', mo: '3.0 Diesel', tr: 'MT', sg: 'C' },
  'K2NDSL2700M42': { m: 'K2700 K2N', mo: '2.7 Diesel', tr: 'MT', sg: 'B' },
  'TKDSL2200A44': { m: 'Tasman TK', mo: '2.2 Diesel', tr: 'AT 4X4', sg: 'C' },
  'TKDSL2200M44': { m: 'Tasman TK', mo: '2.2 Diesel', tr: 'MT 4X4', sg: 'C' }
};

const sheetName = 'Repuestos';
const sheet = workbook.Sheets[sheetName];
const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

for (let i = 1; i < json.length; i++) {
  const row = json[i];
  if (!row || !row[1] || !row[2]) continue;

  const vehName = row[1].trim(); 
  const code = row[2].trim();    
  const itemDesc = row[9] || row[8] || "ITEM";
  const qty = parseFloat(row[10]) || 0;
  let pvp = parseFloat(row[11]) || 0;
  let mo = parseFloat(row[13]) || 0;

  // Use manual mapping for guaranteed accuracy, fallback to naive parsing if unknown code appears
  let modelInfo = MANUAL_MAPPING[code];
  if (!modelInfo) {
    console.warn('Unknown code, using fallback parsing:', code, vehName);
    let model = vehName.split(' ')[0] + ' ' + (vehName.split(' ')[1] || '');
    let motor = 'Gasolina';
    let tr = 'MT';
    if (vehName.includes('AT')) tr = 'AT';
    if (vehName.includes('DCT')) tr = 'DCT';
    if (vehName.includes('IVT')) tr = 'IVT';
    modelInfo = { m: model, mo: motor, tr: tr };
  }

  const { m: model, mo: motor, tr, sg } = modelInfo;

  if (!finalCatalog[code]) {
    finalCatalog[code] = { m: model, mo: motor, tr, sg: sg || 'B' };
    finalPricing[code] = { k: {} };
    
    if (!finalGroups[model]) finalGroups[model] = { n: model, mo: [], v: {} };
    const grp = finalGroups[model];
    if (!grp.mo.includes(motor)) grp.mo.push(motor);
    if (!grp.v[motor]) grp.v[motor] = [];
    if (!grp.v[motor].find(x => x.code === code)) {
      grp.v[motor].push({ tr, code });
    }
  }

  for (let c = 14; c < row.length; c++) {
    if (row[c] === 'SI') {
      const km = ((c - 14 + 1) * 5).toString();
      if (!finalPricing[code].k[km]) {
        finalPricing[code].k[km] = { r: 0, o: 0, s: 0, c: 0, items: [] };
      }
      
      const totalPart = qty * pvp;
      
      finalPricing[code].k[km].items.push({
        name: itemDesc,
        qty: qty,
        pvp: pvp, 
        total: totalPart,
        mo: mo
      });
      
      finalPricing[code].k[km].r += totalPart;
      finalPricing[code].k[km].o += mo;
    }
  }
}

// Calculate totals
for (const code in finalPricing) {
  for (const km in finalPricing[code].k) {
    const kdata = finalPricing[code].k[km];
    kdata.s = kdata.r + kdata.o;
    kdata.c = kdata.s * 1.15; // 15% IVA
  }
}

// Format the GROUPS array consistently so that dropdowns render beautifully
const groupsArray = Object.values(finalGroups).sort((a, b) => a.n.localeCompare(b.n));

fs.writeFileSync(path.join(__dirname, '../src/data/catalog.json'), JSON.stringify({ GROUPS: groupsArray, CATALOG: finalCatalog }, null, 2));
fs.writeFileSync(path.join(__dirname, '../src/data/pricing.json'), JSON.stringify(finalPricing, null, 2));

// ─── Parse Hoja1: Actividades Sugeribles ───────────────────────────────────
const sugSheet = workbook.Sheets['Hoja1'];
const sugRows = XLSX.utils.sheet_to_json(sugSheet, { header: 1 });

// Shared activities have no A/B/C suffix; segment-specific ones end in " A", " B", " C"
const suggestions = { A: [], B: [], C: [] };

// We take the price from the first non-zero KM column (col index 1)
for (let i = 1; i < sugRows.length; i++) {
  const row = sugRows[i];
  if (!row || !row[0]) continue;

  const rawName = row[0].toString().trim();
  // Price is the same for all KM cols — grab first available value
  const price = parseFloat(row[1]) || 0;

  // Detect segment suffix
  const segMatch = rawName.match(/ ([ABC])$/);
  const displayName = segMatch ? rawName.slice(0, -2).trim() : rawName;
  const isIncluded = price === 0;

  const entry = { name: displayName, price, included: isIncluded };

  if (segMatch) {
    // Segment-specific: only add to that segment
    suggestions[segMatch[1]].push(entry);
  } else {
    // Shared: add to all segments
    suggestions.A.push(entry);
    suggestions.B.push(entry);
    suggestions.C.push(entry);
  }
}

fs.writeFileSync(path.join(__dirname, '../src/data/suggestions.json'), JSON.stringify(suggestions, null, 2));

console.log('Parsed successfully! suggestions.json generated.');
