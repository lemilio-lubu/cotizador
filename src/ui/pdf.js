import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Re-import data to fetch actual names if needed, though we can pass it from app.js
let getAppState = null;

export function initPdf(getStateFn) {
  getAppState = getStateFn;

  const btnNav = document.getElementById('btn-pdf-nav');
  const btnSide = document.getElementById('btn-pdf-side');
  const modal = document.getElementById('pdf-modal');
  const btnClose = document.getElementById('pdf-close');
  const btnCancel = document.getElementById('pdf-cancel');
  const btnGenerate = document.getElementById('pdf-generate');
  
  const inpCliente = document.getElementById('pdf-cliente');
  const inpCedula = document.getElementById('pdf-cedula');
  const inpTelefono = document.getElementById('pdf-telefono');
  const inpAgencia = document.getElementById('pdf-agencia');
  const inpAsesor = document.getElementById('pdf-asesor');
  const chkTerms = document.getElementById('pdf-terms');

  const openModal = () => {
    const state = getAppState();
    if (!state.curCode || state.selKMs.length === 0) {
      alert("Por favor, selecciona un vehículo y al menos un kilometraje para generar la cotización.");
      return;
    }
    modal.classList.remove('hidden');
    checkForm();
  };

  const closeModal = () => {
    modal.classList.add('hidden');
  };

  const checkForm = () => {
    const isOk = inpCliente.value.trim() && 
                 inpCedula.value.trim() && 
                 inpTelefono.value.trim() && 
                 inpAsesor.value.trim() && 
                 chkTerms.checked;
    btnGenerate.disabled = !isOk;
  };

  if (btnNav) btnNav.addEventListener('click', openModal);
  if (btnSide) btnSide.addEventListener('click', openModal);
  btnClose.addEventListener('click', closeModal);
  btnCancel.addEventListener('click', closeModal);
  
  [inpCliente, inpCedula, inpTelefono, inpAsesor].forEach(el => {
    el.addEventListener('input', checkForm);
  });
  chkTerms.addEventListener('change', checkForm);

  btnGenerate.addEventListener('click', () => {
    const data = {
      cliente: inpCliente.value.trim(),
      cedula: inpCedula.value.trim(),
      telefono: inpTelefono.value.trim(),
      agencia: inpAgencia.options[inpAgencia.selectedIndex].text,
      asesor: inpAsesor.value.trim()
    };
    generatePDF(data);
    closeModal();
  });
}

