// Historial de ventas del POS. Lee los pedidos guardados sin duplicarlos al reimprimir.
(()=>{'use strict';
const $=id=>document.getElementById(id);
const soles=n=>'S/ '+(Number(n)||0).toFixed(2);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fechaLocal=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
let pedidos=[], seleccion='dia';
function fechaVenta(p){
 const t=Number(p.fechaCreacion);
 if(t>0&&Number.isFinite(t)){const d=new Date(t);if(!isNaN(d))return fechaLocal(d);}
 const s=String(p.fechaPedido||'').trim();
 let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
 if(m)return [m[1],m[2].padStart(2,'0'),m[3].padStart(2,'0')].join('-');
 m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
 if(m)return [m[3],m[2].padStart(2,'0'),m[1].padStart(2,'0')].join('-');
 return '';
}
function total(p){if(Number.isFinite(Number(p.total))&&p.total!==undefined&&p.total!==null)return Number(p.total);if(Array.isArray(p.items))return p.items.reduce((s,x)=>s+Number(x.precio||0)*Number(x.cantidad||1),0);return Number(p.precio||0)*Number(p.cantidad||1);}
function articulos(p){return Array.isArray(p.items)&&p.items.length?p.items.reduce((s,x)=>s+Number(x.cantidad||1),0):Number(p.cantidad||1);}
function almacen(){try{const a=JSON.parse(localStorage.getItem('pedidos')||'[]');return Array.isArray(a)?a:[]}catch{return []}}
function lista(){
 const f=$('fechaVentas').value, q=$('buscadorPedidos').value.trim().toLowerCase();
 const vistos=new Set();
 const hoy=fechaLocal(new Date());const ayer=new Date();ayer.setDate(ayer.getDate()-1);const fechaAyer=fechaLocal(ayer);const siete=new Date();siete.setDate(siete.getDate()-6);const desde=fechaLocal(siete);
 return pedidos.filter(p=>{
  const key=String(p.numero||'')+'|'+String(p.fechaCreacion||'');
  if(vistos.has(key))return false;vistos.add(key);
  return (seleccion==='todas'||seleccion==='siete'&&fechaVenta(p)>=desde&&fechaVenta(p)<=hoy||seleccion==='dia'&&fechaVenta(p)===f) && (!q||[p.numero,p.cliente,p.dniCliente,p.producto,p.codigo,...(p.items||[]).flatMap(x=>[x.nombre,x.codigo])].some(x=>String(x||'').toLowerCase().includes(q)));
 }).sort((a,b)=>Number(b.fechaCreacion||0)-Number(a.fechaCreacion||0));
}
function render(){
 const ventas=lista();
 $('cantidadVentas').textContent=ventas.length;
 $('totalVentas').textContent=soles(ventas.reduce((s,p)=>s+total(p),0));
 $('articulosVentas').textContent=ventas.reduce((s,p)=>s+articulos(p),0);
 $('promedioVentas').textContent=soles(ventas.length?ventas.reduce((s,p)=>s+total(p),0)/ventas.length:0);
 $('tituloVentas').textContent=seleccion==='todas'?'Todas las ventas':seleccion==='siete'?'Ventas de los últimos 7 días':('Ventas del '+($('fechaVentas').value.split('-').reverse().join('/')));
 $('listaPedidos').replaceChildren();
 if(!ventas.length){$('listaPedidos').innerHTML='<div class="ventas-vacio">📭 No hay ventas registradas para esta búsqueda.</div>';return;}
 ventas.forEach(p=>{
  const original=pedidos.indexOf(p);
  const fecha=p.fechaCreacion?new Date(Number(p.fechaCreacion)).toLocaleString('es-PE'):p.fechaPedido||'Fecha sin registrar';
  const nombres=Array.isArray(p.items)&&p.items.length?p.items.map(x=>`${esc(x.nombre)} <small>(${Number(x.cantidad)||1} × ${soles(x.precio)})</small>`).join('<br>'):esc(p.producto||'Producto');
  const el=document.createElement('article');el.className='ventas-registro';
  const pendiente=!!window.POSV25?.pendientes?.()?.[p.numero] || p.sincronizacionPOS==='pendiente';
  const sincronizacion=pendiente?'<div class="pos-v25-venta-pendiente">⚠ Pendiente de confirmar en Firebase</div>':'';
  el.innerHTML=`<div class="ventas-registro-superior"><div><strong>${esc(p.numero||'Venta sin número')}</strong><small>${esc(fecha)}</small></div><strong class="ventas-monto">${soles(total(p))}</strong></div>${sincronizacion}<div class="ventas-detalles"><div><b>Cliente:</b> ${esc(p.cliente||'Público general')}</div><div><b>DNI:</b> ${esc(p.dniCliente||'—')}</div><div><b>Productos:</b><div class="ventas-productos">${nombres}</div></div><div><b>Artículos:</b> ${articulos(p)}</div><div><b>Pago:</b> ${esc(p.metodoPago||'No registrado')}</div></div><div class="ventas-botones"><button data-accion="ver" data-i="${original}" type="button">👁 Vista previa</button><button data-accion="pc" data-i="${original}" type="button">🧾 PC / 80 mm</button><button data-accion="phone" data-i="${original}" type="button">📱 Phone</button><button data-accion="pdf" data-i="${original}" type="button">📄 PDF</button></div>`;
  $('listaPedidos').append(el);
 });
}
async function actualizar(){
 $('estadoVentas').textContent='Actualizando…';
 // Se consulta Firebase si está disponible, sin borrar los datos guardados localmente.
 const locales=almacen();pedidos=locales;render();
 try{
  if(typeof cloudDB!=='undefined'){
   const snap=await cloudDB.collection('pedidos').get();
   const remoto=[];snap.forEach(d=>remoto.push(d.data()));
   const porId=new Map();
   [...locales,...remoto].forEach(p=>{if(p&&typeof p==='object')porId.set(String(p.numero||'')+'|'+String(p.fechaCreacion||''),p)});
   pedidos=[...porId.values()];
   localStorage.setItem('pedidos',JSON.stringify(pedidos));
  }
  $('estadoVentas').textContent='Historial actualizado';
 }catch(e){$('estadoVentas').textContent='Mostrando ventas guardadas en este equipo';}
 render();window.dispatchEvent(new Event('pos-ventas-actualizadas'));
}
async function permiso(){
 if(window.POSAcceso?.verificarAccesoVentas){
  const ok=await window.POSAcceso.verificarAccesoVentas();
  if(ok)$('panelVentas').hidden=false;
  return ok;
 }
 const clave=localStorage.getItem('claveAdmin')||'1234';
 const escrito=prompt('Ingrese contraseña de administrador:');
 if(escrito===null||escrito!==clave){if(escrito!==null)alert('Contraseña incorrecta');location.replace('inicio.html');return false;}
 $('panelVentas').hidden=false;return true;
}
$('listaPedidos').addEventListener('click',e=>{
 const b=e.target.closest('button[data-accion]');if(!b)return;
 const p=pedidos[Number(b.dataset.i)];if(!p)return;
 if(b.dataset.accion==='ver'){
  window.mostrarVistaBoletaHistorica(p);$('ticket').scrollIntoView({behavior:'smooth',block:'start'});
 }else if(b.dataset.accion==='phone'){
  window.imprimirTicketCanvas(p);
 }else if(b.dataset.accion==='pdf'){
  // Abre diálogo del navegador con opción Guardar como PDF.
  window.mostrarBoletaSupermercado('a4',p);
 }else{
  window.mostrarBoletaSupermercado('termica',p);
 }
});
$('fechaVentas').addEventListener('change',()=>{seleccion='dia';render()});
$('buscadorPedidos').addEventListener('input',render);
$('ventasHoy').addEventListener('click',()=>{seleccion='dia';$('fechaVentas').value=fechaLocal(new Date());render()});
$('ventasAyer').addEventListener('click',()=>{seleccion='dia';const d=new Date();d.setDate(d.getDate()-1);$('fechaVentas').value=fechaLocal(d);render()});
$('ventasUltimos7').addEventListener('click',()=>{seleccion='siete';render()});
$('ventasTodas').addEventListener('click',()=>{seleccion='todas';render()});
$('actualizarVentas').addEventListener('click',actualizar);
$('fechaVentas').value=fechaLocal(new Date());
window.POSVentasHistorial={obtenerPedidos:()=>pedidos.slice(),fechaVenta,total,articulos};
(async()=>{ if(await permiso()) actualizar(); })();
})();
