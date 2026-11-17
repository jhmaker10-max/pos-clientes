/* Códigos QR oficiales de cobro de la tienda: solo imágenes proporcionadas por el administrador. */
(()=>{'use strict';
 const methods=['Yape','Plin'];
 const key=m=>'qrPago'+m;
 const $=id=>document.getElementById(id);
 const valid=s=>typeof s==='string' && (/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(s)||/^https:\/\//i.test(s));
 const changed={};
 function preview(m){const img=$('qr'+m+'Vista');if(!img)return;const url=changed[m]!==undefined?changed[m]:localStorage.getItem(key(m));img.hidden=!valid(url);if(valid(url))img.src=url;else img.removeAttribute('src');const empty=$('qr'+m+'Vacio'),state=$('qr'+m+'Estado');if(empty)empty.hidden=valid(url);if(state){state.textContent=valid(url)?'Configurado':'Sin configurar';state.classList.toggle('qr-ready',valid(url));}const btn=$('qr'+m+'Quitar');if(btn)btn.disabled=!valid(url);}
 function compress(file){return new Promise((resolve,reject)=>{
  if(!/^image\/(png|jpeg|webp)$/.test(file.type)){reject(Error('Selecciona una imagen PNG, JPG o WebP.'));return;}
  if(file.size>10*1024*1024){reject(Error('La imagen supera 10 MB.'));return;}
  const reader=new FileReader();reader.onerror=()=>reject(Error('No se pudo leer la imagen.'));
  reader.onload=()=>{const im=new Image();im.onerror=()=>reject(Error('Imagen no válida.'));im.onload=()=>{
   const max=700,scale=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));
   const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.imageSmoothingEnabled=true;ctx.drawImage(im,0,0,c.width,c.height);
   let data=c.toDataURL('image/png');if(data.length>320000)data=c.toDataURL('image/jpeg',.9);
   if(data.length>320000){reject(Error('El QR es muy pesado. Recorta la imagen alrededor del código y vuelve a subirla.'));return;}resolve(data);
  };im.src=reader.result;};reader.readAsDataURL(file);
 });}
 function initAdmin(){for(const m of methods){preview(m);$('qr'+m+'Input')?.addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{changed[m]=await compress(f);preview(m)}catch(err){alert(err.message);e.target.value='';}});$('qr'+m+'Quitar')?.addEventListener('click',()=>{changed[m]='';if($('qr'+m+'Input'))$('qr'+m+'Input').value='';preview(m);});}}
 window.guardarQrPagosTienda=function(){for(const m of methods){if(changed[m]!==undefined){if(changed[m])localStorage.setItem(key(m),changed[m]);else localStorage.removeItem(key(m));delete changed[m];}}};
 window.refrescarQrPagosAdmin=function(){for(const m of methods)if(changed[m]===undefined)preview(m)};
 function paymentAmount(){const v=$('totalPedido')?.textContent||'';const m=v.match(/(?:S\/?\.?\s*)?([\d.,]+)\s*$/);return m?Number(m[1].replace(/,/g,''))||0:0;}
 function update(){const section=$('posQrCobro');if(!section)return;const m=document.querySelector('[name="metodoPagoPro"]:checked')?.value;section.hidden=!methods.includes(m);if(section.hidden)return;
 const url=localStorage.getItem(key(m)),ok=valid(url),img=$('posQrCobroImagen'),empty=$('posQrCobroVacio');
 $('posQrCobroTitulo').textContent='Pagar con '+m;$('posQrCobroMarca').textContent=m==='Yape'?'Y':'P';section.dataset.metodo=m.toLowerCase();
 $('posQrCobroMonto').textContent='S/ '+paymentAmount().toFixed(2);$('posQrCobroEstado').textContent=ok?'QR disponible':'Sin configurar';$('posQrCobroEstado').classList.toggle('qr-missing',!ok);
 img.hidden=!ok;if(ok){img.src=url;img.alt='QR de '+m;}else img.removeAttribute('src');if(empty)empty.hidden=ok;
 $('posQrCobroNota').textContent=ok?'Pide al cliente que escanee este código desde '+m+'.':'Configura el QR en Admin → Datos de la tienda.';
 }
 document.addEventListener('DOMContentLoaded',()=>{initAdmin();if($('posQrCobro')){document.querySelectorAll('[name="metodoPagoPro"]').forEach(r=>r.addEventListener('change',update));update();window.addEventListener('storage',update);const total=$('totalPedido');if(total)new MutationObserver(update).observe(total,{childList:true,subtree:true,characterData:true});}});
 window.actualizarQrCobro=update;
})();
