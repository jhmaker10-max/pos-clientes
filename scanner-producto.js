// Lector exclusivo para crear o editar productos. No consulta ni modifica el carrito.
(() => {
'use strict';
const $ = id => document.getElementById(id);
let camaraActiva = false;
let gatilloArmado = false;
let finalizado = false;
let timeoutGatillo = null;

function devolverCodigo(codigo){
 if(finalizado)return;
 const limpio=String(codigo||'').trim();
 if(!limpio)return;
 finalizado=true;
 gatilloArmado=false;
 clearTimeout(timeoutGatillo);
 localStorage.setItem('codigoEscaneadoProducto',limpio);
 sessionStorage.setItem('regresoEscanerProducto','1');
 $('resultadoProducto').textContent='✅ Código capturado: '+limpio;
 $('estadoProducto').textContent='Regresando al formulario de productos…';
 detenerCamara();
 window.location.replace('administracion.html');
}
function detenerCamara(){
 if(camaraActiva && typeof Quagga!=='undefined'){
  try{Quagga.stop();}catch(e){console.warn('No se pudo detener la cámara',e);}
  camaraActiva=false;
 }
}
function desarmarGatillo(mensaje){
 gatilloArmado=false;
 clearTimeout(timeoutGatillo);
 $('gatilloProducto').disabled=!camaraActiva;
 $('gatilloProducto').textContent='📷 Escanear código';
 if(mensaje)$('estadoProducto').textContent=mensaje;
}
function activarGatillo(){
 if(!camaraActiva || gatilloArmado || finalizado)return;
 gatilloArmado=true;
 $('gatilloProducto').disabled=true;
 $('gatilloProducto').textContent='⌖ Buscando código…';
 $('resultadoProducto').textContent='';
 $('estadoProducto').textContent='Apunta al código; se capturará una sola lectura.';
 // Si no se encuentra un código, volver al modo de espera para otra pulsación.
 timeoutGatillo=setTimeout(()=>desarmarGatillo('No se encontró un código. Ajusta el enfoque y vuelve a pulsar el gatillo.'),8000);
}
function iniciarCamara(){
 if(typeof Quagga==='undefined'){
  $('estadoProducto').textContent='⚠️ No se pudo cargar el lector. Puedes escribir el código manualmente.';
  return;
 }
 Quagga.init({
  inputStream:{type:'LiveStream',target:$('scannerProducto'),constraints:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}},
  locator:{patchSize:'medium',halfSample:true},numOfWorkers:Math.min(navigator.hardwareConcurrency||2,4),frequency:10,
  decoder:{readers:['code_128_reader','ean_reader','ean_8_reader','upc_reader','upc_e_reader','code_39_reader','codabar_reader','2of5_reader']},locate:true
 },error=>{
  if(error){console.error(error);$('estadoProducto').textContent='⚠️ No se pudo abrir la cámara. Escribe el código manualmente.';return;}
  Quagga.start();
  camaraActiva=true;
  $('gatilloProducto').disabled=false;
  $('estadoProducto').textContent='✅ Cámara lista. Pulsa el gatillo para capturar el código.';
  try{const track=Quagga.CameraAccess.getActiveTrack();track?.applyConstraints?.({advanced:[{focusMode:'continuous'}]}).catch(()=>{});}catch(_){}
 });
 Quagga.onDetected(data=>{
  if(!gatilloArmado || finalizado)return;
  const codigo=String(data?.codeResult?.code||'').trim();
  if(!codigo)return;
  devolverCodigo(codigo);
 });
}
window.addEventListener('DOMContentLoaded',()=>{
 // El modo administración anterior no debe contaminar el escáner normal.
 localStorage.removeItem('modoEscaneoProducto');
 $('gatilloProducto').addEventListener('click',activarGatillo);
 $('formularioRegistroManual').addEventListener('submit',evento=>{
  evento.preventDefault();
  devolverCodigo($('codigoRegistroManual').value);
 });
 $('cancelarScanProducto').addEventListener('click',()=>{
  sessionStorage.setItem('regresoEscanerProducto','1');
  detenerCamara();
 });
 iniciarCamara();
});
window.addEventListener('pagehide',()=>{clearTimeout(timeoutGatillo);detenerCamara();});
})();
