/* POS Profesional 2.0: interfaz, estadísticas y reportes. Módulo adicional;
   no sustituye el guardado de ventas, la impresión ni la lógica del stock. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const money=n=>'S/ '+Number(n||0).toFixed(2);
 const clean=v=>String(v??'');
 const dateKey=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
 const day=p=>{const d=new Date(Number(p.fechaCreacion));if(Number.isFinite(d.getTime())&&Number(p.fechaCreacion)>0)return dateKey(d);const f=clean(p.fechaPedido);const m=f.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);return m?m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'):f.slice(0,10)};
 const sales=()=>{try{const p=JSON.parse(localStorage.getItem('pedidos')||'[]');return Array.isArray(p)?p:[]}catch(_){return []}};
 const total=p=>Number(p.total)||0;
 const products=p=>Array.isArray(p.items)&&p.items.length?p.items:[{nombre:p.producto||'Producto',codigo:p.codigo||'',cantidad:p.cantidad||1,precio:p.precio||0}];
 function inventory(){if(typeof productosVigentesFirebase!=='undefined'&&Array.isArray(productosVigentesFirebase))return productosVigentesFirebase;return Array.isArray(window.catalogoOfflineActual)?window.catalogoOfflineActual:[]}
 const stock=p=>p.stock===undefined||p.stock===null||clean(p.stock).trim()===''?null:(Number.isSafeInteger(Number(p.stock))&&Number(p.stock)>=0?Number(p.stock):null);
 function dashboard(orders){if(!$('resumenProfesional'))return;const p=orders||sales(),today=dateKey(new Date()),items=inventory();const todays=p.filter(x=>day(x)===today);
  $('proVentasHoy').textContent=todays.length; $('proIngresosHoy').textContent=money(todays.reduce((a,x)=>a+total(x),0));$('proStockBajo').textContent=items.filter(x=>stock(x)!==null&&stock(x)<=4).length;
  $('proValorStock').textContent=money(items.reduce((a,x)=>a+(stock(x)||0)*(Number(x.precio)||0),0));
  const bars=$('proMiniBarras');bars.replaceChildren();const data=[];for(let n=6;n>=0;n--){const d=new Date();d.setDate(d.getDate()-n);data.push({date:dateKey(d),label:d.toLocaleDateString('es-PE',{weekday:'short'}),value:p.filter(x=>day(x)===dateKey(d)).reduce((a,x)=>a+total(x),0)})}
  const max=Math.max(1,...data.map(x=>x.value));data.forEach(x=>{const bar=document.createElement('div');bar.className='pos-pro-bar';bar.title=x.date+' · '+money(x.value);const fill=document.createElement('span');fill.style.height=Math.max(5,Math.round(x.value/max*100))+'%';const label=document.createElement('small');label.textContent=x.label;bar.append(fill,label);bars.append(bar)})
 }
 async function movements(){const el=$('proListaMovimientos');if(!el)return;el.textContent='Cargando movimientos…';if(typeof cloudDB==='undefined'){el.textContent='Se requiere conexión con Firebase para consultar movimientos.';return}
  try{const snap=await cloudDB.collection('movimientos_stock').orderBy('fecha','desc').limit(30).get();el.replaceChildren();if(snap.empty){el.textContent='Aún no hay movimientos registrados.';return}snap.forEach(doc=>{const m=doc.data();const row=document.createElement('div');row.className='pos-pro-movimiento';const title=document.createElement('strong');title.textContent=({venta:'Venta',entrada:'Entrada',salida:'Salida',ajuste:'Ajuste'}[m.tipo]||'Movimiento')+' · '+(m.producto||m.numero||'Inventario');const desc=document.createElement('small');const date=new Date(Number(m.fecha||0));desc.textContent=(Number.isFinite(date.getTime())?date.toLocaleString('es-PE'):'')+' · '+(m.cantidad!==undefined?m.cantidad+' unidades':'')+(m.nuevo!==undefined?' · Quedan: '+m.nuevo:'');row.append(title,desc);el.append(row)})}catch(err){console.warn(err);el.textContent='No se pudieron consultar los movimientos. Revisa la conexión o permisos de Firebase.'}
 }
 function theme(name){const presets={claro:['#f6f7fb','#334155','#ffffff','#475569','#cbd5e1','#dfe5ed','#f0f4f9','#334155'],elegante:['#f8f5f0','#574a40','#ffffff','#65584f','#c1b7aa','#ded2c5','#f1eae1','#574a40'],noche:['#111827','#f3f4f6','#1f2937','#d1d5db','#64748b','#455268','#293548','#f3f4f6'],original:['#fff7fb','#d96c9d','#ffffff','#4d3040','#d8c2ce','#e7d8e1','#f8eef4','#303646']};const v=presets[name];if(!v)return;
  ['colorFondo','colorPrincipal','colorProducto','colorDatos','colorContorno','colorBordes','colorSuave','colorNombreProducto'].forEach((id,i)=>{const input=$(id);if(input)input.value=v[i]});if(typeof previsualizarColores==='function')previsualizarColores()
 }
 function categories(){const sel=$('categoriaInicioPro');if(!sel)return;const current=sel.value;const cats=[...new Set(inventory().map(p=>clean(p.categoria||'General').trim()||'General'))].sort((a,b)=>a.localeCompare(b,'es'));
  sel.replaceChildren();const defaultOption=document.createElement('option');defaultOption.value='todas';defaultOption.textContent='Todas las categorías';sel.append(defaultOption);cats.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;sel.append(o)});sel.value=cats.includes(current)||current==='todas'?current:'todas';if(typeof buscarInicio==='function' && (sel.value!=='todas'||$('buscadorInicio')?.value))buscarInicio();
 }
 function paymentTotal(){const t=$('totalPedido');if(!t)return 0;const match=t.textContent.match(/(?:S\/?\.?\s*)?([\d.,]+)\s*$/);return match?Number(match[1].replace(/,/g,''))||0:0}
 function updatePayment(){const wrap=$('proCalculoVuelto');if(!wrap)return;const selected=document.querySelector('input[name="metodoPagoPro"]:checked')?.value||'Efectivo';wrap.hidden=selected!=='Efectivo';const paid=Number($('proRecibido')?.value||0);const diff=Math.max(0,paid-paymentTotal());$('proVuelto').textContent=money(diff)}
 window.obtenerPagoPOSProfesional=function(){const method=document.querySelector('input[name="metodoPagoPro"]:checked')?.value||'Efectivo';const received=method==='Efectivo'&&$('proRecibido')?.value!==''?Math.max(0,Number($('proRecibido')?.value)||0):null;return {metodoPago:method,montoRecibido:received,vuelto:received===null?null:Math.max(0,received-paymentTotal())}};
 // Reportes extraídos de ventas locales / remotas. Mantienen separado el historial y la reimpresión.
 let reportOrders=[];
 async function refreshReports(){if(!$('proPeriodoVentas'))return;reportOrders=sales();renderReports();if(typeof cloudDB!=='undefined'){try{const snap=await cloudDB.collection('pedidos').get();const m=new Map();for(const p of reportOrders)m.set(clean(p.numero)+'|'+clean(p.fechaCreacion),p);snap.forEach(d=>{const p=d.data();m.set(clean(p.numero)+'|'+clean(p.fechaCreacion),p)});reportOrders=[...m.values()];renderReports()}catch(e){console.warn('Reporte remoto no disponible',e)}}}
 function reportFiltered(){const type=$('proPeriodoVentas')?.value||'dia';const sel=$('fechaVentas')?.value||dateKey(new Date());if(type==='todas')return reportOrders;
  const target=new Date(sel+'T12:00:00');if(!Number.isFinite(target.getTime()))return [];
  if(type==='dia')return reportOrders.filter(p=>day(p)===sel);
  if(type==='mes')return reportOrders.filter(p=>day(p).slice(0,7)===sel.slice(0,7));
  const dow=(target.getDay()+6)%7;target.setDate(target.getDate()-dow);const start=dateKey(target);target.setDate(target.getDate()+6);const end=dateKey(target);return reportOrders.filter(p=>day(p)>=start&&day(p)<=end)
 }
 function renderReports(){if(!$('proResumenMetodos'))return;const selected=reportFiltered();const values=new Map();const top=new Map();let units=0;
  for(const p of selected){const method=clean(p.metodoPago||'Sin registrar');values.set(method,(values.get(method)||0)+total(p));for(const x of products(p)){const code=clean(x.codigo||x.nombre),q=Number(x.cantidad)||0;units+=q;const row=top.get(code)||{name:clean(x.nombre),quantity:0};row.quantity+=q;top.set(code,row)}}
  const pay=$('proResumenMetodos');pay.replaceChildren();const head=document.createElement('strong');head.textContent='Cobros por método · '+selected.length+' ventas · '+money(selected.reduce((s,p)=>s+total(p),0));pay.append(head);for(const [method,value] of values){const badge=document.createElement('span');badge.textContent=method+': '+money(value);pay.append(badge)}
  const pTop=$('proTopProductos');pTop.replaceChildren();const h=document.createElement('strong');h.textContent='Productos más vendidos · '+units+' unidades';pTop.append(h);[...top.values()].sort((a,b)=>b.quantity-a.quantity).slice(0,5).forEach(x=>{const b=document.createElement('span');b.textContent=x.name+': '+x.quantity;pTop.append(b)})
 }
 function exportCSV(){const rows=[['Fecha','Pedido','Cliente','DNI','Método de pago','Total','Productos']];for(const p of reportFiltered())rows.push([day(p),p.numero||'',p.cliente||'',p.dniCliente||'',p.metodoPago||'Sin registrar',total(p).toFixed(2),products(p).map(x=>x.nombre+' x'+x.cantidad).join(' / ')]);
  // Evitar fórmulas al abrir archivos CSV en Excel.
  const safe=x=>{let s=clean(x);if(/^[\s]*[=+@-]/.test(s)&&!/^-[\d.,]+$/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
  const blob=new Blob(['\ufeff'+rows.map(r=>r.map(safe).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='reporte_ventas_'+dateKey(new Date())+'.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)
 }
 function printReport(){const list=reportFiltered(),rows=list.map(p=>'<tr><td>'+escapeHTML(day(p))+'</td><td>'+escapeHTML(p.numero||'')+'</td><td>'+escapeHTML(p.metodoPago||'Sin registrar')+'</td><td>'+money(total(p))+'</td></tr>').join('');const win=window.open('','_blank');if(!win){alert('Permite las ventanas emergentes para imprimir el reporte.');return}win.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Reporte de ventas</title><style>body{font:14px Arial;padding:25px}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #ccc;text-align:left;padding:9px}</style></head><body><h1>Reporte de ventas</h1><p>Total: '+money(list.reduce((s,p)=>s+total(p),0))+' · '+list.length+' ventas</p><table><tr><th>Fecha</th><th>Pedido</th><th>Pago</th><th>Total</th></tr>'+rows+'</table></body></html>');win.document.close();win.focus();win.print()}
 function escapeHTML(v){return clean(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
 document.addEventListener('DOMContentLoaded',()=>{
  if($('categoriaInicioPro')){categories();window.addEventListener('pos-catalogo-actualizado',categories)}
  if($('resumenProfesional')){
   dashboard();
   let updating=false;
   async function refreshDashboard(){
    if(updating)return;
    updating=true;
    const button=$('actualizarDashboardPro');if(button)button.disabled=true;
    try{
     if(typeof cloudDB==='undefined')return;
     const snap=await cloudDB.collection('pedidos').get();
     const all=new Map();
     sales().forEach((p,i)=>all.set(clean(p.numero)||'local-'+i,p));
     snap.forEach(doc=>{const p=doc.data();all.set(clean(p.numero)||'remoto-'+doc.id,p)});
     dashboard([...all.values()]);
    }catch(e){console.warn('No se pudo consultar el resumen remoto; se muestran los datos locales.',e)}
    finally{updating=false;if(button)button.disabled=false;}
   }
   $('actualizarDashboardPro')?.addEventListener('click',()=>{dashboard();refreshDashboard()});
   window.addEventListener('pos-catalogo-actualizado',()=>{dashboard();refreshDashboard()});
   window.addEventListener('pos-ventas-actualizadas',refreshDashboard);
   refreshDashboard();
   $('proActualizarMovimientos')?.addEventListener('click',movements);
   document.querySelector('[onclick="mostrarApartadoAdmin(\'panelStock\')"]')?.addEventListener('click',movements);
   document.querySelectorAll('[data-tema-pro]').forEach(b=>b.addEventListener('click',()=>theme(b.dataset.temaPro)));
  }
  if($('proPanelPagos')){document.querySelectorAll('[name="metodoPagoPro"]').forEach(b=>b.addEventListener('change',updatePayment));$('proRecibido')?.addEventListener('input',updatePayment);new MutationObserver(updatePayment).observe($('totalPedido'),{childList:true,subtree:true,characterData:true});updatePayment()}
  if($('proPeriodoVentas')){$('proPeriodoVentas').addEventListener('change',renderReports);$('fechaVentas')?.addEventListener('change',renderReports);$('actualizarVentas')?.addEventListener('click',refreshReports);$('proExportarCSV')?.addEventListener('click',exportCSV);$('proImprimirReporte')?.addEventListener('click',printReport);refreshReports()}
 });
})();
