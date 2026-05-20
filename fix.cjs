const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

// Strip out inline styles and use external stylesheet
c = c.replace(/<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="/src/styles/main.css">');

// Strip out inline scripts and use external module
c = c.replace(/<script>[\s\S]*?<\/script>/, '<script type="module" src="/src/main.js"></script>');

// Update the select to datalist for Model
const selectRegex = /<div>\s*<label class="flbl">Modelo<\/label>\s*<select id="sel-mod"><option value="">— Seleccionar modelo —<\/option><\/select>\s*<\/div>/;
const datalistReplace = `<div>
  <label class="flbl">Modelo</label>
  <input type="text" id="inp-mod" list="dl-models" class="s-inp" placeholder="— Buscar modelo —" autocomplete="off">
  <datalist id="dl-models"></datalist>
</div>`;
c = c.replace(selectRegex, datalistReplace);

// Add Sugeribles & Adicionales UI
const itemsCardEnd = /<div class="card hidden" id="items-card">[\s\S]*?<\/div>\s*<\/div>/;
const newCards = `<div class="card hidden" id="items-card">
        <div class="chdr">
          <div class="cttl"><div class="sdot done">✓</div> Repuestos y actividades por mantenimiento</div>
          <span class="badge bn" id="items-badge">—</span>
        </div>
        <div class="km-tabs" id="km-tabs"></div>
        <div class="isec" id="items-list"></div>
      </div>

      <div id="sug-card" class="card hidden" style="margin-top:20px">
        <div class="chead" style="display:flex; justify-content:space-between; align-items:center; padding:16px 20px; border-bottom:1px solid #e3e4e8;">
          <h2 class="ctit" style="font-size:14px; font-weight:700;"><div class="sdot" style="display:inline-block; width:20px; height:20px; background:#ea580c; color:white; text-align:center; border-radius:50%; margin-right:8px;">3</div> SERVICIOS SUGERIBLES OPCIONALES</h2>
          <span id="seg-badge" style="padding:4px 10px; border:1px solid #fca5a5; color:#ea580c; border-radius:4px; font-size:12px; font-weight:700;">Seg C</span>
        </div>
        <div class="cbody" id="sug-list" style="padding:16px 20px; display:flex; flex-direction:column; gap:12px;">
        </div>
      </div>

      <div id="adic-card" class="card hidden" style="margin-top:20px">
        <div class="chead" style="padding:16px 20px; border-bottom:1px solid #e3e4e8;">
          <h2 class="ctit" style="font-size:14px; font-weight:700;"><div class="sdot" style="display:inline-block; width:20px; height:20px; background:#ea580c; color:white; text-align:center; border-radius:50%; margin-right:8px;">4</div> BENEFICIOS Y ADICIONALES</h2>
        </div>
        <div class="cbody" id="adic-list" style="padding:16px 20px; display:flex; flex-direction:column; gap:12px;">
        </div>
      </div>`;

c = c.replace(itemsCardEnd, newCards);

// Add PDF Modal before closing body
const pdfModal = `
<div id="pdf-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:100; display:none; justify-content:center; align-items:center;">
  <div style="background:#fff; width:400px; padding:30px; border-radius:8px; max-height:90vh; overflow-y:auto; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
    <h2 style="font-size:22px; font-weight:700; margin-bottom:8px; color:#111;">Obtén tu cotización</h2>
    <p style="font-size:13px; color:#666; margin-bottom:20px;">Completa tus datos para recibir tu cotización personalizada.</p>
    
    <label class="flbl">Nombre del cliente</label>
    <input type="text" id="pdf-cliente" class="s-inp" style="margin-bottom:12px; width:calc(100% - 22px);" placeholder="Ej. Juan Pérez">
    
    <label class="flbl">Cédula</label>
    <input type="text" id="pdf-cedula" class="s-inp" style="margin-bottom:12px; width:calc(100% - 22px);" placeholder="Ej. 1712345678">
    
    <label class="flbl">Teléfono</label>
    <input type="text" id="pdf-telefono" class="s-inp" style="margin-bottom:12px; width:calc(100% - 22px);" placeholder="Ej. 099 123 4567">
    
    <label class="flbl">Correo electrónico</label>
    <input type="email" id="pdf-correo" class="s-inp" style="margin-bottom:12px; width:calc(100% - 22px);" placeholder="Ej. juan@email.com">
    
    <label class="flbl">Concesionario</label>
    <select id="pdf-concesionario" class="s-inp" style="margin-bottom:12px; width:100%;">
      <option value="SURMOTOR">SURMOTOR</option>
      <option value="SHYRIS">SHYRIS</option>
      <option value="GRANDA_CENTENO">GRANDA_CENTENO</option>
    </select>
    
    <label class="flbl">Agencia</label>
    <select id="pdf-agencia" class="s-inp" style="margin-bottom:12px; width:100%;">
      <option value="Principal">Principal</option>
    </select>
    
    <label class="flbl">Nombre del asesor</label>
    <input type="text" id="pdf-asesor" class="s-inp" style="margin-bottom:20px; width:calc(100% - 22px);" placeholder="Ej. María González">
    
    <div style="display:flex; align-items:center; gap:8px; margin-bottom:20px;">
      <input type="checkbox" id="pdf-terms">
      <label for="pdf-terms" style="font-size:11px; color:#666;">Acepto los términos y condiciones y la política de privacidad.</label>
    </div>
    
    <button id="btn-do-pdf" class="btn" style="width:100%; background:#737373; font-size:14px; color:white; border:none; padding:12px; border-radius:4px; cursor:pointer;">📄 Descargar PDF</button>
    <button id="btn-close-pdf" style="width:100%; margin-top:10px; background:transparent; border:none; color:#666; cursor:pointer; font-weight:600; padding:10px;">Cancelar</button>
  </div>
</div>
</body>`;
c = c.replace('</body>', pdfModal);

// Replace button PDF side text to use correct ID
c = c.replace('<button class="bpdf" id="btn-pdf-side">', '<button class="bpdf" id="btn-open-pdf">');

fs.writeFileSync('index.html', c);
console.log('Fixed index.html structure safely.');
