(()=>{
'use strict';
const $=id=>document.getElementById(id);
async function init(){const api=window.POSAcceso?.apiAdmin;if(!api)return;const state=$('pawaAdminEstado');
 try{const status=await api('/api/admin-tienda/estado');state.textContent=status.configurada?'Contraseña configurada. Escribe la actual para cambiarla.':'Aún no hay contraseña. Configura una nueva para proteger tu tienda.';
  $('pawaAdminActual').hidden=!status.configurada;
  if(!status.configurada){document.querySelectorAll('[data-admin-destino]').forEach(()=>{});if(sessionStorage.getItem('pawa_admin_pendiente_config')){sessionStorage.removeItem('pawa_admin_pendiente_config');setTimeout(()=>{if(typeof mostrarApartadoAdmin==='function')mostrarApartadoAdmin('panelTienda');$('pawaAdminNueva')?.focus()},350)}}
 }catch(e){state.textContent='No se pudo consultar la configuración: '+e.message}
 $('pawaAdminGuardarClave').onclick=async()=>{const actual=$('pawaAdminActual').value,nueva=$('pawaAdminNueva').value,confirmar=$('pawaAdminConfirmar').value;
  if(nueva.length<10||nueva!==confirmar){state.textContent='Introduce una contraseña de 10 caracteres o más y confirma que coincida.';return}
  try{await api('/api/admin-tienda/configurar',{actual,nueva});$('pawaAdminActual').value='';$('pawaAdminNueva').value='';$('pawaAdminConfirmar').value='';$('pawaAdminActual').hidden=false;state.textContent='Contraseña guardada. Se solicitará al entrar nuevamente.';sessionStorage.setItem('adminOK','1')}catch(e){state.textContent=e.message}
 };
}
document.addEventListener('DOMContentLoaded',init);
})();
