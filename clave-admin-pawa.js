(()=>{
'use strict';
const $=id=>document.getElementById(id);
async function init(){const api=window.POSAcceso?.apiAdmin;if(!api)return;const state=$('pawaAdminEstado');
 try{const status=await api('/api/admin-tienda/estado');state.textContent=status.configurada?'Contraseña configurada. Escribe la actual para cambiarla.':'Aún no hay contraseña. Configura una nueva para proteger tu tienda.';
  $('pawaAdminActualWrap').hidden=!status.configurada; $('pawaAdminBadge').textContent=status.configurada?'Protegida':'Sin configurar';
  if(!status.configurada){document.querySelectorAll('[data-admin-destino]').forEach(()=>{});if(sessionStorage.getItem('pawa_admin_pendiente_config')){sessionStorage.removeItem('pawa_admin_pendiente_config');setTimeout(()=>{if(typeof mostrarApartadoAdmin==='function')mostrarApartadoAdmin('panelTienda');$('pawaAdminNueva')?.focus()},350)}}
 }catch(e){state.textContent='No se pudo consultar la configuración: '+e.message}
 $('pawaAdminGuardarClave').onclick=async()=>{const actual=$('pawaAdminActual').value,nueva=$('pawaAdminNueva').value,confirmar=$('pawaAdminConfirmar').value;
  if(nueva.length<4||nueva.length>128){state.textContent='La contraseña debe tener entre 4 y 128 caracteres.';return} if(nueva!==confirmar){state.textContent='Las contraseñas no coinciden.';return}
  try{await api('/api/admin-tienda/configurar',{actual,nueva});$('pawaAdminActual').value='';$('pawaAdminNueva').value='';$('pawaAdminConfirmar').value='';$('pawaAdminActualWrap').hidden=false; $('pawaAdminBadge').textContent='Protegida';state.textContent='Contraseña guardada. Se solicitará al entrar nuevamente.';sessionStorage.setItem('adminOK','1')}catch(e){state.textContent=e.message}
 };
}
document.addEventListener('DOMContentLoaded',init);
})();
