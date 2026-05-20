const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const workbook = XLSX.readFile(path.join(__dirname, '../Tablero de Precios 29-04-2026 VALORES SURMOTOR.xlsx'));

const finalCatalog = {};
const finalPricing = {};
const finalGroups = {};

const MANUAL_MAPPING = {
  // Picanto JA
  'JAGSL1000M42': { m: 'Picanto JA', mo: '1.0 Gasolina', tr: 'MT' },
  'JAGSL1200M42': { m: 'Picanto JA', mo: '1.2 Gasolina', tr: 'MT' }, 
  'JAGSL1200A42': { m: 'Picanto JA', mo: '1.2 Gasolina', tr: 'AT' },
  // Picanto TA
  'TAGSL1000M42': { m: 'Picanto TA', mo: '1.0 Gasolina', tr: 'MT' },
  'TAGSL1200M42': { m: 'Picanto TA', mo: '1.2 Gasolina', tr: 'MT' },
  // Rio SC
  'SCGSL1400M42': { m: 'Rio SC', mo: '1.4 Gasolina', tr: 'MT' },
  'SCGSL1400A42': { m: 'Rio SC', mo: '1.4 Gasolina', tr: 'AT' },
  // Soluto AB
  'ABGSL1400M42': { m: 'Soluto AB', mo: '1.4 Gasolina', tr: 'MT' },
  // Stonic YBCVU
  'YBCUVHEV1000M42': { m: 'Stonic YBCVU', mo: '1.0 Gasolina', tr: 'MT' },
  'YBCUVHEV1000A42': { m: 'Stonic YBCVU', mo: '1.0 Gasolina', tr: 'DCT' },
  // Seltos SP2i
  'SP2IGSL1600M42': { m: 'Seltos SP2i', mo: '1.6 Gasolina', tr: 'MT' },
  'SP2IGSL1600A42': { m: 'Seltos SP2i', mo: '1.6 Gasolina', tr: 'AT' },
  // Seltos SP2c
  'SP2CGSL1500M42': { m: 'Seltos SP2c', mo: '1.5 Gasolina', tr: 'MT' },
  'SP2CGSL1500A42': { m: 'Seltos SP2c', mo: '1.5 Gasolina', tr: 'IVT' },
  // Cerato BDm
  'BDMGSL1600M42': { m: 'Cerato BDm', mo: '1.6 Gasolina', tr: 'MT' },
  'BDMGSL1600A42': { m: 'Cerato BDm', mo: '1.6 Gasolina', tr: 'AT' },
  // Optima JF HEV
  'JFHEV2000A42': { m: 'Optima JF HEV', mo: '2.0 Gasolina', tr: 'DCT' },
  // K5 DL3 HEV
  'DL3HEV2000A42': { m: 'K5 DL3 HEV', mo: '2.0 Gasolina', tr: 'DCT' },
  // Sonet QY
  'QYGSL1500M42': { m: 'Sonet QY', mo: '1.5 Gasolina', tr: 'MT' },
  'QYGSL1500A42': { m: 'Sonet QY', mo: '1.5 Gasolina', tr: 'IVT' },
  // SOUL SK3
  'SK3GSL1600M42': { m: 'SOUL SK3', mo: '1.6 Gasolina', tr: 'MT' },
  // Carens KY
  'KY1GSL1500M42': { m: 'Carens KY', mo: '1.5 Gasolina', tr: 'MT' },
  'KY1GSL1500A42': { m: 'Carens KY', mo: '1.5 Gasolina', tr: 'IVT' },
  // Niro DE HEV
  'DEHEV1600A42': { m: 'Niro DE HEV', mo: '1.6 Gasolina', tr: 'DCT' },
  // Niro SG2 HEV
  'SG2HEV1600A42': { m: 'Niro SG2 HEV', mo: '1.6 Gasolina', tr: 'DCT' },
  // Sportage SL
  'SLGSL2000M42': { m: 'Sportage SL', mo: '2.0 Gasolina', tr: 'MT' },
  'SLGSL2000A42': { m: 'Sportage SL', mo: '2.0 Gasolina', tr: 'AT' },
  // Sportage QL
  'QLGSL2000M42': { m: 'Sportage QL', mo: '2.0 Gasolina', tr: 'MT' },
  'QLGSL2000A42': { m: 'Sportage QL', mo: '2.0 Gasolina', tr: 'AT' },
  'QLGSL2400A42': { m: 'Sportage QL', mo: '2.4 Gasolina', tr: 'AT' },
  // Sportage NQ5
  'NQ5GSL2000M42': { m: 'Sportage NQ5', mo: '2.0 Gasolina', tr: 'MT 4X2' },
  'NQ5GSL2000A42': { m: 'Sportage NQ5', mo: '2.0 Gasolina', tr: 'AT 4X2' },
  'NQ5GSL2000A44': { m: 'Sportage NQ5', mo: '2.0 Gasolina', tr: 'AT 4X4' },
  // Sorento UM
  'UMGSL3300A42': { m: 'Sorento UM', mo: '3.3 Gasolina', tr: 'AT 4X2' },
  'UMGSL3300A44': { m: 'Sorento UM', mo: '3.3 Gasolina', tr: 'AT 4X4' },
  'UMGSL3500A42': { m: 'Sorento UM', mo: '3.5 Gasolina', tr: 'AT 4X2' },
  'UMGSL3500A44': { m: 'Sorento UM', mo: '3.5 Gasolina', tr: 'AT 4X4' },
  'UMGSL2400M42': { m: 'Sorento UM', mo: '2.4 Gasolina', tr: 'MT 4X2' },
  // Sorento MQ4
  'MQ4KDGSL3500A44': { m: 'Sorento MQ4', mo: '3.5 Gasolina', tr: 'AT' },
  // Stinger CK
  'CKGSL2000A42': { m: 'Stinger CK', mo: '2.0 Gasolina', tr: 'AT RWD' }, 
  'CKGSL3300A44': { m: 'Stinger CK', mo: '3.3 Gasolina', tr: 'AT AWD' },
  // Carnival YP
  'YPGSL3300A42': { m: 'Carnival YP', mo: '3.3 Gasolina', tr: 'AT' },
  // Carnival KA4
  'KA4KAGSL3500A42': { m: 'Carnival KA4', mo: '3.5 Gasolina', tr: 'AT' },
  // K3 BL7m
  'BL7GSL1400M42': { m: 'K3 BL7m', mo: '1.4 Gasolina', tr: 'MT' },
  'BL7GSL1600M42': { m: 'K3 BL7m', mo: '1.6 Gasolina', tr: 'MT' },
  'BL7GSL1600A42': { m: 'K3 BL7m', mo: '1.6 Gasolina', tr: 'AT' },
  // K3 BL7m Cross
  'BL7 CROSSGSL1400M42': { m: 'K3 BL7m Cross', mo: '1.4 Gasolina', tr: 'MT' },
  'BL7 CROSSGSL1400A42': { m: 'K3 BL7m Cross', mo: '1.4 Gasolina', tr: 'AT' },
  // EV Lineup
  'PS EVEV9999A42': { m: 'SOUL PS EV', mo: 'Electrico', tr: 'AT' },
  'SK3EVEV9999A42': { m: 'SOUL SK3 EV', mo: 'Electrico', tr: 'AT' },
  'SG2EV9999A42': { m: 'Niro SG2 EV', mo: 'Electrico', tr: 'AT' },
  'SVEV9999A42': { m: 'EV3 SV EV', mo: 'Electrico', tr: 'AT' },
  'OV1CEV9999A42': { m: 'EV5 OV EV 4x2', mo: 'Electrico', tr: 'AT' },
  'OV1CEV9999A44': { m: 'EV5 OV EV 4x4', mo: 'Electrico', tr: 'AT AWD' },
  'CV1EV9999A42': { m: 'EV6 CV EV 4x2', mo: 'Electrico', tr: 'AT' },
  'CV1EV9999A44': { m: 'EV6 CV EV 4x4', mo: 'Electrico', tr: 'AT AWD' },
  'MVEV9999A44': { m: 'EV9 MV EV', mo: 'Electrico', tr: 'AT AWD' },
  'CTEV9999A42': { m: 'EV4 CT EV', mo: 'Electrico', tr: 'AT' },
  'SWEV9999A42': { m: 'PV5 SW EV', mo: 'Electrico', tr: 'AT' },
  'QVEV9999A42': { m: 'EV2 QV EV', mo: 'Electrico', tr: 'AT' },
  // Commercials
  'K3NDSL3000M42': { m: 'K3000 K3N', mo: '3.0 Diesel', tr: 'MT' },
  'K2NDSL2700M42': { m: 'K2700 K2N', mo: '2.7 Diesel', tr: 'MT' },
  'TKDSL2200A44': { m: 'Tasman TK', mo: '2.2 Diesel', tr: 'AT 4X4' },
  'TKDSL2200M44': { m: 'Tasman TK', mo: '2.2 Diesel', tr: 'MT 4X4' }
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

  const { m: model, mo: motor, tr: tr } = modelInfo;

  if (!finalCatalog[code]) {
    finalCatalog[code] = { m: model, mo: motor, tr: tr, sg: 'A' }; 
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

console.log('Parsed successfully from Repuestos with exact structural mapping!');
