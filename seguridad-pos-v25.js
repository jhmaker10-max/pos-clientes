/* POS 2.5 — confirmación atómica de venta + stock, estado de sincronización.
   No modifica impresión, carga de productos ni rendimiento. */
(function(){
 'use strict';
 const CLAVE='pos_ventas_pendientes_v25';
 const leer=()=>{try{const x=JSON.parse(localStorage.getItem(CLAVE)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch(_){return {}}};
 const guardar=x=>localStorage.setItem(CLAVE,JSON.stringify(x));
 let ocupado=new Map();
 let estado='';
 const estadoTexto=()=>{const num=Object.keys(leer()).length;return !navigator.onLine?'Sin conexión · ventas pendientes: '+num:num?'Red disponible · '+num+' venta(s) por confirmar':'Red disponible · sin ventas pendientes';};
 function pintar(){
  const badge=document.getElementById('posEstadoConexion');if(!badge)return;
  const num=Object.keys(leer()).length;
  const conectado=navigator.onLine;
  const descripcion=estado||estadoTexto();
  badge.textContent=descripcion;
  badge.dataset.alerta=String(!conectado||num>0);
  const barra=badge.closest('.pos-v25-estado');
  if(barra){
   barra.dataset.sinConexion=String(!conectado);
   barra.dataset.pendientes=String(num);
   barra.title=descripcion;
   barra.setAttribute('aria-label',descripcion);
   const cifra=barra.querySelector('.pos-v25-cantidad');
   if(cifra)cifra.textContent=String(num);
  }
  const boton=document.getElementById('posReintentarVentas');
  if(boton){boton.hidden=!num;boton.title='Reintentar '+num+' venta(s) pendiente(s)';boton.setAttribute('aria-label',boton.title);}
 }
 function registrarPendiente(p){
  p.sincronizacionPOS='pendiente';
  const x=leer();x[p.numero]=p;guardar(x);
  try{const arr=JSON.parse(localStorage.getItem('pedidos')||'[]');const item=arr.find(v=>v.numero===p.numero);if(item){item.sincronizacionPOS='pendiente';localStorage.setItem('pedidos',JSON.stringify(arr));}}catch(_){}
  pintar();
 }
 function guardarConfirmado(p){p.sincronizacionPOS='confirmada';const x=leer();delete x[p.numero];guardar(x);
  // Solo tocar las banderas locales de sincronización; historial de la venta intacto.
  try{const arr=JSON.parse(localStorage.getItem('pedidos')||'[]');const item=arr.find(v=>v.numero===p.numero);if(item){item.sincronizacionPOS='confirmada';localStorage.setItem('pedidos',JSON.stringify(arr));}}catch(_){}
  pintar();
 }
 function itemsDe(p){return Array.isArray(p.items)&&p.items.length?p.items:[{codigo:p.codigo,cantidad:p.cantidad||1}];}
 function enteroStock(x){if(x===undefined||x===null||String(x).trim()==='')return null;const n=Number(x);return Number.isSafeInteger(n)&&n>=0?n:null;}
 async function confirmarVenta(pedido){
  if(!pedido?.numero)return false;
  if(ocupado.has(pedido.numero))return ocupado.get(pedido.numero);
  registrarPendiente(pedido);
  const tarea=(async()=>{
   if(typeof cloudDB==='undefined')throw new Error('Almacenamiento local no disponible');
   // Resolver IDs sin depender del catálogo en memoria de otras pantallas.
   const snapshot=await cloudDB.collection('productos').get({source:'server'});
   const productos=[];snapshot.forEach(d=>productos.push({id:d.id,...d.data()}));
   const normal=x=>String(x??'').trim().toUpperCase();
   const agrupados=new Map();
   for(const item of itemsDe(pedido)){
    const codigo=normal(item.codigo);
    const producto=productos.find(p=>normal(p.codigo)===codigo||normal(p.id)===codigo);
    if(!producto)throw new Error('Producto no encontrado en Firebase: '+codigo);
    const n=Number(item.cantidad);
    if(!Number.isSafeInteger(n)||n<1)throw new Error('Cantidad inválida de '+codigo);
    const clave=String(producto.id);
    agrupados.set(clave,(agrupados.get(clave)||0)+n);
   }
   const ventaRef=cloudDB.collection('pedidos').doc(String(pedido.numero));
   const movRef=cloudDB.collection('movimientos_stock').doc(String(pedido.numero));
   const referencias=[...agrupados].map(([id,cantidad])=>({id,cantidad,ref:cloudDB.collection('productos').doc(id)}));
   await cloudDB.runTransaction(async tx=>{
    const venta=await tx.get(ventaRef);
    if(venta.exists){
     // Nunca reescribir ni descontar una venta ya confirmada.
     if(venta.data()?.identificadorUnicoPOS!==pedido.identificadorUnicoPOS)
      throw new Error('El número de venta ya existe; requiere revisión manual');
     return;
    }
    const movimiento=await tx.get(movRef);
    if(movimiento.exists)throw new Error('Ya existe movimiento de inventario para esta venta; revisar antes de continuar');
    const actual=[];
    for(const r of referencias)actual.push(await tx.get(r.ref));
    const cambios=[];
    for(let i=0;i<referencias.length;i++){
     const doc=actual[i],r=referencias[i];
     if(!doc.exists)throw new Error('Producto eliminado: '+r.id);
     const saldo=enteroStock(doc.data().stock);
     if(saldo===null)continue;
     if(saldo<r.cantidad)throw new Error('Stock insuficiente de '+(doc.data().nombre||r.id));
     cambios.push({ref:r.ref,stock:saldo-r.cantidad});
    }
    cambios.forEach(c=>tx.update(c.ref,{stock:c.stock}));
    tx.set(ventaRef,{...pedido,sincronizacionPOS:'confirmada'});
    tx.set(movRef,{tipo:'venta',numero:pedido.numero,fecha:Date.now(),items:referencias.map(r=>({id:r.id,cantidad:r.cantidad}))});
   });
   guardarConfirmado(pedido);
   estado='Venta '+pedido.numero+' confirmada en Firebase';pintar();
   return true;
  })().catch(e=>{
   console.error('Venta pendiente POS:',e);
   estado='Venta pendiente · '+e.message;
   pintar();
   return false;
  }).finally(()=>ocupado.delete(pedido.numero));
  ocupado.set(pedido.numero,tarea);
  return tarea;
 }
 async function reintentar(){if(!navigator.onLine){estado='Sin conexión: no se puede confirmar ventas';pintar();return;}
  const pendientes=Object.values(leer());if(!pendientes.length)return;
  let ok=0;for(const p of pendientes){if(await confirmarVenta(p))ok++;}
  estado=ok===pendientes.length?'Ventas pendientes confirmadas':ok+' de '+pendientes.length+' venta(s) confirmada(s); revisa pendientes';pintar();
 }
 window.POSV25={confirmarVenta,reintentar,pendientes:leer};
 document.addEventListener('DOMContentLoaded',()=>{
  const barra=document.createElement('div');barra.className='pos-v25-estado';barra.setAttribute('role','status');barra.setAttribute('aria-live','polite');
  const label=document.createElement('span');label.id='posEstadoConexion';barra.append(label);
  const compacto=document.createElement('span');compacto.className='pos-v25-compacto';compacto.setAttribute('aria-hidden','true');
  compacto.innerHTML='<svg class="pos-v25-wifi" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8.6a16 16 0 0 1 20 0"/><path d="M5 12a11 11 0 0 1 14 0"/><path d="M8.5 15.5a6 6 0 0 1 7 0"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/><path class="pos-v25-wifi-corte" d="M3 3l18 18"/></svg><strong class="pos-v25-cantidad">0</strong>';
  barra.append(compacto);
  const boton=document.createElement('button');boton.type='button';boton.id='posReintentarVentas';boton.textContent='Reintentar';boton.hidden=true;boton.addEventListener('click',reintentar);barra.append(boton);
  document.body.append(barra);
  addEventListener('online',()=>{estado='';pintar()});addEventListener('offline',()=>{estado='';pintar()});pintar();
 });
})();
