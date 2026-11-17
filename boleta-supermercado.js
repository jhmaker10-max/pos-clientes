// Ticket térmico estilo supermercado (80 mm). Es un ticket comercial,
// no una boleta electrónica autorizada por SUNAT.
(function(){
'use strict';
const escapeHtml = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const soles = n => 'S/ ' + (Number(n)||0).toFixed(2);
// Formato exclusivamente visual: conserva sin cambios el identificador del pedido guardado.
function numeroVisibleBoleta(numero){
 const original=String(numero??'').trim();
 if(!original || /vista previa/i.test(original)) return original || 'SIN NÚMERO';
 const digitos=original.replace(/\D/g,'');
 return digitos ? 'B-'+digitos.slice(-6).padStart(6,'0') : original;
}
const fila = (etiqueta,valor,destacado=false) => valor ? `<div class="dato${destacado?' dato-destacado':''}"><span>${escapeHtml(etiqueta)}</span><span>${escapeHtml(valor)}</span></div>` : '';
function productos(p){
 if(Array.isArray(p.items)&&p.items.length) return p.items.map(x=>({nombre:String(x.nombre||'Producto'),codigo:String(x.codigo||''),cantidad:Math.max(1,Number(x.cantidad)||1),precio:Number(x.precio)||0}));
 return [{nombre:String(p.producto||'Producto'),codigo:String(p.codigo||''),cantidad:Math.max(1,Number(p.cantidad)||1),precio:Number(p.precio)||0}];
}
function contenido(p){
 const items=productos(p), total=items.reduce((s,x)=>s+x.cantidad*x.precio,0);
 const tienda=localStorage.getItem('nombreTienda')||'MI TIENDA';
 const tel=localStorage.getItem('contactoTienda')||'';
 const logo=localStorage.getItem('logoTienda')||'';
 const logoSeguro=/^(data:image\/(?:png|jpeg|gif|webp);base64,|https:\/\/)/i.test(logo) ? logo : '';
 const fecha=p.fechaCreacion?new Date(p.fechaCreacion):new Date();
 const fechaTexto=Number.isNaN(fecha.getTime())?new Date().toLocaleString('es-PE'):fecha.toLocaleString('es-PE',{dateStyle:'short',timeStyle:'short'});
 const listado=items.map(item=>`<div class="item"><div class="producto producto-destacado">${escapeHtml(item.nombre)}</div>${item.codigo?`<div class="codigo">COD. ${escapeHtml(item.codigo)}</div>`:''}<div class="linea-producto"><span class="cantidad-precio">${item.cantidad} × ${soles(item.precio)}</span><strong class="subtotal-item">${soles(item.cantidad*item.precio)}</strong></div></div>`).join('');
 const mensaje=String(p.mensajePedido||'').trim();
 const cierre=localStorage.getItem('mensajeTicket')||'';
 const metodo=p.metodoPago || document.querySelector('input[name="metodoPagoPro"]:checked')?.value || '';
 const qr=(metodo==='Yape'||metodo==='Plin')?localStorage.getItem('qrPago'+metodo)||'':'';
 const qrSeguro=/^(data:image\/(?:png|jpeg|webp);base64,|https:\/\/)/i.test(qr)?qr:'';
 const seccionPago=metodo?`<div class="separador"></div><div class="pago-ticket"><strong>MÉTODO DE PAGO: ${escapeHtml(metodo)}</strong>${qrSeguro?`<img class="qr-ticket" src="${escapeHtml(qrSeguro)}" alt="QR ${escapeHtml(metodo)}"><small>Escanea para pagar con ${escapeHtml(metodo)}</small>`:''}</div>`:'';
 return `<div class="cabecera cabecera-principal">${logoSeguro?`<img class="logo-ticket" src="${escapeHtml(logoSeguro)}" alt="Logo de tienda">`:''}<div class="nombre-tienda">${escapeHtml(tienda)}</div>${tel?`<div class="contacto">TEL. ${escapeHtml(tel)}</div>`:''}</div>
 <div class="separador separador-grueso"></div>
 <div class="cabecera"><div class="tipo">TICKET DE COMPRA</div><div class="subtipo">${escapeHtml(p.numero ? 'BOLETA N° '+numeroVisibleBoleta(p.numero) : 'VENTA AL DETALLE')}</div></div>
 <div class="separador"></div>
 <section class="datos-ticket">${fila('Fecha:',fechaTexto,true)}${fila('Cliente:',p.cliente||'Público general',true)}${fila('DNI:',p.dniCliente,true)}${fila('Teléfono:',p.telefonoCliente,true)}${fila('Dirección:',p.direccionCliente,true)}</section>
 <div class="separador separador-grueso"></div>
 <div class="titulos"><span>DESCRIPCIÓN / CANT. × P.U.</span><span>IMPORTE</span></div>
 <div class="separador"></div>
 <section class="articulos-ticket">${listado}</section>
 <div class="separador separador-grueso"></div>
 <div class="resumen"><span>PRODUCTOS DIFERENTES</span><strong>${items.length}</strong></div>
 <div class="resumen"><span>UNIDADES TOTALES</span><strong>${items.reduce((s,x)=>s+x.cantidad,0)}</strong></div>
 <div class="total"><span>TOTAL A PAGAR</span><strong>${soles(total)}</strong></div>
 ${seccionPago}
 ${mensaje?`<div class="separador"></div><div class="nota"><strong>OBSERVACIONES</strong><div>${escapeHtml(mensaje)}</div></div>`:''}
 <div class="separador separador-grueso"></div>
 <div class="pie">${cierre?`<div class="mensaje-cierre">${escapeHtml(cierre)}</div>`:''}<strong>¡GRACIAS POR SU COMPRA!</strong><div>ESPERAMOS VERLE PRONTO</div><small>No es comprobante electrónico SUNAT.</small></div>`;
}
const estilo=`
@page{size:80mm auto;margin:0}
.boleta-supermercado,.boleta-supermercado *{box-sizing:border-box!important}
.boleta-supermercado{width:80mm!important;max-width:100%!important;padding:4mm!important;margin:0 auto!important;background:#fff!important;color:#000!important;font:12px/1.38 Arial,Helvetica,sans-serif!important;text-align:left!important;overflow-wrap:anywhere!important;box-shadow:none!important;border:0!important}
.boleta-supermercado *{color:#000!important;background:transparent!important;text-shadow:none!important;box-shadow:none!important;letter-spacing:normal!important;border-radius:0!important}
.boleta-supermercado .cabecera{text-align:center!important}
.boleta-supermercado .cabecera-principal{padding-top:2px!important}
.boleta-supermercado .logo-ticket{display:block!important;width:auto!important;height:auto!important;max-width:15mm!important;max-height:15mm!important;object-fit:contain!important;margin:0 auto 2mm!important;padding:0!important;border:0!important}
.boleta-supermercado .nombre-tienda{font-size:19px!important;font-weight:800!important;line-height:1.15!important;margin:2px 0 4px!important;text-transform:uppercase!important}
.boleta-supermercado .contacto{font-size:11px!important}
.boleta-supermercado .detalle-cabecera{font-size:9px!important;font-weight:700!important;margin-top:4px!important}
.boleta-supermercado .tipo{font-size:14px!important;font-weight:800!important;line-height:1.2!important}
.boleta-supermercado .subtipo{font-size:10px!important;margin-top:3px!important}
.boleta-supermercado .separador{height:0!important;border-top:1px dashed #555!important;font-size:0!important;line-height:0!important;margin:8px 0!important;display:block!important;overflow:hidden!important}
.boleta-supermercado .separador-grueso{border-top:2px solid #000!important;margin:9px 0!important}
.boleta-supermercado .datos-ticket .dato{display:block!important;margin:3px 0!important;font-size:12px!important;line-height:1.45!important}
.boleta-supermercado .datos-ticket .dato span:first-child{font-weight:700!important;margin-right:4px!important}
.boleta-supermercado .datos-ticket .dato span:last-child{text-align:left!important;font-weight:400!important}
.boleta-supermercado .titulos{font-size:10px!important;font-weight:700!important;display:flex!important;justify-content:space-between!important;gap:5px!important}
.boleta-supermercado .titulos span:last-child{white-space:nowrap!important;text-align:right!important}
.boleta-supermercado .item{padding:5px 0 6px!important;border-bottom:1px dotted #aaa!important;margin:0!important;break-inside:avoid!important}
.boleta-supermercado .item:last-child{border-bottom:0!important}
.boleta-supermercado .producto{display:block!important;width:auto!important;height:auto!important;font-size:12px!important;font-weight:400!important;padding:0!important;margin:0!important;border:0!important;min-height:0!important;line-height:1.3!important}
.boleta-supermercado .producto-destacado{font-weight:700!important}
.boleta-supermercado .codigo{display:block!important;font-size:10px!important;margin:2px 0!important;padding:0!important;border:0!important;min-height:0!important}
.boleta-supermercado .linea-producto{display:flex!important;justify-content:space-between!important;align-items:baseline!important;gap:6px!important;font-size:11px!important;margin:3px 0 0!important}
.boleta-supermercado .linea-producto strong{white-space:nowrap!important;font-weight:700!important;text-align:right!important}
.boleta-supermercado .cantidad-precio{white-space:nowrap!important}
.boleta-supermercado .resumen{display:flex!important;justify-content:space-between!important;gap:6px!important;font-size:11px!important;margin:5px 0!important;font-weight:400!important}
.boleta-supermercado .resumen strong{font-weight:700!important}
.boleta-supermercado .total{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:6px!important;font-size:14px!important;font-weight:800!important;margin:9px 0 4px!important;padding:7px 0!important;border-top:2px solid #000!important;border-bottom:2px solid #000!important}
.boleta-supermercado .total strong{white-space:nowrap!important;font-size:15px!important}
.boleta-supermercado .pago-ticket{text-align:center!important;padding:6px 0!important}
.boleta-supermercado .pago-ticket strong{display:block!important;font-size:12px!important}
.boleta-supermercado .pago-ticket small{display:block!important;font-size:10px!important;margin-top:4px!important}
.boleta-supermercado .qr-ticket{display:block!important;width:38mm!important;height:38mm!important;max-width:100%!important;object-fit:contain!important;margin:7px auto 0!important;image-rendering:auto!important}
.boleta-supermercado .nota{font-size:11px!important;margin:7px 0!important;overflow-wrap:anywhere!important}
.boleta-supermercado .nota strong{display:block!important;font-size:10px!important;margin-bottom:4px!important}
.boleta-supermercado .pie{text-align:center!important;padding:5px 0 2px!important;font-size:10px!important}
.boleta-supermercado .pie strong{display:block!important;font-size:12px!important;margin:7px 0 3px!important}
.boleta-supermercado .pie .mensaje-cierre{margin-bottom:5px!important}
.boleta-supermercado .pie small{display:block!important;font-size:9px!important;line-height:1.35!important;margin-top:10px!important}
@media screen{.boleta-supermercado{box-shadow:0 1px 8px #0002!important}}
@media print{html,body{margin:0!important;padding:0!important;background:#fff!important;width:80mm!important}.boleta-supermercado{margin:0!important;width:80mm!important;max-width:80mm!important;box-shadow:none!important}.boleta-supermercado .item{break-inside:avoid!important}}
`;

function obtenerPedido(){try{return JSON.parse(localStorage.getItem('ultimoPedido')||'null')}catch(_){return null}}
function actualizarVista(p){
 const previo=document.getElementById('ticket');
 if(!previo)return;
 previo.className='ticket-vista-supermercado';
 previo.innerHTML='<style>'+estilo+'</style><div class="boleta-supermercado">'+contenido(p)+'</div>';
 previo.style.display='block';
}
window.vistaPreviaBoletaSupermercado=function(){
 let p=obtenerPedido();
 // Vista preliminar, sin guardar aún un pedido ni duplicar registros
 if(new URLSearchParams(location.search).get('desde')==='escaner'){
   try{const list=JSON.parse(sessionStorage.getItem('maitePagoEscaneadoV1')||'[]');
     if(Array.isArray(list)&&list.length){p={numero:'VISTA PREVIA',fechaCreacion:Date.now(),items:list,
       cliente:document.getElementById('cliente')?.value||'',dniCliente:document.getElementById('dniCliente')?.value||'',
       telefonoCliente:document.getElementById('telefonoCliente')?.value||'',direccionCliente:document.getElementById('direccionCliente')?.value||'',
       mensajePedido:document.getElementById('mensajePedido')?.value||'',metodoPago:document.querySelector('[name="metodoPagoPro"]:checked')?.value||'Efectivo'};}
   }catch(_){/* opcional */}
 } else {
   try{const x=JSON.parse(localStorage.getItem('productoActualPedido')||'null');
     if(x){p={numero:'VISTA PREVIA',fechaCreacion:Date.now(),producto:x.nombre,codigo:x.codigo,precio:x.precio,cantidad:1,
       cliente:document.getElementById('cliente')?.value||'',dniCliente:document.getElementById('dniCliente')?.value||'',
       telefonoCliente:document.getElementById('telefonoCliente')?.value||'',direccionCliente:document.getElementById('direccionCliente')?.value||'',
       mensajePedido:document.getElementById('mensajePedido')?.value||'',metodoPago:document.querySelector('[name="metodoPagoPro"]:checked')?.value||'Efectivo'};}
   }catch(_){/* opcional */}
 }
 if(!p){alert('Selecciona primero un producto para ver su boleta.');return;}
 actualizarVista(p);
 document.getElementById('ticket')?.scrollIntoView({behavior:'smooth',block:'start'});
};
// Documento A4 comercial independiente del ticket de supermercado.
// Se utiliza exclusivamente con el botón PDF; no altera las rutas de PC ni Phone.
function contenidoDocumento(p){
 const items=productos(p), total=items.reduce((s,x)=>s+x.cantidad*x.precio,0);
 const tienda=localStorage.getItem('nombreTienda')||'MI TIENDA';
 const telefono=localStorage.getItem('contactoTienda')||'';
 const logo=localStorage.getItem('logoTienda')||'';
 const logoSeguro=/^(data:image\/(?:png|jpeg|gif|webp);base64,|https:\/\/)/i.test(logo)?logo:'';
 const fecha=p.fechaCreacion?new Date(p.fechaCreacion):new Date();
 const fechaTexto=isNaN(fecha.getTime())?new Date().toLocaleDateString('es-PE'):fecha.toLocaleDateString('es-PE');
 const numero=numeroVisibleBoleta(p.numero);
 const detalle=items.map((x,i)=>`<tr><td class="numero">${i+1}</td><td class="detalle">${escapeHtml(x.nombre)}${x.codigo?`<small>Código: ${escapeHtml(x.codigo)}</small>`:''}</td><td class="cant">${x.cantidad}</td><td class="importe">${soles(x.precio)}</td><td class="importe">${soles(x.cantidad*x.precio)}</td></tr>`).join('');
 return `<section class="documento-comercial">
 <header class="comercio-head"><div class="empresa">${logoSeguro?`<img src="${escapeHtml(logoSeguro)}" alt="Logo">`:''}<div><h1>${escapeHtml(tienda)}</h1><div class="info-empresa">${telefono?'Teléfono: '+escapeHtml(telefono):'Registro de venta'}</div></div></div><div class="folio"><strong>BOLETA</strong><span>Boleta N.º ${escapeHtml(numero)}</span><small>Fecha: ${escapeHtml(fechaTexto)}</small></div></header>
 <div class="aviso">Documento comercial de pedido / venta. No constituye comprobante de pago electrónico autorizado por SUNAT.</div>
 <section class="datos-cliente"><h2>DATOS DEL CLIENTE</h2><div class="campos"><div><b>Cliente:</b> ${escapeHtml(p.cliente||'Público general')}</div><div><b>DNI / Documento:</b> ${escapeHtml(p.dniCliente||'—')}</div><div><b>Teléfono:</b> ${escapeHtml(p.telefonoCliente||'—')}</div><div class="ancho"><b>Dirección:</b> ${escapeHtml(p.direccionCliente||'—')}</div></div></section>
 <section class="detalle-venta"><h2>DETALLE DE PRODUCTOS</h2><table><thead><tr><th>Ítem</th><th>Descripción / código</th><th>Cant.</th><th>P. unitario</th><th>Importe</th></tr></thead><tbody>${detalle}</tbody></table></section>
 <section class="documento-footer"><div class="auxiliar"><p><b>Productos:</b> ${items.length}</p><p><b>Unidades:</b> ${items.reduce((s,x)=>s+x.cantidad,0)}</p>${p.metodoPago?`<p><b>Forma de pago:</b> ${escapeHtml(p.metodoPago)}</p>`:''}</div><div class="total-comercial"><span>TOTAL A PAGAR</span><strong>${soles(total)}</strong></div></section>
 ${p.mensajePedido?`<section class="observaciones"><b>Observaciones:</b><p>${escapeHtml(p.mensajePedido)}</p></section>`:''}
 <footer>Gracias por su compra · ${escapeHtml(tienda)}</footer>
 </section>`;
}
const estiloDocumento=`
 @page{size:A4 portrait;margin:15mm}
 html,body{margin:0;padding:0;background:#fff;color:#20252a;font-family:Arial,Helvetica,sans-serif}
 .documento-comercial{box-sizing:border-box;width:100%;max-width:180mm;margin:0 auto;color:#20252a;font-size:11px;line-height:1.45}
 .comercio-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:3px solid #1c3b52;padding-bottom:17px;margin-bottom:14px}
 .empresa{display:flex;align-items:center;gap:12px;max-width:60%}.empresa img{width:auto;max-width:50px;max-height:50px;object-fit:contain}
 .empresa h1{font-size:20px;margin:0 0 5px;color:#162e42;overflow-wrap:anywhere}.info-empresa{color:#4c555d;font-size:11px}
 .folio{text-align:right;min-width:160px}.folio strong{display:block;color:#1c3b52;font-size:13px}.folio span{display:block;font-weight:700;font-size:14px;margin:6px 0}.folio small{font-size:11px}
 .aviso{font-size:9px;color:#5a6168;margin:8px 0 18px;padding:7px 9px;background:#f1f4f6;border-left:3px solid #9aa9b4}
 h2{font-size:11px;letter-spacing:.6px;color:#193a52;margin:0 0 10px;border-bottom:1px solid #cdd5dc;padding-bottom:6px}
 .datos-cliente{margin-bottom:23px}.campos{display:grid;grid-template-columns:1fr 1fr;gap:9px 18px}.campos .ancho{grid-column:1/-1}.campos b{color:#293846}
 .detalle-venta{margin:0 0 18px}.detalle-venta table{width:100%;border-collapse:collapse;table-layout:fixed}
 .detalle-venta th{background:#23465e;color:white;text-align:left;font-size:10px;padding:10px 7px}.detalle-venta td{padding:9px 7px;border-bottom:1px solid #dce3e8;vertical-align:top;overflow-wrap:anywhere}
 .detalle-venta th:nth-child(1){width:7%}.detalle-venta th:nth-child(2){width:45%}.detalle-venta th:nth-child(3){width:9%}.detalle-venta th:nth-child(4){width:18%}.detalle-venta th:nth-child(5){width:21%}
 .detalle-venta .numero,.detalle-venta .cant{text-align:center}.detalle-venta .importe{text-align:right;white-space:nowrap}.detalle-venta th:nth-child(n+3){text-align:right}
 .detalle-venta td small{display:block;color:#707982;margin-top:3px;font-size:9px}
 .detalle-venta tr{page-break-inside:avoid;break-inside:avoid}.detalle-venta thead{display:table-header-group}
 .documento-footer{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin:12px 0 20px}.auxiliar p{margin:0 0 5px;color:#444}.total-comercial{min-width:210px;display:flex;justify-content:space-between;gap:16px;background:#e9eff3;border-top:2px solid #23465e;padding:13px;font-size:12px;font-weight:700}.total-comercial strong{font-size:16px;color:#172e40;white-space:nowrap}
 .observaciones{margin:22px 0;padding:10px 12px;background:#f4f6f7}.observaciones p{margin:5px 0;white-space:pre-wrap;overflow-wrap:anywhere}
 .documento-comercial footer{text-align:center;color:#666;border-top:1px solid #ccd3d9;padding-top:14px;margin-top:32px;font-size:10px}
 @media print{.documento-comercial{max-width:none}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
`;
window.mostrarBoletaPDFComercial=function(pedidoElegido=null){
 const p=pedidoElegido||obtenerPedido();if(!p){alert('Primero selecciona productos para generar la boleta.');return;}
 const v=window.open('','_blank','width=900,height=900');
 if(!v){alert('Permite ventanas emergentes para guardar la boleta en PDF.');return;}
 v.document.open();v.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Boleta ${escapeHtml(numeroVisibleBoleta(p.numero))}</title><style>${estiloDocumento}</style></head><body>${contenidoDocumento(p)}</body></html>`);v.document.close();
 const abrirImpresion=async()=>{await Promise.all(Array.from(v.document.images).map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.onload=resolve;img.onerror=resolve;setTimeout(resolve,2000)})));v.focus();v.print();if(typeof window.mostrarDialogoFinVenta==='function')window.mostrarDialogoFinVenta();};
 if(v.document.readyState==='complete')abrirImpresion();else v.addEventListener('load',abrirImpresion,{once:true});
};

// Impresión A4 para PC/PDF, o papel continuo de 80 mm para impresoras térmicas.
// Ambas opciones utilizan el mismo HTML de la vista previa.
window.mostrarVistaBoletaHistorica=function(p){ if(p) actualizarVista(p); };
window.mostrarBoletaSupermercado=function(modo='termica', pedidoElegido=null){
 const p=pedidoElegido||obtenerPedido();
 if(!p){alert('Primero selecciona productos para generar la boleta.');return;}
 actualizarVista(p);
 const termica=(modo==='termica');
 const v=window.open('','_blank','width=560,height=850');
 if(!v){alert('El navegador bloqueó la ventana de impresión. Permite ventanas emergentes e inténtalo nuevamente.');return;}
 const html=contenido(p);
 // En PC el papel predeterminado es A4 para que un ticket corto no se reparta en hojas.
 // Para térmica se fija el tamaño del rollo a la altura real del contenido.
 const cssPagina = termica
  ? '@page{size:80mm 200mm;margin:0}'
  : '@page{size:A4 portrait;margin:12mm}';
 // Se quita el @page de 80 mm del estilo compartido: entraba en conflicto con A4.
 const estiloVentana=estilo.replace('@page{size:80mm auto;margin:0}', '')
  .replace('@media print{html,body{margin:0!important;padding:0!important;background:#fff!important;width:80mm!important}.boleta-supermercado{margin:0!important;width:80mm!important;max-width:80mm!important;box-shadow:none!important}.boleta-supermercado .item{break-inside:avoid!important}}','');
 const estiloTermica = termica ? `
  /* Impresora de recibos: ancho físico fijo, sin transform ni scale */
  @media screen,print {
    html,body{width:80mm!important;min-width:80mm!important;max-width:80mm!important;height:auto!important;overflow:visible!important;margin:0!important;padding:0!important}
    #hoja-impresion{width:80mm!important;min-width:80mm!important;max-width:80mm!important;margin:0!important;padding:0!important;transform:none!important;zoom:1!important}
    #hoja-impresion .boleta-supermercado{width:80mm!important;min-width:80mm!important;max-width:80mm!important;padding:3mm 4mm!important;margin:0!important;font-size:13px!important;transform:none!important;zoom:1!important}
    #hoja-impresion .nombre-tienda{font-size:21px!important}
    #hoja-impresion .tipo{font-size:15px!important}
    #hoja-impresion .datos-ticket .dato,#hoja-impresion .linea-producto,#hoja-impresion .resumen{font-size:13px!important}
    #hoja-impresion .producto{font-size:14px!important}
    #hoja-impresion .total{font-size:14px!important}
  }
  @media print {
    html,body{print-color-adjust:exact!important;-webkit-print-color-adjust:exact!important}
    #hoja-impresion .boleta-supermercado .item{break-inside:avoid!important;page-break-inside:avoid!important}
  }` : '';
 const estiloA4 = termica ? '' : `
  /* Vista para hoja A4: vertical y a tamaño legible, no miniaturizada. */
  @media screen, print {
   #hoja-impresion {width:120mm!important;max-width:120mm!important;margin:0 auto!important}
   #hoja-impresion .boleta-supermercado {width:120mm!important;max-width:120mm!important;padding:8mm!important;font-size:16px!important;line-height:1.45!important}
   #hoja-impresion .nombre-tienda{font-size:28px!important}
   #hoja-impresion .logo-ticket{max-width:21mm!important;max-height:21mm!important}
   #hoja-impresion .contacto,#hoja-impresion .subtipo,#hoja-impresion .codigo,#hoja-impresion .titulos,#hoja-impresion .pie{font-size:14px!important}
   #hoja-impresion .tipo{font-size:20px!important}
   #hoja-impresion .datos-ticket .dato,#hoja-impresion .linea-producto,#hoja-impresion .resumen{font-size:16px!important}
   #hoja-impresion .producto{font-size:17px!important}
   #hoja-impresion .total{font-size:19px!important}
   #hoja-impresion .pie strong{font-size:16px!important}
   #hoja-impresion .pie small{font-size:11px!important}
  }
  @media print {
   html,body{width:auto!important;max-width:none!important;margin:0!important;padding:0!important;overflow:visible!important}
   #hoja-impresion{break-inside:auto!important;page-break-inside:auto!important}
   .boleta-supermercado{break-inside:auto!important;page-break-inside:auto!important}
   .boleta-supermercado .item{break-inside:avoid!important}
  }`;
 v.document.open();
 v.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Boleta - ${escapeHtml(p.numero||'Pedido')}</title><style>${estiloVentana}
 ${cssPagina}
 html,body{background:#fff!important;margin:0!important;padding:0!important}
 #hoja-impresion{width:80mm;max-width:100%;margin:0 auto;display:block}
 #hoja-impresion .boleta-supermercado{width:80mm!important;max-width:80mm!important;margin:0 auto!important;box-shadow:none!important}
 ${estiloA4}
 ${estiloTermica}
 </style></head><body><div id="hoja-impresion"><main class="boleta-supermercado">${html}</main></div></body></html>`);
 v.document.close();
 const imprimir=async()=>{
  try{await Promise.all(Array.from(v.document.images).map(i=> i.complete?Promise.resolve():new Promise(resolve=>{i.addEventListener('load',resolve,{once:true});i.addEventListener('error',resolve,{once:true});setTimeout(resolve,1800)})));}catch(_){}
  const recibo=v.document.querySelector('.boleta-supermercado');
  if(!recibo)return;
  if(termica){
   // Ajustar la longitud del rollo sin alterar el ancho de 80 mm.
   const altoMm=Math.max(100,Math.ceil((recibo.scrollHeight/96*25.4)+12));
   const regla=v.document.createElement('style');
   regla.textContent='@page{size:80mm '+altoMm+'mm;margin:0}';
   v.document.head.appendChild(regla);
  }
  // En A4 NO se usa transform:scale: producía un ticket diminuto.
  v.focus();v.print();
  if(typeof window.mostrarDialogoFinVenta==='function')window.mostrarDialogoFinVenta();
 };
 if(v.document.readyState==='complete')imprimir();
 else v.addEventListener('load',imprimir,{once:true});
};
})();
