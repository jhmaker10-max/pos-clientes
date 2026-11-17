// Escaneo automático con protección contra lecturas duplicadas.
(() => {
'use strict';
const $ = id => document.getElementById(id);
const clave = 'maiteCarritoV1';
const claveAnterior = 'maiteEscaneoMultipleV1';
const modoAdmin = localStorage.getItem('modoEscaneoProducto') === '1';
const lista = cargarLista();
let camaraActiva = false;
const PAUSA_LECTURA_MS = 2000;
let siguienteLectura = 0;
// Cada unidad debe provenir de una NUEVA lectura real de la cámara.
// Jamás repetir el último código mediante un temporizador.
let lectorCerrado = false;
// Producto validado tras una lectura exitosa: una actualización parcial del catálogo
// nunca debe convertir esa misma lectura en 'código no registrado'.
const codigosConfirmados = new Map();
// Evitar que un código desconocido fijo provoque decenas de pitidos por segundo.
// Esto NO impide cambiar inmediatamente a otro código.
let ultimoErrorCodigo = '';
let ultimaAlertaError = 0;
const REPETIR_ALERTA_ERROR_MS = 1200;
let contextoAudio = null;
let procesando = false;
// La cámara puede alternar lecturas correctas y erróneas del mismo código.
// Guardar evidencia por código (no exigir cuadros consecutivos) para que el
// código del producto vuelva a reconocerse al acabar los 2 segundos.
const lecturasRecientes = new Map();
const VENTANA_CONFIRMACION_MS = 1500;
function reiniciarConfirmacion(){ lecturasRecientes.clear(); }
function codigoBarrasConDigitoCorrecto(codigo,formato){
 // Los EAN y UPC tienen dígito de control. Descartar una mala lectura antes
 // de concluir erróneamente que el producto no existe.
 const f=String(formato||'').toLowerCase();
 const tamanos={ean_13:13,ean_8:8,upc_a:12};
 const n=tamanos[f];
 if(!n || !/^\d+$/.test(codigo) || codigo.length!==n) return true;
 let suma=0;
 for(let i=0;i<n-1;i++){
  const posDesdeDerecha=n-2-i;
  suma+=Number(codigo[i])*(posDesdeDerecha%2===0?3:1);
 }
 return (10-suma%10)%10===Number(codigo[n-1]);
}
function confirmarLectura(codigo,formato){
 const ahora=Date.now();
 if(!codigoBarrasConDigitoCorrecto(codigo,formato)) return false;
 for(const [clave, datos] of lecturasRecientes){
  if(ahora-datos.ultimo>VENTANA_CONFIRMACION_MS) lecturasRecientes.delete(clave);
 }
 const previo=lecturasRecientes.get(codigo);
 const cuenta=previo ? previo.veces+1 : 1;
 lecturasRecientes.set(codigo,{veces:cuenta,ultimo:ahora});
 const registrado=Boolean(buscarProducto(codigo));
 // El producto registrado necesita solo dos detecciones, aunque haya ruido
 // entre ellas. El código desconocido requiere una confirmación mayor.
 if(registrado) return cuenta>=2;
 // Prioridad a códigos registrados detectados recientemente en el visor.
 for(const [otro, datos] of lecturasRecientes){
  if(otro!==codigo && buscarProducto(otro) && ahora-datos.ultimo<800) return false;
 }
 return cuenta>=4;
}

function cargarLista(){
 // La tienda y el escáner comparten el mismo carrito durante esta sesión.
 // Migrar los productos del escáner anterior una sola vez para no perderlos.
 try {
  const actual = JSON.parse(sessionStorage.getItem(clave) || '[]');
  const carrito = Array.isArray(actual) ? actual.filter(p => p && p.codigo && Number(p.cantidad)>0) : [];
  if (modoAdmin) return carrito; // El lector del administrador no cambia el carrito.
  const anterior = JSON.parse(sessionStorage.getItem(claveAnterior) || '[]');
  if (Array.isArray(anterior) && anterior.length) {
   for(const p of anterior){
    if (!p || !p.codigo || !(Number(p.cantidad)>0)) continue;
    const existente = carrito.find(x=>normalizarCodigo(x.codigo)===normalizarCodigo(p.codigo));
    if(existente){
     existente.cantidad += Number(p.cantidad);
     if (!existente.imagen && p.imagen) existente.imagen = p.imagen;
    }else carrito.push({codigo:String(p.codigo),nombre:String(p.nombre||'Producto'),precio:Number(p.precio)||0,cantidad:Number(p.cantidad),imagen:String(p.imagen||''),stock:p.stock??null});
   }
   sessionStorage.setItem(clave,JSON.stringify(carrito));
   sessionStorage.removeItem(claveAnterior);
  }
  return carrito;
 } catch(e) { console.warn('No se pudo cargar el carrito compartido:',e); return []; }
}
function guardarLista(){
 if(modoAdmin)return;
 try {sessionStorage.setItem(clave, JSON.stringify(lista));} catch(e){console.warn('No se pudo guardar escaneo', e);}
}
function mensaje(txt){ $('resultado').textContent = txt; }
function estado(txt){ $('estado').textContent = txt; }
function escapar(s){return String(s).replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function moneda(n){return Number(n || 0).toFixed(2);}
function imagenValida(valor){
 const src=String(valor||'').trim();
 return /^(https?:\/\/|data:image\/(?:png|jpeg|jpg|webp|gif|svg\+xml);base64,|\.?\.?\/)/i.test(src) ? src : '';
}
function miniaturaProducto(p){
 const marco=document.createElement('div');marco.className='miniatura-escaneo';
 const src=imagenValida(p.imagen);
 if(src){
  const img=document.createElement('img');img.src=src;img.alt='Imagen de '+String(p.nombre||'producto');img.loading='lazy';
  img.onerror=()=>{img.remove();marco.classList.add('sin-imagen');marco.textContent='📦';};
  marco.append(img);
 }else{marco.classList.add('sin-imagen');marco.textContent='📦';}
 return marco;
}
function sincronizarImagenes(){
 let cambiado=false;
 for(const p of lista){
  const original=buscarProducto(p.codigo);
  if(original && original.imagen && original.imagen!==p.imagen){p.imagen=original.imagen;cambiado=true;}
 }
 if(cambiado)pintar();
}
function catalogo(){
 // Se usa el catálogo validado de Firebase; evita depender de una variable todavía sin cargar.
 if(typeof productosVigentesFirebase !== 'undefined' && Array.isArray(productosVigentesFirebase) && productosVigentesFirebase.length) return productosVigentesFirebase;
 if(window.catalogoOfflineActual && Array.isArray(window.catalogoOfflineActual)) return window.catalogoOfflineActual;
 try {
  const copia=JSON.parse(localStorage.getItem('detallesmaite_catalogo_confirmado_v1')||'null');
  if(copia && Array.isArray(copia.productos)) return copia.productos;
 }catch(_){ }
 return [];
}
function normalizarCodigo(valor){return String(valor??'').trim().replace(/\s+/g,'').toUpperCase();}
function mismoCodigo(a,b){
 const x=normalizarCodigo(a),y=normalizarCodigo(b);
 // UPC-A puede ser decodificado como EAN-13 con un cero inicial.
 return x===y || (/^\d{12}$/.test(x) && y==='0'+x) || (/^\d{12}$/.test(y) && x==='0'+y);
}
function buscarProducto(codigo){
 const listaProductos=catalogo();
 const hallado=listaProductos.find(p=>mismoCodigo(p.codigo,codigo));
 if(hallado)return hallado;
 // Un código ya validado en esta sesión sigue siendo válido para agregar otra unidad,
 // incluso durante una recarga incompleta o momentánea del catálogo remoto.
 const confirmado=Array.from(codigosConfirmados.values()).find(p=>mismoCodigo(p.codigo,codigo));
 if(confirmado)return confirmado;
 return lista.find(p=>mismoCodigo(p.codigo,codigo)) || null;
}
async function esperarCatalogo(){
 if(typeof cargarProductosDesdeFirebase!=='function') return;
 // El escáner manual nunca debe quedar bloqueado si falla la conexión.
 await Promise.race([
  Promise.resolve().then(()=>cargarProductosDesdeFirebase()).catch(()=>false),
  new Promise(resolve=>setTimeout(()=>resolve(false),6000))
 ]);
}
function pintar(){
 const ul=$('listaEscaneados'); ul.innerHTML='';
 if(!lista.length){ const li=document.createElement('li');li.textContent='Todavía no hay productos.';ul.append(li); }
 for(const p of lista){
  const li=document.createElement('li');
  const info=document.createElement('div');
  info.innerHTML=`<strong>${escapar(p.nombre)}</strong><small>Código: ${escapar(p.codigo)} · S/ ${moneda(p.precio)} c/u</small>`;
  const estadoStock=window.StockPOS?.estado(window.StockPOS.producto(p),p.cantidad)||'normal';
  if(estadoStock!=='normal'){
   const nombre=info.querySelector('strong');
   const critico=estadoStock==='critico';
   nombre.classList.add(critico?'stock-nombre-agotado':'stock-nombre-advertencia');
   nombre.style.setProperty('color',critico?'#d32f2f':'#b77900','important');
   const icono=document.createElement('span');
   icono.className=critico?'stock-icono-agotado':'stock-icono-advertencia';
   icono.textContent='⚠';icono.setAttribute('aria-hidden','true');
   icono.style.setProperty('color','inherit','important');
   nombre.append(' ',icono);
  }
  const controles=document.createElement('span'); controles.className='cantidad-controles';
  const menos=document.createElement('button');menos.type='button';menos.textContent='−';menos.setAttribute('aria-label','Restar una unidad');menos.onclick=()=>cambiarCantidad(p.codigo,-1);
  const num=document.createElement('strong');num.textContent=p.cantidad;
  const mas=document.createElement('button');mas.type='button';mas.textContent='+';mas.setAttribute('aria-label','Agregar una unidad');mas.onclick=()=>cambiarCantidad(p.codigo,1);
  controles.append(menos,num,mas);li.append(miniaturaProducto(p),info,controles);ul.append(li);
 }
 const cantidad=lista.reduce((s,p)=>s+Number(p.cantidad),0);
 const total=lista.reduce((s,p)=>s+Number(p.cantidad)*Number(p.precio||0),0);
 $('totalUnidades').textContent=cantidad+' unidad'+(cantidad===1?'':'es')+' · '+lista.length+' producto'+(lista.length===1?'':'s')+' diferente'+(lista.length===1?'':'s');
 $('totalEscaneo').textContent='Total: S/ '+moneda(total);
 $('vaciarEscaneo').disabled=!lista.length;
 $('pagarEscaneo').disabled=!lista.length;
 guardarLista();
}
function cambiarCantidad(codigo,delta){
 const p=lista.find(x=>x.codigo===codigo);if(!p)return;
 if(delta>0 && window.StockPOS && !window.StockPOS.validar(window.StockPOS.producto(codigo),p.cantidad+delta))return;
 p.cantidad+=delta;
 if(p.cantidad<=0)lista.splice(lista.indexOf(p),1);
 pintar();
}
function obtenerAudio(){
 try {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return null;
  if (!contextoAudio) contextoAudio = new Audio();
  if (contextoAudio.state === 'suspended') contextoAudio.resume().catch(()=>{});
  return contextoAudio;
 } catch (_) { return null; }
}
function tono(frecuencia, inicio, duracion, volumen=.34){
 try {
  const audio=obtenerAudio(); if(!audio)return;
  const oscilador=audio.createOscillator();
  const ganancia=audio.createGain();
  oscilador.type='sine';oscilador.frequency.value=frecuencia;
  const t=audio.currentTime+inicio;
  ganancia.gain.setValueAtTime(0.001,t);
  ganancia.gain.exponentialRampToValueAtTime(volumen,t+0.012);
  ganancia.gain.exponentialRampToValueAtTime(0.001,t+duracion);
  oscilador.connect(ganancia);ganancia.connect(audio.destination);
  oscilador.start(t);oscilador.stop(t+duracion+0.02);
  oscilador.onended=()=>{oscilador.disconnect();ganancia.disconnect();};
 } catch (_) {}
}
function sonidoCorrecto(){
 // Sonido ORIGINAL: un solo pitido sinusoidal de 1000 Hz durante 0.12 s.
 // Solo se aumenta la ganancia (antes 0.08), sin cambiar tono ni duración.
 try {
  const audio=obtenerAudio(); if(audio){
   const oscilador=audio.createOscillator();
   const ganancia=audio.createGain();
   oscilador.frequency.value=1000;
   ganancia.gain.value=0.30;
   oscilador.connect(ganancia);ganancia.connect(audio.destination);
   oscilador.start();oscilador.stop(audio.currentTime+0.12);
   oscilador.onended=()=>{oscilador.disconnect();ganancia.disconnect();};
  }
 } catch (_) {}
 if(navigator.vibrate)navigator.vibrate(80);
}
function sonidoNoEncontrado(){
 // Mantener los dos tonos de error; solo aumentar su volumen.
 tono(440,0,.18,.85);tono(294,.20,.24,.85);
 if(navigator.vibrate)navigator.vibrate([110,70,140]);
}
function mostrarPausa(){
 const restantes=Math.max(0,Math.ceil((siguienteLectura-Date.now())/1000));
 if(restantes)estado('✅ Lectura realizada. Próximo escaneo en '+restantes+' s.');
 else estado('✅ Cámara activa. Apunta al siguiente código.');
}
async function anadirCodigo(valor,origen='camara'){
 const codigo=String(valor??'').trim();
 if(!codigo){mensaje('⚠️ Escribe un código antes de pulsar Añadir.');$('codigoManual').focus();return false;}
 if(procesando){mensaje('⏳ Se está procesando otro producto. Intenta nuevamente.');return false;}
 procesando=true;
 const botonManual=$('agregarManual');
 botonManual.disabled=true;
 try{
  if(modoAdmin){
   localStorage.setItem('codigoEscaneadoProducto',codigo);
   localStorage.removeItem('modoEscaneoProducto');
   location.href='administracion.html';return true;
  }
  let p=buscarProducto(codigo);
  // Si existe un catálogo cargado, determinar al instante si falta el producto.
  // Solo esperar la carga inicial cuando NO existe todavía ningún catálogo disponible.
  if(!p && typeof catalogoVerificadoDisponible !== 'undefined' && !catalogoVerificadoDisponible){
   mensaje('🔎 Cargando catálogo de productos...');
   await esperarCatalogo();
   p=buscarProducto(codigo);
  }
  if(!p){
   const ahora=Date.now();
   if(origen!=='camara' || codigo!==ultimoErrorCodigo || ahora-ultimaAlertaError>=REPETIR_ALERTA_ERROR_MS){
    sonidoNoEncontrado();
    ultimoErrorCodigo=codigo;
    ultimaAlertaError=ahora;
   }
   mensaje('❌ Código '+codigo+' no registrado. Prueba otro código inmediatamente.');
   if(origen==='camara')estado('📷 Código no encontrado. Escáner listo para seguir leyendo.');
   return false;
  }
  const codigoReal=String(p.codigo??codigo).trim();
  const existente=lista.find(x=>mismoCodigo(x.codigo,codigoReal));
  if(window.StockPOS && !window.StockPOS.validar(p,(existente?.cantidad||0)+1)){mensaje('⚠️ No hay stock suficiente para añadir otra unidad de '+String(p.nombre||'este producto')+'.');pintar();return false;}
  if(existente){existente.cantidad+=1;existente.precio=Number(p.precio)||0;existente.nombre=String(p.nombre||existente.nombre);existente.imagen=String(p.imagen||'');existente.stock=p.stock??null;}
  else lista.push({codigo:codigoReal,nombre:String(p.nombre||'Producto'),precio:Number(p.precio)||0,imagen:String(p.imagen||''),cantidad:1,stock:p.stock??null});
  codigosConfirmados.set(normalizarCodigo(codigoReal), {...p, codigo:codigoReal});
  // El contador solo empieza después de añadir un producto encontrado por la cámara.
  if(origen==='camara'){
   siguienteLectura=Date.now()+PAUSA_LECTURA_MS;
   // Descartar por completo las detecciones anteriores a la pausa.
   reiniciarConfirmacion();
  }
  sonidoCorrecto();pintar();mensaje('✅ Añadido: '+String(p.nombre||'Producto')+' · Código: '+codigoReal);
  if(origen==='manual'){$('codigoManual').value='';$('codigoManual').focus();}
  return true;
 }catch(e){
  console.error(e);mensaje('❌ No se pudo agregar. Comprueba la conexión y vuelve a intentarlo.');return false;
 }finally{
  procesando=false;botonManual.disabled=false;
  if(origen==='camara' && !modoAdmin && Date.now()<siguienteLectura)mostrarPausa();
 }
}
function iniciarCamara(){
 if(typeof Quagga==='undefined'){estado('⚠️ Lector no disponible. Puedes ingresar el código manualmente.');return;}
 estado('📷 Solicitando permiso de cámara...');
 Quagga.init({
  inputStream:{type:'LiveStream',target:$('scanner'),constraints:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}},
  locator:{patchSize:'medium',halfSample:true},numOfWorkers:Math.min(navigator.hardwareConcurrency||2,4),frequency:10,
  decoder:{readers:['code_128_reader','ean_reader','ean_8_reader','upc_reader','upc_e_reader','code_39_reader','codabar_reader','2of5_reader']},locate:true
 },err=>{
  if(err){console.error(err);estado('⚠️ No se pudo abrir la cámara. Usa el código manual.');return;}
  if(lectorCerrado)return;
  Quagga.start();camaraActiva=true;reiniciarConfirmacion();estado('✅ Cámara activa. Apunta al código para escanear automáticamente.');
  try{const track=Quagga.CameraAccess.getActiveTrack();track?.applyConstraints?.({advanced:[{focusMode:'continuous'}]}).catch(()=>{});}catch(_){ }
 });
 Quagga.onDetected(data=>{
  if(lectorCerrado || !camaraActiva || document.hidden)return;
  const codigo=String(data?.codeResult?.code||'').trim();if(!codigo)return;
  const ahora=Date.now();
  // El bloqueo de dos segundos se aplica solo cuando se añadió con éxito.
  // NO se exige retirar el mismo código del visor: al acabar la pausa
  // se vuelve a confirmar y sumar una unidad del mismo producto.
  if(modoAdmin){
   if(procesando)return;
  }else{
   // La cámara debe entregar nuevos fotogramas una vez vencidos los 2 segundos.
   if(procesando || ahora<siguienteLectura)return;
  }
  if(!confirmarLectura(codigo,data?.codeResult?.format))return;
  reiniciarConfirmacion();
  estado('⏳ Leyendo código '+codigo+'...');
  anadirCodigo(codigo,'camara');
 });
}
window.addEventListener('pos-catalogo-actualizado',()=>{for(const p of lista){const actual=buscarProducto(p.codigo);if(actual)p.stock=actual.stock??null;}if($('listaEscaneados'))pintar();});
window.addEventListener('DOMContentLoaded',()=>{
 pintar();sincronizarImagenes();
 // En navegadores móviles, un toque inicial habilita la reproducción de audio.
 document.addEventListener('pointerdown',obtenerAudio,{once:true,passive:true});
 $('pagarEscaneo').addEventListener('click',()=>{
  if(!lista.length){mensaje('⚠️ Escanea al menos un producto antes de pagar.');return;}
  if(window.StockPOS && !window.StockPOS.validarCarrito(lista))return;
  const items=lista.map(p=>({codigo:p.codigo,nombre:p.nombre,precio:Number(p.precio),cantidad:Number(p.cantidad),imagen:p.imagen||''}));
  sessionStorage.setItem('maitePagoEscaneadoV1',JSON.stringify(items));
  window.location.href='pedidos.html?desde=escaner';
 });
 $('formularioManual').addEventListener('submit',e=>{e.preventDefault();anadirCodigo($('codigoManual').value,'manual');});
 $('vaciarEscaneo').addEventListener('click',()=>{if(lista.length && confirm('¿Vaciar todos los productos escaneados?')){lista.length=0;pintar();mensaje('Lista vaciada.');}});
 if(modoAdmin){$('seccionLista').hidden=true;estado('📷 Apunta al código: se completará automáticamente en Productos.');}
 if(typeof cargarProductosDesdeFirebase==='function')Promise.resolve(cargarProductosDesdeFirebase()).then(()=>sincronizarImagenes()).catch(e=>console.warn('Catálogo no disponible:',e));
 window.addEventListener('catalogo-offline-listo',()=>{sincronizarImagenes();pintar();});
 // El temporizador solamente actualiza la cuenta visual. Nunca agrega artículos.
 setInterval(()=>{
  if(lectorCerrado || !camaraActiva || modoAdmin || procesando)return;
  if(Date.now()<siguienteLectura){mostrarPausa();return;}
  if($('estado').textContent.includes('Próximo escaneo'))mostrarPausa();
 },100);
 iniciarCamara();
});
window.addEventListener('pagehide',()=>{lectorCerrado=true;camaraActiva=false;siguienteLectura=0;reiniciarConfirmacion();if(typeof Quagga!=='undefined'){try{Quagga.stop();}catch(_){}}});
})();
