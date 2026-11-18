/* PAWA POS: ajustes de cuenta separados de los datos de caja. */
(()=>{
'use strict';
const TOKEN='pawa_cuenta_token_v1',CODE='pos_licencia_codigo',CACHE='pawa_estado_v1';
const API=(window.POS_LICENSE_API_URL||location.origin).replace(/\/$/,'');
const style=document.createElement('style');style.textContent=`
#pawa-cuenta-abrir{position:fixed;right:14px;bottom:78px;z-index:7000;padding:10px 15px;border:0;border-radius:30px;background:#0f766e;color:white;font:600 14px system-ui;box-shadow:0 4px 15px #0004;cursor:pointer}
#pawa-cuenta-fondo{position:fixed;inset:0;z-index:2147483647;background:#08111fcc;display:flex;justify-content:center;align-items:center;padding:16px;font:15px system-ui}
#pawa-cuenta-dialogo{background:#fff;color:#111827;border-radius:16px;max-width:460px;width:100%;max-height:90vh;overflow-y:auto;padding:22px;box-shadow:0 20px 60px #0006}
#pawa-cuenta-dialogo h2{margin:0 0 14px}#pawa-cuenta-dialogo p{line-height:1.5;overflow-wrap:anywhere}
#pawa-cuenta-dialogo button,#pawa-cuenta-dialogo input{box-sizing:border-box;width:100%;font:inherit;padding:11px;border-radius:9px;margin:7px 0}
#pawa-cuenta-dialogo input{border:1px solid #94a3b8}#pawa-cuenta-dialogo button{border:0;background:#0e7490;color:white;cursor:pointer;font-weight:600}
#pawa-cuenta-dialogo .danger{background:#b91c1c}#pawa-cuenta-dialogo .muted{background:#475569}`;document.head.append(style);
const token=()=>localStorage.getItem(TOKEN);
async function api(route,data={}){const r=await fetch(API+route,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token()},body:JSON.stringify(data)});const d=await r.json();if(!r.ok)throw Error(d.error||'Error del servidor');return d}
function el(tag,text,cls){const x=document.createElement(tag);if(text!=null)x.textContent=text;if(cls)x.className=cls;return x}
function btn(parent,text,fn,cls){const x=el('button',text,cls);x.type='button';x.onclick=fn;parent.append(x);return x}
function input(parent,placeholder,type='text'){const x=el('input');x.type=type;x.placeholder=placeholder;x.setAttribute('aria-label',placeholder);parent.append(x);return x}
function close(){document.getElementById('pawa-cuenta-fondo')?.remove()}
function modal(title){close();const bg=el('div'),box=el('section');bg.id='pawa-cuenta-fondo';box.id='pawa-cuenta-dialogo';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label',title);box.append(el('h2',title));bg.append(box);document.body.append(bg);btn(box,'Cerrar',close,'muted');return box}
async function open(){if(!token())return;const box=modal('Mi cuenta PAWA POS'),message=el('p','Cargando datos…');box.insertBefore(message,box.lastChild);try{
 const d=await api('/api/cuenta/perfil');message.replaceWith(el('div'));
 const info=el('div');for(const [name,value] of [['Tienda',d.tienda],['Correo',d.correo],['Verificado',d.verificado?'Sí':'No'],['Registro',new Date(d.creado).toLocaleDateString('es-PE')],['Prueba hasta',d.pruebaVence?new Date(d.pruebaVence).toLocaleString('es-PE'):'Sin comenzar'],['Licencias activas',String(d.licenciasActivas)]])info.append(el('p',name+': '+value));box.insertBefore(info,box.lastChild);
 btn(box,'Cerrar sesión',async()=>{const t=token();localStorage.removeItem(TOKEN);localStorage.removeItem(CACHE);localStorage.removeItem(CODE);sessionStorage.removeItem('adminOK');sessionStorage.removeItem('ventasOK');sessionStorage.removeItem('pawa_admin_autorizado');try{await fetch(API+'/api/cuenta/salir',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:'{}'})}catch(_){}location.href='inicio.html'},'muted');
 btn(box,'Eliminar mi cuenta',()=>deleting(box));
 }catch(e){message.textContent='No se pudieron cargar los datos: '+e.message}}
function deleting(box){box.replaceChildren(el('h2','Eliminar cuenta'));box.append(el('p','Esta acción elimina tu cuenta y sus sesiones del servidor, pero se conserva una huella protegida del correo para impedir otra prueba gratuita. No elimina automáticamente los productos y las ventas que estén guardados en este navegador. Exporta primero tus respaldos. Si tienes una licencia asociada deberás contactar al propietario.'));const pass=input(box,'Contraseña de tu cuenta','password'),confirmation=input(box,'Escribe ELIMINAR');const status=el('p');box.append(status);btn(box,'Eliminar definitivamente',async()=>{if(!confirm('¿Confirmas la eliminación de la cuenta?'))return;try{await api('/api/cuenta/eliminar',{password:pass.value,confirmacion:confirmation.value});localStorage.removeItem(TOKEN);localStorage.removeItem(CACHE);localStorage.removeItem(CODE);sessionStorage.clear();alert('Cuenta eliminada del servidor. Los datos locales permanecen en el navegador hasta que los borres.');location.href='inicio.html'}catch(e){status.textContent=e.message}},'danger');btn(box,'Cancelar',open,'muted')}
window.PAWAOpenAccount=open;
document.addEventListener('DOMContentLoaded',()=>{const b=el('button','Mi cuenta');b.id='pawa-cuenta-abrir';b.type='button';b.onclick=open;document.body.append(b);const update=()=>{b.hidden=!token()};update();window.addEventListener('storage',update)});
})();
