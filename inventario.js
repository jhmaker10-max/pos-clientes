// Inventario: stocks por producto en la colección Firestore ya existente.
(function(){
'use strict';
const $ = id => document.getElementById(id);
const entero = v => Number.isSafeInteger(Number(v)) && Number(v)>=0 && String(v).trim()!=='';
const catalogo = () => (typeof productosVigentesFirebase!=='undefined' && Array.isArray(productosVigentesFirebase) ? productosVigentesFirebase : []) || [];
const valorStock = p => entero(p.stock) ? Number(p.stock) : null;
const clave = p => String(p.codigo||p.id||'').trim().toUpperCase();
const itemsPedido = pedido => Array.isArray(pedido.items)&&pedido.items.length ? pedido.items : [{codigo:pedido.codigo,cantidad:pedido.cantidad||1}];
function verificarVenta(items){
 const disponibles = catalogo();
 for(const x of items){
  const p=disponibles.find(y=>clave(y)===String(x.codigo||'').trim().toUpperCase());
  if(!p) continue;
  const stock=valorStock(p);
  if(stock!==null && Number(x.cantidad)>stock){alert('Stock insuficiente para '+p.nombre+'. Disponible: '+stock+' unidad(es).');return false;}
 }
 return true;
}
// Solo se ejecuta al crear un pedido, nunca al reimprimir una boleta.
async function registrarVenta(pedido){
 // Venta y stock se confirman en la MISMA transacción Firebase.
 if(typeof window.POSV25?.confirmarVenta==='function')return window.POSV25.confirmarVenta(pedido);
 console.error('Seguridad POS no disponible: venta pendiente, sin descontar inventario.');
 return false;
}

async function cambiarStock(id,accion){
 const tarjeta=Array.from(document.querySelectorAll('[data-inventario-id]')).find(el=>el.dataset.inventarioId===id);
 const campo=tarjeta?.querySelector('input[type="number"]');
 const cantidad=campo?.value;
 if(!entero(cantidad)) {alert('Ingresa una cantidad entera igual o mayor a cero.');return;}
 const n=Number(cantidad);
 const boton=tarjeta?.querySelector('button');
 if(boton)boton.disabled=true;
 try{
  if(typeof cloudDB==='undefined')throw new Error('Conexión con la base de datos no disponible');
  const ref=cloudDB.collection('productos').doc(String(id));
  await cloudDB.runTransaction(async tx=>{
   const doc=await tx.get(ref);
   if(!doc.exists)throw new Error('El producto no existe');
   const previo=valorStock(doc.data());
   const base=previo??0;
   const nuevo=accion==='sumar'?base+n:accion==='restar'?base-n:n;
   if(nuevo<0)throw new Error('No puedes retirar más unidades de las disponibles');
   tx.update(ref,{stock:nuevo});
   const movRef=cloudDB.collection('movimientos_stock').doc();
   tx.set(movRef,{tipo:accion==='sumar'?'entrada':accion==='restar'?'salida':'ajuste',fecha:Date.now(),productoId:String(id),producto:doc.data().nombre||'',anterior:base,nuevo,cantidad:n,origen:'inventario'});
  });
  campo.value='';
  const estado=$('inventarioConexion');if(estado)estado.textContent='Stock guardado correctamente';
 }catch(e){alert('No se pudo actualizar el inventario: '+e.message);}
 finally{if(boton)boton.disabled=false;}
}
function renderizar(){
 const lista=$('inventarioLista');if(!lista)return;
 const todos=catalogo();
 const q=($('inventarioBuscar')?.value||'').toLowerCase().trim();
 const filtro=$('inventarioFiltro')?.value||'todos';
 const productos=todos.filter(p=>{
  const n=valorStock(p);
  return (String(p.nombre||'')+' '+String(p.codigo||'')).toLowerCase().includes(q) &&
   (filtro==='todos'||filtro==='bajo'&&n!==null&&n>0&&n<=4||filtro==='agotado'&&n===0||filtro==='sin'&&n===null);
 }).sort((a,b)=>(Number(b.id)||0)-(Number(a.id)||0));
 const bajos=todos.filter(p=>{const n=valorStock(p);return n!==null&&n>0&&n<=4}).length;
 const agotados=todos.filter(p=>valorStock(p)===0).length;
 const unidades=todos.reduce((sum,p)=>sum+(valorStock(p)||0),0);
 const resumen=$('inventarioResumen');
 if(resumen){resumen.replaceChildren();[['Productos',todos.length],['Unidades registradas',unidades],['Stock bajo',bajos],['Agotados',agotados]].forEach(([label,val])=>{const card=document.createElement('div');card.className='inventario-metrica';const nombre=document.createElement('span');nombre.textContent=label;const numero=document.createElement('strong');numero.textContent=val;card.append(nombre,numero);resumen.append(card);});}
 lista.replaceChildren();
 if(!productos.length){const e=document.createElement('p');e.className='inventario-vacio';e.textContent=(!catalogoVerificadoDisponible && !q && filtro==='todos')?'Cargando productos automáticamente…':'No hay productos para mostrar. Revisa el catálogo o tus filtros.';lista.append(e);return;}
 productos.forEach(p=>{
  const n=valorStock(p); const tarjeta=document.createElement('article');tarjeta.className='inventario-item';tarjeta.dataset.inventarioId=String(p.id);
  const info=document.createElement('div');info.className='inventario-info';const nombre=document.createElement('strong');nombre.textContent=p.nombre||'Producto';const codigo=document.createElement('small');codigo.textContent='Código: '+(p.codigo||'—');info.append(nombre,codigo);
  const saldo=document.createElement('div');saldo.className='inventario-saldo';const cantidad=document.createElement('strong');cantidad.textContent=n===null?'Sin configurar':n+' uds.';const estado=document.createElement('span');estado.textContent=n===null?'Sin control':n===0?'Agotado':n<=4?'Stock bajo':'Disponible';estado.className='inventario-chip '+(n===0?'inventario-agotado':n!==null&&n<=4?'inventario-bajo':'');saldo.append(cantidad,estado);
  const controles=document.createElement('div');controles.className='inventario-controles';const input=document.createElement('input');input.type='number';input.min='0';input.step='1';input.placeholder='Unidades';input.setAttribute('aria-label','Cantidad para '+p.nombre);controles.append(input);
  [['Establecer','fijar','stock-btn stock-btn-establecer','⟲'],['+ Entrada','sumar','stock-btn stock-btn-entrada','↗'],['− Salida','restar','stock-btn stock-btn-salida','↘']].forEach(([txt,tipo,clase,icono])=>{const boton=document.createElement('button');boton.type='button';boton.className=clase;const ico=document.createElement('span');ico.className='stock-btn-icono';ico.textContent=icono;ico.setAttribute('aria-hidden','true');const txtWrap=document.createElement('span');txtWrap.className='stock-btn-texto';txtWrap.textContent=txt;boton.append(ico,txtWrap);boton.onclick=()=>cambiarStock(String(p.id),tipo);controles.append(boton);});
  tarjeta.append(info,saldo,controles);lista.append(tarjeta);
 });
 const estado=$('inventarioConexion');if(estado)estado.textContent='Catálogo: '+todos.length+' productos';
}
window.renderizarInventario=renderizar;
window.verificarStockVenta=verificarVenta;
window.registrarSalidaStockVenta=registrarVenta;
document.addEventListener('DOMContentLoaded',()=>{renderizar();});
})();
