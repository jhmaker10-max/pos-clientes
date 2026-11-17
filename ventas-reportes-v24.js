/* POS Profesional 2.4: reportes de solo lectura basados en el historial ya cargado. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const money=n=>'S/ '+Number(n||0).toFixed(2);
 const dateKey=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
 const hist=()=>window.POSVentasHistorial;
 const items=p=>Array.isArray(p.items)&&p.items.length?p.items:[{nombre:p.producto||'Producto',codigo:p.codigo||'',cantidad:p.cantidad||1}];
 const getOrders=()=>hist()?.obtenerPedidos()||[];
 function periodo(){
  const type=$('proPeriodoVentas').value,sel=$('fechaVentas').value||dateKey(new Date());
  if(type==='todas')return {min:'',max:''};
  if(type==='dia')return {min:sel,max:sel};
  if(type==='mes')return {min:sel.slice(0,7)+'-01',max:sel.slice(0,7)+'-31'};
  const d=new Date(sel+'T12:00:00');if(!Number.isFinite(d.getTime()))return {min:sel,max:sel};
  d.setDate(d.getDate()-(d.getDay()+6)%7);const min=dateKey(d);d.setDate(d.getDate()+6);return {min,max:dateKey(d)};
 }
 function filtered(){const {min,max}=periodo();return getOrders().filter(p=>{const f=hist().fechaVenta(p);return f&&(!min||f>=min&&f<=max)});}
 function render(){
  if(!hist()||!$('proReporteVentas'))return;
  const orders=filtered(),sum=orders.reduce((a,p)=>a+hist().total(p),0);
  $('proReporteVentas').textContent=orders.length;$('proReporteTotal').textContent=money(sum);$('proReportePromedio').textContent=money(orders.length?sum/orders.length:0);
  const methods=new Map(),products=new Map(),daily=new Map();
  for(const p of orders){
   const value=hist().total(p),met=String(p.metodoPago||'No registrado').trim()||'No registrado',day=hist().fechaVenta(p);
   methods.set(met,(methods.get(met)||0)+value);daily.set(day,(daily.get(day)||0)+value);
   for(const item of items(p)){const key=String(item.codigo||item.nombre||'').trim()||'Producto',q=Number(item.cantidad)||0;
    const prev=products.get(key)||{nombre:String(item.nombre||'Producto'),unidades:0};prev.unidades+=q;products.set(key,prev)}
  }
  const methodEl=$('proResumenMetodos');methodEl.replaceChildren();
  if(!methods.size){const empty=document.createElement('p');empty.textContent='Sin cobros en este periodo.';methodEl.append(empty)}
  [...methods.entries()].sort((a,b)=>b[1]-a[1]).forEach(([name,value])=>{const row=document.createElement('div');row.className='ventas-pro-metodo';const label=document.createElement('span');label.textContent=name;const amount=document.createElement('strong');amount.textContent=money(value);row.append(label,amount);methodEl.append(row)});
  const top=$('proTopProductos');top.replaceChildren();
  if(!products.size){top.textContent='Aún no hay productos vendidos en este periodo.'}
  [...products.values()].sort((a,b)=>b.unidades-a.unidades).slice(0,5).forEach((x,i)=>{const row=document.createElement('div');row.className='ventas-pro-top-item';const name=document.createElement('span');name.textContent=(i+1)+'. '+x.nombre;const qty=document.createElement('strong');qty.textContent=x.unidades+' und.';row.append(name,qty);top.append(row)});
  const graph=$('proGraficoVentas');graph.replaceChildren();const dates=[...daily].sort((a,b)=>a[0].localeCompare(b[0])).slice(-10);graph.setAttribute('aria-label','Ingresos por fecha: '+dates.map(x=>x[0]+' '+money(x[1])).join('; '));
  if(!dates.length){graph.textContent='Sin ventas para mostrar en el gráfico.';return}
  const max=Math.max(1,...dates.map(x=>x[1]));for(const [day,value] of dates){const item=document.createElement('div');item.className='ventas-pro-bar';item.title=day+' · '+money(value);const amount=document.createElement('small');amount.textContent=money(value);const bar=document.createElement('span');bar.style.height=Math.max(5,Math.round(value/max*100))+'%';const label=document.createElement('small');label.textContent=day.slice(5);item.append(amount,bar,label);graph.append(item)}
 }
 function csvSafe(value){let s=String(value??'');if(/^[\s]*[=+@-]/.test(s)&&!/^-[\d.,]+$/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}
 function downloadCSV(){const rows=[['Fecha','Pedido','Cliente','DNI','Método','Total','Productos']];for(const p of filtered())rows.push([hist().fechaVenta(p),p.numero||'',p.cliente||'',p.dniCliente||'',p.metodoPago||'No registrado',hist().total(p).toFixed(2),items(p).map(x=>String(x.nombre||'Producto')+' x'+Number(x.cantidad||1)).join(' / ')]);
  const blob=new Blob(['\ufeff'+rows.map(r=>r.map(csvSafe).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ventas_'+dateKey(new Date())+'.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
 }
 const htmlEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function printReport(){const orders=filtered(),total=orders.reduce((a,p)=>a+hist().total(p),0),rows=orders.map(p=>'<tr><td>'+htmlEsc(hist().fechaVenta(p))+'</td><td>'+htmlEsc(p.numero)+'</td><td>'+htmlEsc(p.metodoPago||'No registrado')+'</td><td>'+money(hist().total(p))+'</td></tr>').join('');
  const win=window.open('','_blank');if(!win){alert('Permite ventanas emergentes para imprimir el reporte.');return}
  win.document.write('<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Reporte de ventas</title><style>body{font:14px Arial,sans-serif;padding:26px;color:#222}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #ddd;padding:10px;text-align:left}h1{font-size:24px}@media print{body{padding:0}}</style></head><body><h1>Reporte de ventas</h1><p>'+orders.length+' ventas · Total '+money(total)+' · Ticket promedio '+money(orders.length?total/orders.length:0)+'</p><table><thead><tr><th>Fecha</th><th>Pedido</th><th>Pago</th><th>Total</th></tr></thead><tbody>'+rows+'</tbody></table></body></html>');win.document.close();win.focus();win.print();
 }
 $('proPeriodoVentas')?.addEventListener('change',render);$('fechaVentas')?.addEventListener('change',render);
 $('proExportarCSV')?.addEventListener('click',downloadCSV);$('proImprimirReporte')?.addEventListener('click',printReport);
 window.addEventListener('pos-ventas-actualizadas',render);render();
})();
