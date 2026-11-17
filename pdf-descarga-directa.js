/* Descarga PDF A4 directamente, sin ventana ni diálogo de impresión.
   Generador autocontenido: página A4 como imagen JPEG dentro de PDF válido. */
(function(){
'use strict';
const WIDTH=595.28, HEIGHT=841.89, SCALE=2;
const gray='#687682', ink='#233443', blue='#23465e', pale='#edf2f5';
const money=n=>'S/ '+(Number(n)||0).toFixed(2);
const txt=v=>String(v==null?'':v);
function safeName(v){return txt(v).replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,55)||'boleta';}
function wrap(ctx,value,maxWidth){
 const all=[];
 for(const line of txt(value).split(/\r?\n/)){
  let cur='';
  for(const word of line.split(/\s+/)){
   if(!word)continue;
   if(ctx.measureText(word).width>maxWidth){
    if(cur){all.push(cur);cur='';}
    let slice='';for(const char of word){if(slice&&ctx.measureText(slice+char).width>maxWidth){all.push(slice);slice=char;}else slice+=char;}
    cur=slice;continue;
   }
   const merged=cur?cur+' '+word:word;
   if(cur&&ctx.measureText(merged).width>maxWidth){all.push(cur);cur=word;}else cur=merged;
  }
  all.push(cur);
 }
 return all.length?all:[''];
}
function pdfFromCanvases(canvases){
 const enc=new TextEncoder(),parts=[],offsets=[0];let length=0;
 function push(v){const b=typeof v==='string'?enc.encode(v):v;parts.push(b);length+=b.length;}
 function obj(id,head,data,tail){offsets[id]=length;push(id+' 0 obj\n'+head);if(data)push(data);push(tail||'\nendobj\n');}
 push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
 obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
 const ids=canvases.map((_,i)=>5+i*3);
 obj(2,'<< /Type /Pages /Count '+canvases.length+' /Kids ['+ids.map(n=>n+' 0 R').join(' ')+'] >>');
 obj(3,'<< /Producer (POS - Descarga directa) >>');
 obj(4,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
 canvases.forEach((canvas,i)=>{
  const pageId=5+i*3,imgId=pageId+1,streamId=pageId+2;
  const jpeg=atob(canvas.toDataURL('image/jpeg',0.88).split(',')[1]);
  const bytes=new Uint8Array(jpeg.length);for(let j=0;j<jpeg.length;j++)bytes[j]=jpeg.charCodeAt(j);
  obj(imgId,'<< /Type /XObject /Subtype /Image /Width '+canvas.width+' /Height '+canvas.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+bytes.length+' >>\nstream\n',bytes,'\nendstream\nendobj\n');
  const commands='q\n'+WIDTH+' 0 0 '+HEIGHT+' 0 0 cm\n/Im'+i+' Do\nQ\n';
  obj(streamId,'<< /Length '+enc.encode(commands).length+' >>\nstream\n',enc.encode(commands),'endstream\nendobj\n');
  obj(pageId,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+WIDTH+' '+HEIGHT+'] /Resources << /XObject << /Im'+i+' '+imgId+' 0 R >> >> /Contents '+streamId+' 0 R >>');
 });
 const startXref=length;push('xref\n0 '+offsets.length+'\n0000000000 65535 f \n');
 for(let i=1;i<offsets.length;i++)push(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
 push('trailer\n<< /Size '+offsets.length+' /Root 1 0 R /Info 3 0 R >>\nstartxref\n'+startXref+'\n%%EOF');
 return new Blob(parts,{type:'application/pdf'});
}
async function generate(p){
 const items=Array.isArray(p.items)&&p.items.length?p.items.map(x=>({nombre:txt(x.nombre||'Producto'),codigo:txt(x.codigo||''),cantidad:Math.max(1,Number(x.cantidad)||1),precio:Number(x.precio)||0})):[{nombre:txt(p.producto||'Producto'),codigo:txt(p.codigo||''),cantidad:Math.max(1,Number(p.cantidad)||1),precio:Number(p.precio)||0}];
 const total=items.reduce((s,x)=>s+Number(x.cantidad||0)*Number(x.precio||0),0);
 const nombre=localStorage.getItem('nombreTienda')||'MI TIENDA';
 const telefono=localStorage.getItem('contactoTienda')||'';
 const logo=localStorage.getItem('logoTienda')||'';
 let image=null;
 if(/^data:image\/(?:png|jpeg|webp);base64,/i.test(logo)){
  try{image=await new Promise(resolve=>{const el=new Image();el.onload=()=>resolve(el);el.onerror=()=>resolve(null);el.src=logo;});}catch(_){image=null;}
 }
 const original=txt(p.numero||'').trim();const digits=original.replace(/\D/g,'');const number=digits?'B-'+digits.slice(-6).padStart(6,'0'):(original||'SIN_NUMERO');
 const date=new Date(p.fechaCreacion||Date.now());
 const fecha=isNaN(+date)?new Date().toLocaleDateString('es-PE'):date.toLocaleDateString('es-PE');
 const canvases=[];let ctx,y,pageNo=0;
 function font(size=10,bold=false){ctx.font=(bold?'bold ':'')+size+'px Arial, Helvetica, sans-serif';ctx.fillStyle=ink;}
 function text(s,x,yy,size=10,bold=false,color=ink,align='left'){
  font(size,bold);ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(txt(s),x,yy);ctx.textAlign='left';
 }
 function line(x1,yy,x2,col='#d5dfe5',width=1){ctx.fillStyle=col;ctx.fillRect(x1,yy,x2-x1,width);}
 function newPage(){
  const c=document.createElement('canvas');c.width=Math.round(WIDTH*SCALE);c.height=Math.round(HEIGHT*SCALE);
  ctx=c.getContext('2d');ctx.scale(SCALE,SCALE);ctx.fillStyle='#fff';ctx.fillRect(0,0,WIDTH,HEIGHT);
  canvases.push(c);pageNo++;y=46;
  text(nombre,40,35,11,true,blue);text('BOLETA  '+number,WIDTH-40,35,9,true,blue,'right');line(40,44,WIDTH-40,blue,1.5);
 }
 function reserve(h){if(y+h>HEIGHT-64)newPage();}
 function blockLabel(label,value,x,yy,maxWidth){
  text(label,x,yy,9,true);font(9);const ls=wrap(ctx,value,maxWidth);
  ls.forEach((l,i)=>text(l,x,yy+14+i*12,9,false));return 14+ls.length*12;
 }
 newPage();
 // Primera página: encabezado de comercio, número y cliente.
 if(image){try{const ratio=Math.min(46/image.width,46/image.height);ctx.drawImage(image,40,60,image.width*ratio,image.height*ratio);}catch(_){image=null;}}
 const nx=image?98:40;
 text(nombre,nx,79,18,true,'#162e42');
 text(telefono?'Teléfono: '+telefono:'Registro de venta',nx,96,10,false,gray);
 text('BOLETA',WIDTH-40,78,14,true,blue,'right');
 text('Boleta N.º '+number,WIDTH-40,95,10,true,ink,'right');
 text('Fecha: '+fecha,WIDTH-40,112,9,false,gray,'right');
 line(40,126,WIDTH-40,blue,2);y=144;
 ctx.fillStyle=pale;ctx.fillRect(40,y,WIDTH-80,35);
 text('Documento comercial de pedido / venta.',49,y+14,8,false,gray);
 text('No constituye comprobante electrónico autorizado por SUNAT.',49,y+26,8,false,gray);
 y+=54;
 text('DATOS DEL CLIENTE',40,y,11,true,blue);line(40,y+8,WIDTH-40);y+=26;
 const leftH=blockLabel('Cliente:',p.cliente||'Público general',40,y,230);
 const rightH=blockLabel('DNI / Documento:',p.dniCliente||'—',305,y,235);
 y+=Math.max(leftH,rightH)+8;
 const telH=blockLabel('Teléfono:',p.telefonoCliente||'—',40,y,230);
 const dirH=blockLabel('Dirección:',p.direccionCliente||'—',305,y,235);
 y+=Math.max(telH,dirH)+20;
 function tableHead(){
  text('DETALLE DE PRODUCTOS',40,y,11,true,blue);y+=16;
  ctx.fillStyle=blue;ctx.fillRect(40,y,WIDTH-80,27);
  text('Ítem',48,y+18,9,true,'#fff');text('Descripción / código',84,y+18,9,true,'#fff');
  text('Cant.',390,y+18,9,true,'#fff','right');text('P. unit.',463,y+18,9,true,'#fff','right');
  text('Importe',WIDTH-49,y+18,9,true,'#fff','right');y+=27;
 }
 reserve(54);tableHead();
 for(let i=0;i<items.length;i++){
  const item=items[i];font(9);const desc=wrap(ctx,item.nombre||'Producto',270);
  const code=item.codigo?'Código: '+item.codigo:'';
  const codeLines=code?wrap(ctx,code,270):[];
  const h=Math.max(34,10+desc.length*12+codeLines.length*11+5);
  if(y+h>HEIGHT-98){newPage();tableHead();}
  text(i+1,48,y+16,9);desc.forEach((v,j)=>text(v,84,y+15+j*12,9));
  codeLines.forEach((v,j)=>text(v,84,y+16+desc.length*12+j*11,8,false,gray));
  text(item.cantidad,390,y+16,9,false,ink,'right');text(money(item.precio),463,y+16,9,false,ink,'right');
  text(money(Number(item.cantidad)*Number(item.precio)),WIDTH-49,y+16,9,true,ink,'right');
  line(40,y+h,WIDTH-40);y+=h;
 }
 reserve(140);
 y+=21;text('Productos: '+items.length,40,y,10,false);text('Unidades: '+items.reduce((s,x)=>s+Number(x.cantidad||0),0),40,y+17,10,false);
 if(p.metodoPago)text('Forma de pago: '+p.metodoPago,40,y+34,10,false);
 ctx.fillStyle=pale;ctx.fillRect(314,y-10,WIDTH-354,53);line(314,y-10,WIDTH-40,blue,2);
 text('TOTAL A PAGAR',326,y+12,10,true,blue);text(money(total),WIDTH-52,y+32,15,true,blue,'right');y+=68;
 if(p.mensajePedido){font(9);const notes=wrap(ctx,p.mensajePedido,WIDTH-105);reserve(29+notes.length*13);text('Observaciones:',40,y,9,true);y+=15;notes.forEach(n=>{text(n,40,y,9);y+=13;});}
 canvases.forEach((c,index)=>{const context=c.getContext('2d');context.save();context.scale(SCALE,SCALE);context.fillStyle=gray;context.font='9px Arial';context.textAlign='center';context.fillText('Gracias por su compra · '+nombre,WIDTH/2,HEIGHT-39);context.fillText('Página '+(index+1)+' de '+canvases.length,WIDTH/2,HEIGHT-24);context.restore();});
 const pdf=pdfFromCanvases(canvases);const url=URL.createObjectURL(pdf);
 const a=document.createElement('a');a.href=url;a.download='Boleta_'+safeName(number)+'.pdf';a.style.display='none';document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
 if(typeof window.mostrarDialogoFinVenta==='function')window.mostrarDialogoFinVenta();
}
window.mostrarBoletaPDFComercial=function(pedidoElegido=null){
 let p=pedidoElegido;if(!p){try{p=JSON.parse(localStorage.getItem('ultimoPedido')||'null');}catch(_){p=null;}}
 if(!p){alert('Primero selecciona productos para generar la boleta.');return;}
 generate(p).catch(err=>{console.error('Error al descargar boleta PDF:',err);alert('No se pudo generar el PDF. Intenta nuevamente.');});
};
})();
