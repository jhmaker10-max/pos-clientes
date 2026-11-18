/* PAWA POS: cuenta registrada y prueba de 5 días controlada desde Neon. */
(()=>{
 'use strict';
 const API=(window.POS_LICENSE_API_URL||location.origin).replace(/\/$/,'');
 const TOKEN='pawa_cuenta_token_v1', CODE='pos_licencia_codigo', CACHE='pawa_estado_v1';
 const PHONE='51986109354';
 const wa=()=>`https://wa.me/${PHONE}?text=${encodeURIComponent('Hola, deseo adquirir una licencia para PAWA POS.')}`;
 let busy=false;
 const css='font:inherit;box-sizing:border-box;width:100%;padding:12px;border-radius:9px;border:1px solid #64748b;background:#fff;color:#111827';
 function layer(){let el=document.getElementById('licenciaBloqueo');if(!el){el=document.createElement('div');el.id='licenciaBloqueo';el.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#0b1220;color:#eaf3ff;display:flex;flex-direction:column;align-items:center;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:16px max(12px,env(safe-area-inset-right)) calc(16px + env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));box-sizing:border-box;font:16px system-ui';document.body.append(el)}el.replaceChildren();return el}
 function wrapper(title,message){const l=layer(),s=document.createElement('section');s.style.cssText='background:#162338;border:1px solid #334155;border-radius:18px;max-width:450px;width:100%;margin:auto 0;flex:none;box-sizing:border-box;padding:clamp(16px,4vw,26px);box-shadow:0 25px 60px #0006';const h=document.createElement('h2');h.textContent=title;h.style.margin='0 0 10px';const p=document.createElement('p');p.textContent=message;p.style.cssText='color:#cbd5e1;line-height:1.55';s.append(h,p);l.append(s);return {s,p}}
 function button(text,onClick,background='#06b6d4'){const b=document.createElement('button');b.textContent=text;b.style.cssText=`font:inherit;display:block;margin-top:12px;width:100%;padding:13px;border:0;border-radius:9px;background:${background};color:white;cursor:pointer;font-weight:700`;b.onclick=onClick;return b}
 function linkBuy(s){
   const panel=document.createElement('div');panel.style.cssText='margin-top:20px;padding:16px;background:linear-gradient(145deg,#102d2a,#102639);border:1px solid #2c695c;border-radius:14px';
   const heading=document.createElement('div');heading.textContent='💚 ¿Prefieres una licencia completa?';heading.style.cssText='font-size:15px;font-weight:800;color:#f0fdf4;margin-bottom:6px';
   const info=document.createElement('p');info.textContent='Activa PAWA POS para tu negocio. Consulta los planes disponibles directamente con nosotros.';info.style.cssText='color:#cbd5e1;font-size:13px;line-height:1.5;margin:0 0 12px';
   const a=document.createElement('a');a.href=wa();a.target='_blank';a.rel='noopener noreferrer';a.textContent='💬 Comprar licencia por WhatsApp';a.style.cssText='display:block;padding:14px 10px;background:#16a34a;color:#fff;text-align:center;border-radius:10px;text-decoration:none;font-weight:800;font-size:14px;box-shadow:0 4px 16px #16a34a44;transition:filter .15s';
   a.addEventListener('mouseenter',()=>a.style.filter='brightness(1.12)');a.addEventListener('mouseleave',()=>a.style.filter='');
   const phone=document.createElement('div');phone.textContent='📱 Atención: 986 109 354';phone.style.cssText='font-size:12px;color:#a7f3d0;text-align:center;margin-top:10px';
   panel.append(heading,info,a,phone);s.append(panel)
 }
 function loading(){wrapper('PAWA POS','Comprobando tu acceso…')}
 async function request(route,payload,token){const response=await fetch(API+route,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(payload||{})});let data;try{data=await response.json()}catch(_){throw Error('Respuesta inesperada del servidor')};if(!response.ok)throw Error(data.error||'No se pudo completar la solicitud');return data}
 function accesoCuenta(message='Regístrate para recibir un código de verificación y comenzar tus 5 días gratuitos.'){
   const {s,p}=wrapper('🏪 Bienvenido a PAWA POS',message);let registro=true;
   const header=document.createElement('div');header.style.cssText='margin:14px 0;padding:15px;background:#0f172a;border:1px solid #334155;border-radius:13px';
   const subtitle=document.createElement('div');subtitle.textContent='✨ Crea tu espacio de trabajo';subtitle.style.cssText='font-size:15px;font-weight:800;color:#f8fafc;margin-bottom:6px';
   const description=document.createElement('div');description.textContent='Registra tu tienda, confirma tu correo y prueba PAWA POS durante 5 días gratis.';description.style.cssText='font-size:13px;line-height:1.55;color:#cbd5e1';
   header.append(subtitle,description);
   function field(text,el){const wrap=document.createElement('div');wrap.style.cssText='margin-top:12px';const lbl=document.createElement('label');lbl.textContent=text;lbl.style.cssText='display:block;margin-bottom:6px;font-size:13px;font-weight:700;color:#e2e8f0';wrap.append(lbl,el);return wrap}
   const tienda=document.createElement('input');tienda.placeholder='Ej. Mi Bodega';tienda.autocomplete='organization';tienda.style.cssText=css+';margin:0';
   const tiendaField=field('🏬 Nombre de tu tienda',tienda);
   const correo=document.createElement('input');correo.type='email';correo.autocomplete='email';correo.placeholder='tucorreo@ejemplo.com';correo.style.cssText=css+';margin:0';
   const correoField=field('📧 Correo electrónico',correo);
   const pass=document.createElement('input');pass.type='password';pass.autocomplete='new-password';pass.placeholder='Mínimo 10 caracteres';pass.style.cssText=css+';margin:0';
   const passField=field('🔐 Crear contraseña',pass);
   const submit=button('✅ Crear cuenta y continuar',async()=>{
     if(!correo.value.trim()||!pass.value||(registro&&!tienda.value.trim())){p.textContent='Completa todos los campos';return}
     submit.disabled=true;
     try{const d=await request(registro?'/api/cuenta/registrar':'/api/cuenta/entrar',{tienda:tienda.value,correo:correo.value,password:pass.value});
       if(d.pendienteVerificacion){verificacionCorreo(correo.value,pass.value,d.mensaje);return}
       localStorage.setItem(TOKEN,d.token);localStorage.removeItem(CACHE);loading();await verificar();
     }catch(e){p.textContent=e.message;submit.disabled=false}
   });
   const toggle=button('🔑 Ya tengo cuenta: iniciar sesión',()=>{
     registro=!registro;
     tiendaField.style.display=registro?'block':'none';
     subtitle.textContent=registro?'✨ Crea tu espacio de trabajo':'👋 Qué bueno verte de nuevo';
     description.textContent=registro?'Registra tu tienda, confirma tu correo y prueba PAWA POS durante 5 días gratis.':'Ingresa con tu correo y contraseña para continuar donde te quedaste.';
     submit.textContent=registro?'✅ Crear cuenta y continuar':'🔓 Iniciar sesión';
     toggle.textContent=registro?'🔑 Ya tengo cuenta: iniciar sesión':'✨ Crear una cuenta nueva';
     passField.querySelector('label').textContent=registro?'🔐 Crear contraseña':'🔒 Tu contraseña';
     pass.placeholder=registro?'Mínimo 10 caracteres':'Introduce tu contraseña';
     pass.autocomplete=registro?'new-password':'current-password';
   },'#334155');
   const help=document.createElement('div');help.textContent='🛡️ Tus datos de acceso son personales. Nunca compartas tu contraseña.';help.style.cssText='font-size:12px;color:#94a3b8;line-height:1.5;margin-top:12px';
   s.append(header,tiendaField,correoField,passField,submit,toggle,help);linkBuy(s);
 }
 function verificacionCorreo(correo,password,message){
   const {s,p}=wrapper('📧 Verifica tu correo',message||`Pulsa «Enviar código» para recibirlo en ${correo}. Tu prueba comienza al verificarlo.`);
   const intro=document.createElement('div');
   intro.style.cssText='margin:14px 0 6px;padding:14px;border:1px solid #334155;border-radius:12px;background:#0f172a';
   intro.innerHTML=`<div style="font-weight:800;font-size:15px;margin-bottom:6px">✨ Verificación de cuenta</div><div style="color:#cbd5e1;line-height:1.55;font-size:14px">Introduce el código de 6 dígitos enviado a tu correo para activar tu acceso y comenzar tus <strong style="color:#fff">5 días gratis</strong>.</div>`;
   const label=document.createElement('div');label.textContent='🔐 Código de 6 dígitos';label.style.cssText='font-weight:700;font-size:14px;margin:12px 0 6px;color:#e2e8f0';
   const codigo=document.createElement('input');codigo.inputMode='numeric';codigo.maxLength=6;codigo.autocomplete='one-time-code';codigo.placeholder='Ingresa tu código aquí';codigo.style.cssText=css+';margin:0';
   const send=button('✅ Verificar y comenzar 5 días',async()=>{send.disabled=true;try{const d=await request('/api/cuenta/verificar',{correo,password,codigo:codigo.value});localStorage.setItem(TOKEN,d.token);localStorage.removeItem(CACHE);loading();await verificar()}catch(e){p.textContent=e.message;send.disabled=false}});
   // Estados visibles de envío, sin confundir aceptación de Brevo con entrega en Gmail.
   const estado=document.createElement('div');
   estado.setAttribute('role','status');estado.setAttribute('aria-live','polite');
   estado.style.cssText='display:none;margin-top:12px;padding:12px 13px;border-radius:11px;font-size:13px;font-weight:650;line-height:1.5;border:1px solid transparent';
   function informar(tipo,texto){
     const estilos={
       pendiente:['#0c3043','#0891b2','#d6f4ff'],
       correcto:['#103b32','#15803d','#dcfce7'],
       error:['#451c27','#b91c1c','#fee2e2']
     }[tipo];
     estado.style.display='block';estado.style.background=estilos[0];estado.style.borderColor=estilos[1];estado.style.color=estilos[2];estado.textContent=texto;
   }
   let enviando=false,disponibleDesde=0,contador=null;
   const first=button('📨 Enviar código',()=>solicitarCodigo('enviar'));
   const resend=button('🔁 Reenviar código',()=>solicitarCodigo('reenviar'),'#334155');
   function actualizarBotones(){
     const restante=Math.max(0,Math.ceil((disponibleDesde-Date.now())/1000));
     first.disabled=resend.disabled=enviando||restante>0;
     first.textContent=enviando?'⏳ Enviando…':restante>0?`✅ Enviado (${restante}s)`:'📨 Enviar código';
     resend.textContent=enviando?'⏳ Procesando…':restante>0?`🔁 Reenviar (${restante}s)`:'🔁 Reenviar código';
     for(const b of [first,resend]){b.style.opacity=b.disabled?'0.7':'1';b.style.cursor=b.disabled?'not-allowed':'pointer'}
     if(!enviando&&restante===0&&contador){clearInterval(contador);contador=null}
   }
   async function solicitarCodigo(tipo){
     if(enviando||Date.now()<disponibleDesde)return;
     enviando=true;actualizarBotones();
     informar('pendiente',tipo==='enviar'?'⏳ Estamos solicitando tu código de verificación…':'⏳ Estamos solicitando el reenvío de tu código…');
     try{
       await request(tipo==='enviar'?'/api/cuenta/enviar':'/api/cuenta/reenviar',{correo,password});
       informar('correcto','✅ Solicitud aceptada. El código fue enviado a Brevo. Revisa tu correo y la carpeta de spam.');
       disponibleDesde=Date.now()+60000;
       if(contador)clearInterval(contador);
       contador=setInterval(()=>{if(!estado.isConnected){clearInterval(contador);contador=null;return}actualizarBotones()},1000);
     }catch(e){
       informar('error','⚠️ No se pudo solicitar el código: '+e.message+'. Puedes volver a intentarlo.');
     }finally{enviando=false;actualizarBotones()}
   }
   const actions=document.createElement('div');
   actions.style.cssText='display:flex;align-items:stretch;gap:10px;width:100%;margin-top:12px';
   for(const b of [first,resend]){b.style.flex='1 1 0';b.style.minWidth='0';b.style.width='auto';b.style.marginTop='0';b.style.padding='12px 6px';b.style.fontSize='clamp(11px,3vw,14px)';b.style.whiteSpace='normal';b.style.lineHeight='1.3';}
   actions.append(first,resend);
   const help=document.createElement('div');help.textContent='💡 Si no recibes el correo, revisa spam o promociones. Espera 60 segundos antes de solicitar otro código.';help.style.cssText='margin-top:10px;color:#94a3b8;font-size:13px;line-height:1.45';
   const back=button('⬅️ Volver al inicio de sesión',()=>accesoCuenta(),'#334155');s.append(intro,label,codigo,actions,estado,help,send,back);
 }
 function vencido(message){const {s,p}=wrapper('Tu prueba gratuita terminó',message||'Tus 5 días de prueba han finalizado. Adquiere una licencia para continuar utilizando PAWA POS.');linkBuy(s);
   const code=document.createElement('input');code.placeholder='Introduce tu código de licencia';code.autocomplete='off';code.style.cssText=css+';margin-top:16px';code.value=localStorage.getItem(CODE)||'';
   const send=button('Activar mi licencia',async()=>{if(!code.value.trim()){p.textContent='Introduce tu código';return}localStorage.setItem(CODE,code.value.trim().toUpperCase());loading();await verificar()});
   const profile=button('Mi cuenta / Eliminar cuenta',()=>{if(window.PAWAOpenAccount)window.PAWAOpenAccount();else p.textContent='No se pudo abrir Mi cuenta. Recarga la página.'},'#0f766e');
   const logout=button('Usar otra cuenta',async()=>{const t=localStorage.getItem(TOKEN);localStorage.removeItem(TOKEN);localStorage.removeItem(CACHE);if(t)request('/api/cuenta/salir',{},t).catch(()=>{});accesoCuenta()},'#334155');s.append(code,send,profile,logout);
 }
 async function verificar(){if(busy)return;busy=true;try{
   const token=localStorage.getItem(TOKEN);if(!token){accesoCuenta();return}
   const d=await request('/api/acceso/estado',{codigo:localStorage.getItem(CODE)||''},token);
   if(d.acceso){localStorage.setItem(CACHE,JSON.stringify({checked:Date.now(),expiry:Date.parse(d.vence),tipo:d.tipo}));document.getElementById('licenciaBloqueo')?.remove();if(d.tipo==='prueba')console.info(`PAWA POS: ${Math.ceil(d.segundosRestantes/86400)} día(s) de prueba restantes`)}
   else{localStorage.removeItem(CACHE);vencido(d.mensaje)}
 }catch(e){const m=String(e.message||'');if(m.includes('Inicia sesión')){localStorage.removeItem(TOKEN);accesoCuenta('Tu sesión terminó. Vuelve a iniciar sesión.')}else if(m.includes('Licencia inválida')){localStorage.removeItem(CODE);vencido(m)}else{const c=JSON.parse(localStorage.getItem(CACHE)||'null');if(c&&c.checked<=Date.now()&&Date.now()-c.checked<15*60*1000&&c.expiry>Date.now())document.getElementById('licenciaBloqueo')?.remove();else vencido('No se pudo verificar el acceso. Comprueba tu conexión e inténtalo de nuevo. '+m)}}finally{busy=false}}
 document.addEventListener('DOMContentLoaded',()=>{if(document.body.classList.contains('pawa-cuenta-pagina'))return;if(location.protocol==='file:'){wrapper('PAWA POS','Abre el POS desde GitHub Pages o un servidor web.');return}loading();verificar();setInterval(verificar,5*60*1000)});
})();