function generatePDF(clientData) {
  const state = getAppState();
  if (!state.curCode) return;

  const doc = new jsPDF({ format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // -- COLORS & FONTS --
  const primaryColor = [10, 12, 16];
  const accentColor = [236, 101, 43];
  
  // -- HEADER --
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("KIA", 14, 20);
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Cotización de Servicio Prepagado", 14, 28);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const dateStr = new Date().toLocaleDateString('es-EC');
  doc.text(`Fecha: ${dateStr}`, pageWidth - 14, 20, { align: 'right' });
  doc.text(`Agencia: ${clientData.agencia}`, pageWidth - 14, 25, { align: 'right' });
  doc.text(`Asesor: ${clientData.asesor}`, pageWidth - 14, 30, { align: 'right' });

  doc.setDrawColor(200, 200, 200);
  doc.line(14, 35, pageWidth - 14, 35);
  
  // -- CLIENT DATA --
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Datos del Cliente", 14, 45);
  doc.setFont("helvetica", "normal");
  doc.text(`Nombre: ${clientData.cliente}`, 14, 52);
  doc.text(`Cédula/RUC: ${clientData.cedula}`, 14, 58);
  doc.text(`Teléfono: ${clientData.telefono}`, 14, 64);

  // -- VEHICLE DATA --
  doc.setFont("helvetica", "bold");
  doc.text("Datos del Vehículo", pageWidth / 2, 45);
  doc.setFont("helvetica", "normal");
  doc.text(`Modelo: ${state.curModel}`, pageWidth / 2, 52);
  doc.text(`Motor: ${state.curMotor} - Transmisión: ${state.curTrn}`, pageWidth / 2, 58);
  doc.text(`Código de Plan: ${state.curCode}`, pageWidth / 2, 64);

  // -- PRICING BREAKDOWN --
  let currentY = 75;
  const n = state.selKMs.length;
  const disc = n >= 2 ? 0.05 : 0;
  
  let tRep = 0, tMO = 0, tSinIVA = 0, tConIVA = 0;

  state.selKMs.forEach(km => {
    const kd = state.pricingData[state.curCode].k[km];
    if (!kd) return;

    tRep += kd.r; tMO += kd.o; tSinIVA += kd.s; tConIVA += kd.c;

    // Check page break
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text(`Mantenimiento ${km}K`, 14, currentY);
    currentY += 4;

    const items = kd.items || [];
    if (items.length > 0) {
      const itemBody = items.map(it => [
        it.name,
        it.qty.toString(),
        `$${it.pvp.toFixed(2)}`,
        `$${it.total.toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Repuesto / Actividad', 'Cant.', 'PVP Unit', 'Total PVP']],
        body: itemBody,
        theme: 'grid',
        headStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 14 }
      });
      currentY = doc.lastAutoTable.finalY + 4;
    }

    // Totales del Mantenimiento
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    
    // Alineación derecha para los montos
    const rightX = pageWidth - 14;
    
    doc.text(`Repuestos (PVP):`, rightX - 30, currentY, { align: 'right' });
    doc.text(`$${kd.r.toFixed(2)}`, rightX, currentY, { align: 'right' });
    currentY += 5;
    
    doc.text(`Mano de Obra:`, rightX - 30, currentY, { align: 'right' });
    doc.text(`$${kd.o.toFixed(2)}`, rightX, currentY, { align: 'right' });
    currentY += 5;
    
    doc.setFont("helvetica", "bold");
    doc.text(`Subtotal:`, rightX - 30, currentY, { align: 'right' });
    doc.text(`$${kd.s.toFixed(2)}`, rightX, currentY, { align: 'right' });
    currentY += 5;
    
    doc.text(`Total con IVA:`, rightX - 30, currentY, { align: 'right' });
    doc.text(`$${kd.c.toFixed(2)}`, rightX, currentY, { align: 'right' });
    
    currentY += 12;
  });

  // -- SUMMARY TOTALS --
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  doc.setDrawColor(200, 200, 200);
  doc.line(14, currentY - 6, pageWidth - 14, currentY - 6);
  
  doc.setFontSize(11);
  doc.setTextColor(0,0,0);
  doc.setFont("helvetica", "bold");
  doc.text(`RESUMEN DE MANTENIMIENTOS`, 14, currentY);
  currentY += 6;
  doc.setFont("helvetica", "normal");
  doc.text(`Total Repuestos: $${tRep.toFixed(2)}`, 14, currentY);
  currentY += 5;
  doc.text(`Total Mano de Obra: $${tMO.toFixed(2)}`, 14, currentY);
  currentY += 5;
  doc.setFont("helvetica", "bold");
  doc.text(`SUBTOTAL MANTENIMIENTOS: $${tConIVA.toFixed(2)}`, 14, currentY);
  currentY += 10;

  // spacing before discount
  // -- DISCOUNT & PREPAID --
  if (disc > 0) {
    doc.setFont("helvetica", "bold");
    doc.text(`Descuento aplicado: ${disc * 100}% por prepago (${n} mantenimientos)`, 14, currentY);
    currentY += 6;
    doc.text(`Total Prepagado: $${(tConIVA * (1 - disc)).toFixed(2)}`, 14, currentY);
    currentY += 10;
  }

  // -- SUGGESTIONS --
  const tSug = state.selSuggestions.reduce((acc, s) => acc + s.price, 0);
  if (state.selSuggestions.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Servicios Adicionales Seleccionados", 14, currentY);
    
    const sugBody = state.selSuggestions.map(s => [s.name, `$${s.price.toFixed(2)}`]);
    autoTable(doc, {
      startY: currentY + 4,
      head: [['Servicio', 'Precio']],
      body: sugBody,
      foot: [['Total Adicional', `$${tSug.toFixed(2)}`]],
      theme: 'grid',
      headStyles: { fillColor: [100, 100, 100] }
    });
    currentY = doc.lastAutoTable.finalY + 10;
  }

  // -- GRAND TOTAL --
  const grandTotal = (tConIVA * (1 - disc)) + tSug;
  doc.setFontSize(14);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(`TOTAL FINAL: $${grandTotal.toFixed(2)}`, 14, currentY);

  // -- TERMS --
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  const termsText = "Autorizo el tratamiento de mis datos personales de acuerdo a la Ley Orgánica de Protección de Datos Personales vigente en Ecuador, exclusivamente para fines informativos y de cotización. Esta cotización es referencial y está sujeta a cambios sin previo aviso. Los valores incluyen el 15% de IVA.";
  
  const pageHeight = doc.internal.pageSize.getHeight();
  const splitTerms = doc.splitTextToSize(termsText, pageWidth - 28);
  doc.text(splitTerms, 14, pageHeight - 20);

  // Download
  doc.save(`Cotizacion_KIA_${state.curModel}_${clientData.cliente.replace(/\s+/g, '_')}.pdf`);
}
