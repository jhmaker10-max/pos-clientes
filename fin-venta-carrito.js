// Confirmación posterior a la boleta: no registra ni modifica ventas o stock.
(function(){
 'use strict';
 let abiertoUnaVez=false;
 const $=id=>document.getElementById(id);
 const esCarrito=()=>new URLSearchParams(location.search).get('desde')==='escaner';
 function ventaGenerada(){
   if(esCarrito()) return !!window.pedidoEscaneadoYaGenerado;
   return window.pedidoRegistradoEnPantalla===true;
 }
 function cerrar(){
   const fondo=$('dialogoFinVenta');if(!fondo)return;
   fondo.hidden=true;document.body.classList.remove('fin-venta-abierta');
 }
 window.mostrarDialogoFinVenta=function(){
   if(abiertoUnaVez||!ventaGenerada())return;
   const fondo=$('dialogoFinVenta');if(!fondo)return;
   abiertoUnaVez=true;
   fondo.hidden=false;document.body.classList.add('fin-venta-abierta');
   $('finVentaMantener')?.focus();
 };
 document.addEventListener('DOMContentLoaded',()=>{
   $('finVentaMantener')?.addEventListener('click',cerrar);
   $('finVentaVaciar')?.addEventListener('click',()=>{
     // Tienda y escáner comparten maiteCarritoV1. No afectar los pedidos ni el stock.
     for(const clave of ['maiteCarritoV1','maitePagoEscaneadoV1','maiteEscaneoMultipleV1']){
       try{sessionStorage.removeItem(clave);}catch(e){console.warn('No se pudo limpiar '+clave,e);}
     }
     cerrar();
     location.href='inicio.html';
   });
 });
})();
