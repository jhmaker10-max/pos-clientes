// Control de stock compartido entre tienda y escáner. Los productos sin stock configurado no se limitan.
(function(){
 'use strict';
 const codigo=x=>String(x??'').trim().replace(/\s+/g,'').toUpperCase();
 function catalogo(){
  if(typeof productosVigentesFirebase!=='undefined' && Array.isArray(productosVigentesFirebase) && productosVigentesFirebase.length)return productosVigentesFirebase;
  if(Array.isArray(window.catalogoOfflineActual))return window.catalogoOfflineActual;
  try{const copia=JSON.parse(localStorage.getItem('detallesmaite_catalogo_confirmado_v1')||'null');return Array.isArray(copia?.productos)?copia.productos:[];}catch(_){return [];}
 }
 function producto(referencia){
  const key=codigo(typeof referencia==='object'?(referencia.codigo||referencia.id):referencia);
  return catalogo().find(p=>codigo(p.codigo)===key||codigo(p.id)===key) ||
   (typeof referencia==='object' && referencia?referencia:null);
 }
 function cantidad(p){if(!p||p.stock===null||p.stock===undefined||String(p.stock).trim()==='')return null;
  const n=Number(p.stock);return Number.isSafeInteger(n)&&n>=0?n:null;}
 function aviso(p){const n=cantidad(p);if(n===null)return '';if(n===0)return '⛔ Agotado · 0 unidades';if(n<=4)return '⚠️ Últimas '+n+' unidades';return '';}
 function estado(p,enCarrito=0){const n=cantidad(p);if(n===null)return 'normal';const restante=Math.max(0,n-(Number(enCarrito)||0));return restante>=5?'normal':restante<=1?'critico':'bajo';}
 function claseTarjetaInicio(p){
  const n=cantidad(p);
  if(n===null)return '';
  return n===0?'producto-stock-agotado':n<=4?'producto-stock-bajo':'';
 }
 function etiquetaInicio(p){
  const n=cantidad(p);
  if(n===null)return '';
  const estado=n===0?'agotado':n===1?'critico':n<=4?'bajo':'normal';
  const unidades=['und','doc','ciento','par','caja','paq','bolsa','kg','g','L','m','rollo','juego'];
  const unidad=unidades.includes(p?.unidadMedida)?p.unidadMedida:'und';
  const texto=n===0?'Agotado':n+' '+unidad;
  const icono=n<=4?'<span class="stock-inicio-alerta" aria-hidden="true">⚠</span>':'';
  return '<p class="stock-inicio-etiqueta stock-inicio-'+estado+'" aria-label="Stock disponible: '+texto+'">'+texto+icono+'</p>';
 }
 function validar(p,solicitado){const disponible=cantidad(p);if(disponible===null)return true;
  if(solicitado>disponible)return false;
  return true;
 }
 function validarCarrito(items){for(const item of items){const p=producto(item.codigo);if(p&&!validar(p,Number(item.cantidad)))return false;}return true;}
 window.StockPOS={producto,cantidad,aviso,etiquetaInicio,claseTarjetaInicio,validar,validarCarrito,estado};
})();
