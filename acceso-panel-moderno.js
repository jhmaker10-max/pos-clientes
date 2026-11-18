(function(){
'use strict';
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const API=(window.POS_LICENSE_API_URL||location.origin).replace(/\/$/,'');
async function apiAdmin(route,payload={}){const token=localStorage.getItem('pawa_cuenta_token_v1');if(!token)throw Error('Primero inicia sesión en PAWA POS');const r=await fetch(API+route,{method:'POST',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(payload)});const d=await r.json();if(!r.ok)throw Error(d.error||'Error de autenticación');return d;}

function getConfig(panel){
 return panel==='ventas'
  ? {titulo:'Acceso a ventas', subtitulo:'Consulta reportes, historial y reimpresión de boletas.', icono:'▤', etiqueta:'Contraseña de administrador'}
  : {titulo:'Acceso a administración', subtitulo:'Ingresa para gestionar productos, inventario y diseño de la tienda.', icono:'⚙', etiqueta:'Contraseña de administrador'};
}
function removeExisting(){document.querySelectorAll('.acceso-panel-overlay').forEach(x=>x.remove());document.body.classList.remove('acceso-panel-abierto');}
function solicitar(panel){
 removeExisting();
 const cfg=getConfig(panel);

 return new Promise(resolve=>{
  const overlay=document.createElement('div');
  overlay.className='acceso-panel-overlay';
  overlay.innerHTML=`<div class="acceso-panel-dialogo" role="dialog" aria-modal="true" aria-labelledby="accesoPanelTitulo">
   <button type="button" class="acceso-panel-cerrar" aria-label="Cerrar">✕</button>
   <div class="acceso-panel-marca"><span class="acceso-panel-icono" aria-hidden="true">${cfg.icono}</span><div><strong>POS</strong><small>Área protegida</small></div></div>
   <h2 id="accesoPanelTitulo">${escapeHtml(cfg.titulo)}</h2>
   <p class="acceso-panel-subtitulo">${escapeHtml(cfg.subtitulo)}</p>
   <label class="acceso-panel-label" for="accesoPanelInput">${escapeHtml(cfg.etiqueta)}</label>
   <div class="acceso-panel-campo"><input id="accesoPanelInput" type="password" placeholder="Ingresa la contraseña" autocomplete="current-password"><button type="button" class="acceso-panel-toggle" aria-label="Mostrar u ocultar contraseña">Mostrar</button></div>
   <p class="acceso-panel-ayuda">Por seguridad, la contraseña actual se valida localmente en este equipo.</p>
   <p class="acceso-panel-error" aria-live="polite"></p>
   <div class="acceso-panel-acciones"><button type="button" class="acceso-panel-secundario">Cancelar</button><button type="button" class="acceso-panel-primario">Ingresar</button></div>
  </div>`;
  const cerrar=ok=>{overlay.remove();document.body.classList.remove('acceso-panel-abierto');resolve(ok);};
  const dialog=overlay.querySelector('.acceso-panel-dialogo');
  const input=overlay.querySelector('#accesoPanelInput');
  const error=overlay.querySelector('.acceso-panel-error');
  const confirmar=()=>{
   apiAdmin('/api/admin-tienda/verificar',{password:input.value}).then(()=>cerrar(true)).catch(e=>{error.textContent=e.message;});
   dialog.classList.remove('acceso-panel-sacudir'); void dialog.offsetWidth; dialog.classList.add('acceso-panel-sacudir');
   input.select();
  };
  overlay.querySelector('.acceso-panel-cerrar').onclick=()=>cerrar(false);
  overlay.querySelector('.acceso-panel-secundario').onclick=()=>cerrar(false);
  overlay.querySelector('.acceso-panel-primario').onclick=confirmar;
  overlay.querySelector('.acceso-panel-toggle').onclick=e=>{
   const plain=input.type==='text';
   input.type=plain?'password':'text';
   e.currentTarget.textContent=plain?'Mostrar':'Ocultar';
   input.focus();
  };
  overlay.addEventListener('click',e=>{if(e.target===overlay)cerrar(false);});
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();confirmar();} if(e.key==='Escape'){cerrar(false);}});
  document.body.appendChild(overlay);
  document.body.classList.add('acceso-panel-abierto');
  setTimeout(()=>input.focus(),40);
 });
}
async function pedirPermiso(panel){
 try{const state=await apiAdmin('/api/admin-tienda/estado');
  if(!state.configurada){sessionStorage.setItem('pawa_admin_pendiente_config','1');return true}
  return await solicitar(panel);
 }catch(e){alert('No se pudo verificar el acceso de administración: '+e.message);return false}
}
async function entrarAdmin(){
 if(typeof cargarTiendaDesdeFirebase==='function'){try{await cargarTiendaDesdeFirebase();}catch(_){}}
 const ok=await pedirPermiso('admin');
 if(ok){sessionStorage.setItem('adminOK','1');location='administracion.html';}
}
async function verificarAccesoAdmin(){
 if(typeof cargarTiendaDesdeFirebase==='function'){try{await cargarTiendaDesdeFirebase();}catch(_){}}
 if(sessionStorage.getItem('adminOK')==='1')return true;
 const ok=await pedirPermiso('admin');
 if(!ok){location='inicio.html';return false;}
 sessionStorage.setItem('adminOK','1');
 return true;
}
async function verificarAccesoVentas(){
 if(sessionStorage.getItem('ventasOK')==='1')return true;
 const ok=await pedirPermiso('ventas');
 if(!ok){location='inicio.html';return false;}
 sessionStorage.setItem('ventasOK','1');
 return true;
}
window.POSAcceso={solicitar,entrarAdmin,verificarAccesoAdmin,verificarAccesoVentas,apiAdmin};
})();
