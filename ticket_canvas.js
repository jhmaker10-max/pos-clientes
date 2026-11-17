// Imagen de ticket 80 mm para compartir desde Phone (Printer A / iOS).
// Mantiene la opción de compartir; replica la composición del ticket de PC.
// Numeración visible: B- seguido únicamente de los dígitos del ID existente.
function numeroVisibleBoletaPhone(numero){
 const original=String(numero??'').trim();
 if(!original || /vista previa/i.test(original)) return original || 'SIN NÚMERO';
 const digitos=original.replace(/\D/g,'');
 return digitos ? 'B-'+digitos.slice(-6).padStart(6,'0') : original;
}
function imprimirTicketCanvas(pedidoSeleccionado){
 const p=pedidoSeleccionado||JSON.parse(localStorage.getItem('ultimoPedido')||'null');
 if(!p){alert('Primero genera un pedido.');return;}
 const tienda=localStorage.getItem('nombreTienda')||'MI TIENDA';
 const contacto=localStorage.getItem('contactoTienda')||'';
 const cierre=localStorage.getItem('mensajeTicket')||'';
 const logo=localStorage.getItem('logoTienda')||'';
 const items=Array.isArray(p.items)&&p.items.length?p.items:[{nombre:p.producto,codigo:p.codigo,cantidad:p.cantidad||1,precio:p.precio||0}];
 const total=items.reduce((s,x)=>s+(Number(x.precio)||0)*(Number(x.cantidad)||1),0);
 const dinero=n=>'S/ '+(Number(n)||0).toFixed(2);
 const fecha=p.fechaCreacion?new Date(p.fechaCreacion):new Date();
 const fechaTexto=isNaN(fecha.getTime())?new Date().toLocaleString('es-PE'):fecha.toLocaleString('es-PE',{dateStyle:'short',timeStyle:'short'});
 const metodo=p.metodoPago||'';
 const qr=(metodo==='Yape'||metodo==='Plin')?localStorage.getItem('qrPago'+metodo)||'':'';
 const canvas=document.createElement('canvas');canvas.width=576;canvas.height=15000;
 const c=canvas.getContext('2d');c.fillStyle='white';c.fillRect(0,0,576,15000);
 const L=30,R=546,C=288;let y=30;
 function font(size=24,bold=false){c.fillStyle='#000';c.font=(bold?'bold ':'')+size+'px Arial, sans-serif';}
 function wrap(s,maxWidth,size=24,bold=false){font(size,bold);const lines=[];for(const raw of String(s||'').split(/\n/)){let line='';for(const word of raw.split(/\s+/)){if(!word)continue;const trial=line?line+' '+word:word;if(c.measureText(trial).width>maxWidth&&line){lines.push(line);line=word;}else line=trial;}lines.push(line);}return lines;}
 function center(s,size=24,bold=false,space=7){font(size,bold);c.textAlign='center';for(const line of wrap(s,R-L,size,bold)){c.fillText(line,C,y+size);y+=size+space;}}
 function left(s,size=24,bold=false,x=L){font(size,bold);c.textAlign='left';for(const line of wrap(s,R-x,size,bold)){c.fillText(line,x,y+size);y+=size+6;}}
 function line(strong=false){y+=6;c.strokeStyle='#111';c.lineWidth=strong?3:1;c.setLineDash(strong?[]:[8,6]);c.beginPath();c.moveTo(L,y);c.lineTo(R,y);c.stroke();c.setLineDash([]);y+=13;}
 function pair(label,value,size=22,bold=false){font(size,bold);c.textAlign='left';c.fillText(label,L,y+size);c.textAlign='right';c.fillText(value,R,y+size);y+=size+11;}
 function field(k,v){if(v===undefined||v===null||String(v).trim()==='')return;font(23,true);c.textAlign='left';c.fillText(k+':',L,y+23);const keyWidth=c.measureText(k+': ').width;let first=true;for(const t of wrap(v,R-L-keyWidth-5,23,false)){font(23,false);c.textAlign='left';c.fillText(t,first?L+keyWidth:L+10,y+23);first=false;y+=31;}}
 function img(src,maxW,maxH){return new Promise(resolve=>{if(!/^(data:image\/(?:png|jpeg|gif|webp);base64,|https:\/\/)/i.test(src||''))return resolve();const image=new Image();image.onload=()=>{const ratio=Math.min(maxW/image.width,maxH/image.height);const w=image.width*ratio,h=image.height*ratio;c.drawImage(image,C-w/2,y,w,h);y+=h+12;resolve();};image.onerror=()=>resolve();image.src=src;});}
 async function render(){
  await img(logo,115,115);
  center(tienda.toUpperCase(),38,true,4);
  if(contacto)center('TEL. '+contacto,22);
  line(true);center('TICKET DE COMPRA',29,true);
  center(p.numero?'BOLETA N° '+numeroVisibleBoletaPhone(p.numero):'VENTA AL DETALLE',21);
  line();field('Fecha',fechaTexto);field('Cliente',p.cliente||'Público general');field('DNI',p.dniCliente);field('Teléfono',p.telefonoCliente);field('Dirección',p.direccionCliente);
  line(true);pair('DESCRIPCIÓN / CANT. × P.U.','IMPORTE',19,true);line();
  for(const item of items){
   left(item.nombre||'Producto',25,true);
   if(item.codigo)left('COD. '+item.codigo,20);
   const cant=Math.max(1,Number(item.cantidad)||1),precio=Number(item.precio)||0;
   pair(cant+' × '+dinero(precio),dinero(cant*precio),23,true);
   line();
  }
  line(true);pair('PRODUCTOS DIFERENTES',String(items.length),21);
  pair('UNIDADES TOTALES',String(items.reduce((s,x)=>s+Math.max(1,Number(x.cantidad)||1),0)),21);
  line(true);pair('TOTAL A PAGAR',dinero(total),29,true);line(true);
  if(metodo){center('MÉTODO DE PAGO: '+metodo.toUpperCase(),22,true);await img(qr,260,260);if(qr)center('Escanea para pagar con '+metodo,21);}
  if(p.mensajePedido){line();left('OBSERVACIONES',20,true);left(p.mensajePedido,22);}
  line(true);if(cierre)center(cierre,21);
  center('¡GRACIAS POR SU COMPRA!',25,true);center('ESPERAMOS VERLE PRONTO',21);
  center('No es comprobante electrónico SUNAT.',17);
  const crop=document.createElement('canvas');crop.width=576;crop.height=Math.ceil(y+22);
  const cc=crop.getContext('2d');cc.fillStyle='white';cc.fillRect(0,0,crop.width,crop.height);cc.drawImage(canvas,0,0,crop.width,crop.height,0,0,crop.width,crop.height);
  crop.toBlob(async blob=>{
   if(!blob)return;
   const archivo=new File([blob],'ticket-80mm.png',{type:'image/png'});
   try{if(navigator.share&&navigator.canShare?.({files:[archivo]}))await navigator.share({files:[archivo]});
   else{const a=document.createElement('a');a.href=crop.toDataURL('image/png');a.download='ticket-80mm.png';a.click();}}
   catch(e){if(e?.name!=='AbortError')console.warn('No se pudo compartir la boleta',e);}
   finally{if(typeof window.mostrarDialogoFinVenta==='function')window.mostrarDialogoFinVenta();}
  },'image/png',1);
 }
 render().catch(e=>{console.error(e);alert('No se pudo preparar la boleta para Phone.');});
}
