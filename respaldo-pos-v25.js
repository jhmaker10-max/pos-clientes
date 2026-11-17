/* Respaldo completo y restauración no destructiva de registros faltantes. */
(function(){'use strict';
 const $=id=>document.getElementById(id),archivo='pos-respaldo-';
 const estado=msg=>{if($('posRespaldoEstado'))$('posRespaldoEstado').textContent=msg;};
 const fecha=()=>new Date().toISOString().replace(/[:.]/g,'-');
 const leerLocal=(nombre)=>{try{const d=JSON.parse(localStorage.getItem(nombre)||'[]');return Array.isArray(d)?d:[]}catch(_){return []}};
 async function consultar(col){const snap=await cloudDB.collection(col).get({source:'server'});const arr=[];snap.forEach(d=>arr.push({id:d.id,datos:d.data()}));return arr;}
 async function exportar(){
  const boton=$('posExportarRespaldo');boton.disabled=true;estado('Preparando copia de seguridad…');
  try{
   if(typeof cloudDB==='undefined')throw new Error('Almacenamiento no disponible.');
   const [productos,pedidos,movimientos]=await Promise.all(['productos','pedidos','movimientos_stock'].map(consultar));
   const datos={formato:'POS_RESPALDO_V25',fecha:new Date().toISOString(),origen:'Firestore servidor',productos,pedidos,movimientos,
     tienda:localStorage.getItem('nombreTienda')||'',nota:'Contiene información de clientes y ventas. Guarda este archivo de manera privada.'};
   const url=URL.createObjectURL(new Blob([JSON.stringify(datos,null,2)],{type:'application/json'}));
   const a=document.createElement('a');a.href=url;a.download=archivo+fecha()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
   estado('Copia generada: '+productos.length+' productos, '+pedidos.length+' ventas y '+movimientos.length+' movimientos.');
  }catch(e){estado('No se descargó una copia incompleta: '+e.message);}finally{boton.disabled=false;}
 }
 let copia=null;
 async function revisar(){
  copia=null;$('posRestaurarRespaldo').disabled=true;
  const file=$('posArchivoRespaldo')?.files?.[0];if(!file){estado('Selecciona un archivo JSON.');return;}
  if(file.size>25*1024*1024){estado('El respaldo supera 25 MB. Revisa el archivo.');return;}
  try{
   const d=JSON.parse(await file.text());
   if(d.formato!=='POS_RESPALDO_V25'||!Array.isArray(d.productos)||!Array.isArray(d.pedidos)||!Array.isArray(d.movimientos))throw new Error('Archivo no reconocido.');
   const seguro=(xs)=>xs.length<=10000&&xs.every(x=>x&&typeof x.id==='string'&&x.id.length>0&&x.id.length<=500&&x.datos&&typeof x.datos==='object'&&!Array.isArray(x.datos));
   if(!seguro(d.productos)||!seguro(d.pedidos)||!seguro(d.movimientos))throw new Error('Estructura o volumen de datos inválido.');
   copia=d;$('posRestaurarRespaldo').disabled=false;
   estado('Archivo validado: '+d.productos.length+' productos, '+d.pedidos.length+' ventas y '+d.movimientos.length+' movimientos. La recuperación solo agregará registros faltantes, sin sobrescribir ninguno.');
  }catch(e){estado('No se puede utilizar este archivo: '+e.message);}
 }
 async function restaurar(){
  if(!copia||typeof cloudDB==='undefined'){estado('Conéctate a Firebase y selecciona un respaldo válido.');return;}
  if(!confirm('¿Recuperar SOLO registros que falten en almacenamiento local? No se sobrescribirán datos existentes ni se descontará stock. Revisa primero tus copias y los productos.'))return;
  const boton=$('posRestaurarRespaldo');boton.disabled=true;
  let agregados=0,existentes=0;
  try{
   // No se restauran movimientos automáticamente: el stock de los productos en respaldo
   // ya refleja esos movimientos. Importarlos podría causar inconsistencias.
   for(const [col,lista] of [['productos',copia.productos],['pedidos',copia.pedidos]]){
    for(const x of lista){
     const ref=cloudDB.collection(col).doc(x.id);
     const guardado=await cloudDB.runTransaction(async tx=>{
      const doc=await tx.get(ref);if(doc.exists)return false;tx.set(ref,x.datos);return true;
     });
     if(guardado)agregados++;else existentes++;
    }
   }
   estado('Recuperación finalizada: '+agregados+' registros faltantes recuperados; '+existentes+' existentes respetados. Movimientos de stock no reimportados.');
  }catch(e){estado('Recuperación interrumpida después de '+agregados+' registros. Puedes repetirla sin sobrescribir los existentes. '+e.message);}
  finally{boton.disabled=false;}
 }
 document.addEventListener('DOMContentLoaded',()=>{
  $('posExportarRespaldo')?.addEventListener('click',exportar);
  $('posArchivoRespaldo')?.addEventListener('change',revisar);
  $('posRestaurarRespaldo')?.addEventListener('click',restaurar);
 });
})();
