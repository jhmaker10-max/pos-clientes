/* PAWA POS: ajustes de cuenta separados de los datos de caja. */
(()=>{
'use strict';
const TOKEN='pawa_cuenta_token_v1',CODE='pos_licencia_codigo',CACHE='pawa_estado_v1';
const API=(window.POS_LICENSE_API_URL||location.origin).replace(/\/$/,'');
const style=document.createElement('link');style.rel='stylesheet';style.href='pawa-paneles.css?v=4';document.head.append(style);
const token=()=>localStorage.getItem(TOKEN);
async function api(route,data={}){const r=await fetch(API+route,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token()},body:JSON.stringify(data)});const d=await r.json();if(!r.ok)throw Error(d.error||'Error del servidor');return d}
function el(tag,text,cls){const x=document.createElement(tag);if(text!=null)x.textContent=text;if(cls)x.className=cls;return x}
function btn(parent,text,fn,cls){const x=el('button',text,cls);x.type='button';x.onclick=fn;parent.append(x);return x}
function input(parent,placeholder,type='text'){const x=el('input');x.type=type;x.placeholder=placeholder;x.setAttribute('aria-label',placeholder);parent.append(x);return x}
function modal(title){
 // Panel completo dentro de mi-cuenta.html, nunca ventana flotante.
 if(!document.body.classList.contains('pawa-cuenta-pagina')){location.href='mi-cuenta.html';return null}
 const root=document.getElementById('pawa-cuenta-panel');
 root.replaceChildren();
 const heading=el('header');heading.className='pawa-account-header';
 heading.innerHTML='<div class="pawa-account-brand"><span class="pawa-account-avatar" aria-hidden="true">◉</span><div><span class="pawa-eyebrow">CENTRO DE CUENTA</span><h2></h2><p>Consulta tu suscripción y administra tus datos de acceso</p></div></div>';
 heading.querySelector('h2').textContent=title;
 const body=el('div');body.className='pawa-account-body';body.id='pawa-cuenta-contenido';
 root.append(heading,body);
 document.title=title+' · PAWA POS';
 return body;
}
function row(parent,label,value){const r=el('div');r.className='pawa-account-detail';r.append(el('span',label),el('strong',value||'—'));parent.append(r)}
async function open(){if(!document.body.classList.contains('pawa-cuenta-pagina')){location.href='mi-cuenta.html';return}const box=modal('Mi cuenta');if(!token()){box.append(el('p','Inicia sesión para consultar los datos de tu cuenta.','pawa-account-loading'));return}const loading=el('p','Cargando información de la cuenta…','pawa-account-loading');box.append(loading);
 try{
 const d=await api('/api/cuenta/perfil');loading.remove();
 const top=el('section');top.className='pawa-account-summary';
 const mark=el('div','⌂','pawa-account-store-icon');top.append(mark);
 const info=el('div');info.className='pawa-account-store';info.append(el('span','MI NEGOCIO','pawa-eyebrow'),el('h3',d.tienda||'Mi tienda'),el('p',d.correo||''));top.append(info);
 top.append(el('span',d.verificado?'✓ Verificado':'Pendiente','pawa-account-pill'+(d.verificado?'':' pending')));box.append(top);
 const stats=el('section');stats.className='pawa-account-stats';
 const licensed=Number(d.licenciasActivas||0)>0;
 for(const [a,b] of [['Estado',licensed?'Licencia activa':d.pruebaVence?'Prueba gratuita':'Sin prueba'],['Licencias',String(d.licenciasActivas??0)],['Verificación',d.verificado?'Confirmada':'Pendiente']]){const c=el('article');c.append(el('small',a),el('strong',b));stats.append(c)}box.append(stats);
 const card=el('section');card.className='pawa-account-card';card.append(el('h3','Información de la cuenta'));
 row(card,'Nombre de la tienda',d.tienda);row(card,'Correo electrónico',d.correo);
 row(card,'Fecha de registro',d.creado?new Date(d.creado).toLocaleDateString('es-PE'):'—');
 row(card,'Fin de prueba',d.pruebaVence?new Date(d.pruebaVence).toLocaleString('es-PE'):'Sin comenzar');
 box.append(card);
 const actions=el('section');actions.className='pawa-account-actions';actions.append(el('h3','Gestionar acceso'));
 btn(actions,'↪ Cerrar sesión',async()=>{const t=token();localStorage.removeItem(TOKEN);localStorage.removeItem(CACHE);localStorage.removeItem(CODE);sessionStorage.removeItem('adminOK');sessionStorage.removeItem('ventasOK');sessionStorage.removeItem('pawa_admin_autorizado');try{await fetch(API+'/api/cuenta/salir',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:'{}'})}catch(_){}location.href='inicio.html'},'pawa-account-logout');
 btn(actions,'Eliminar mi cuenta',()=>deleting(),'pawa-account-delete');box.append(actions);
 }catch(e){loading.textContent='No se pudieron cargar los datos: '+e.message}
}
function deleting(){const box=modal('Eliminar cuenta');const warning=el('section');warning.className='pawa-account-warning';warning.append(el('h3','Esta acción no se puede deshacer'),el('p','Tu cuenta y sesiones se eliminarán del servidor. Los productos y ventas de este navegador NO se borran automáticamente. Exporta un respaldo antes de continuar. Si tienes una licencia asociada, contacta al propietario. Se conservará una huella protegida del correo para impedir otra prueba gratuita.'));box.append(warning);
 const form=el('section');form.className='pawa-account-card';const pass=input(form,'Contraseña de tu cuenta','password'),confirmation=input(form,'Escribe ELIMINAR');const status=el('p');status.className='pawa-security-notice';status.setAttribute('role','status');form.append(status);
 btn(form,'Eliminar definitivamente',async()=>{if(confirmation.value!=='ELIMINAR'){status.textContent='Escribe ELIMINAR para confirmar.';return}if(!confirm('¿Confirmas la eliminación definitiva de tu cuenta?'))return;try{await api('/api/cuenta/eliminar',{password:pass.value,confirmacion:confirmation.value});localStorage.removeItem(TOKEN);localStorage.removeItem(CACHE);localStorage.removeItem(CODE);sessionStorage.clear();alert('Cuenta eliminada. Los datos locales permanecen en el navegador.');location.href='inicio.html'}catch(e){status.textContent=e.message}},'pawa-account-delete');btn(form,'Volver a Mi cuenta',open,'pawa-account-logout');box.append(form);
}
window.PAWAOpenAccount=()=>{location.href='mi-cuenta.html'};
document.addEventListener('DOMContentLoaded',()=>{
 if(document.body.classList.contains('pawa-cuenta-pagina'))open();
 const makeLink=(container,kind)=>{
  if(!container||container.querySelector('.pawa-cuenta-nav'))return;
  const a=document.createElement('a');a.href='mi-cuenta.html';a.className='pawa-cuenta-nav';a.setAttribute('aria-label','Abrir Mi cuenta');
  if(kind==='mobile')a.innerHTML='<span class="pawa-cuenta-icono" aria-hidden="true">♙</span><span>Mi cuenta</span>';
  else a.innerHTML='<span aria-hidden="true">♙</span> <span>Mi cuenta</span>';
  
  const admin=container.querySelector('a[href="administracion.html"]');
  if(admin)admin.after(a);else container.append(a);
 };
 document.querySelectorAll('.pos-pro-nav,.scan-pro-sidebar,.ventas-pro-sidebar,.pedido-pro-sidebar').forEach(nav=>makeLink(nav,'desktop'));
 document.querySelectorAll('.pos-pro-bottom-nav').forEach(nav=>makeLink(nav,'mobile'));
 const adminNav=document.querySelector('.pos-admin-sidebar');
 if(adminNav){const a=document.createElement('a');a.href='mi-cuenta.html';a.className='pawa-cuenta-nav pawa-cuenta-admin-link';a.innerHTML='<span aria-hidden="true">♙</span> Mi cuenta';const back=adminNav.querySelector('.pos-admin-sidebar-inicio');if(back)back.before(a);else adminNav.append(a)}
});
})();
