/* PAWA POS: cuenta registrada y prueba de 5 días controlada desde Neon. */
(()=>{
 'use strict';
 const API=(window.POS_LICENSE_API_URL||location.origin).replace(/\/$/,'');
 const TOKEN='pawa_cuenta_token_v1', CODE='pos_licencia_codigo', CACHE='pawa_estado_v1';
 const PHONE='51986109354';
 const wa=()=>`https://wa.me/${PHONE}?text=${encodeURIComponent('Hola, deseo adquirir una licencia para PAWA POS.')}`;
 let busy=false;
 const css='font:inherit;box-sizing:border-box;width:100%;padding:12px;border-radius:9px;border:1px solid #64748b;background:#fff;color:#111827';
 function layer(){let el=document.getElementById('licenciaBloqueo');if(!el){el=document.createElement('div');el.id='licenciaBloqueo';el.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#0b1220;color:#eaf3ff;display:grid;place-items:center;padding:16px;font:16px system-ui';document.body.append(el)}el.replaceChildren();return el}
 function wrapper(title,message){const l=layer(),s=document.createElement('section');s.style.cssText='background:#162338;border:1px solid #334155;border-radius:18px;max-width:450px;width:100%;padding:26px;box-shadow:0 25px 60px #0006';const h=document.createElement('h2');h.textContent=title;h.style.margin='0 0 10px';const p=document.createElement('p');p.textContent=message;p.style.cssText='color:#cbd5e1;line-height:1.55';s.append(h,p);l.append(s);return {s,p}}
 function button(text,onClick,background='#06b6d4'){const b=document.createElement('button');b.textContent=text;b.style.cssText=`font:inherit;display:block;margin-top:12px;width:100%;padding:13px;border:0;border-radius:9px;background:${background};color:white;cursor:pointer;font-weight:700`;b.onclick=onClick;return b}
 function linkBuy(s){const a=document.createElement('a');a.href=wa();a.target='_blank';a.rel='noopener noreferrer';a.textContent='Comprar licencia por WhatsApp: 986109354';a.style.cssText='display:block;margin-top:14px;padding:13px;background:#16a34a;color:white;text-align:center;border-radius:9px;text-decoration:none;font-weight:700';s.append(a)}
 function loading(){wrapper('PAWA POS','Comprobando tu acceso…')}
 async function request(route,payload,token){const response=await fetch(API+route,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(payload||{})});let data;try{data=await response.json()}catch(_){throw Error('Respuesta inesperada del servidor')};if(!response.ok)throw Error(data.error||'No se pudo completar la solicitud');return data}
 function accesoCuenta(message='Regístrate para recibir un código de verificación y comenzar tus 5 días gratuitos.'){
   const {s,p}=wrapper('Bienvenido a PAWA POS',message);let registro=true;
   const tienda=document.createElement('input');tienda.placeholder='Nombre de tu tienda';tienda.autocomplete='organization';tienda.style.cssText=css+';margin:8px 0';
   const correo=document.createElement('input');correo.type='email';correo.autocomplete='email';correo.placeholder='Correo electrónico';correo.style.cssText=css+';margin:8px 0';
   const pass=document.createElement('input');pass.type='password';pass.autocomplete='new-password';pass.placeholder='Contraseña (mínimo 10 caracteres)';pass.style.cssText=css+';margin:8px 0';
   const submit=button('Crear cuenta y continuar',async()=>{
     if(!correo.value.trim()||!pass.value||(registro&&!tienda.value.trim())){p.textContent='Completa todos los campos';return}
     submit.disabled=true;
     try{const d=await request(registro?'/api/cuenta/registrar':'/api/cuenta/entrar',{tienda:tienda.value,correo:correo.value,password:pass.value});
       if(d.pendienteVerificacion){verificacionCorreo(correo.value,pass.value,d.mensaje);return}
       localStorage.setItem(TOKEN,d.token);localStorage.removeItem(CACHE);loading();await verificar();
     }catch(e){p.textContent=e.message;submit.disabled=false}
   });
   const toggle=button('Ya tengo cuenta: iniciar sesión',()=>{registro=!registro;tienda.style.display=registro?'block':'none';submit.textContent=registro?'Crear cuenta y continuar':'Iniciar sesión';toggle.textContent=registro?'Ya tengo cuenta: iniciar sesión':'Crear una cuenta nueva';pass.autocomplete=registro?'new-password':'current-password'},'#334155');
   s.append(tienda,correo,pass,submit,toggle);linkBuy(s);
 }
 function verificacionCorreo(correo,password,message){
   const {s,p}=wrapper('📧 Verifica tu correo',message||`Pulsa <Enviar código> para recibirlo en ${correo}. Tu prueba comienza al verificarlo.`);
   const intro=document.createElement('div');
   intro.style.cssText='margin:14px 0 6px;padding:14px;border:1px solid #334155;border-radius:12px;background:#0f172a';
   intro.innerHTML=`<div style="font-weight:800;font-size:15px;margin-bottom:6px">✨ Verificación de cuenta</div><div style="color:#cbd5e1;line-height:1.55;font-size:14px">Introduce el código de 6 dígitos enviado a tu correo para activar tu acceso y comenzar tus <strong style="color:#fff">5 días gratis</strong>.</div>`;
   const label=document.createElement('div');label.textContent='🔐 Código de 6 dígitos';label.style.cssText='font-weight:700;font-size:14px;margin:12px 0 6px;color:#e2e8f0';
   const codigo=document.createElement('input');codigo.inputMode='numeric';codigo.maxLength=6;codigo.autocomplete='one-time-code';codigo.placeholder='Ingresa tu código aquí';codigo.style.cssText=css+';margin:0';
   const send=button('✅ Verificar y comenzar 5 días',async()=>{send.disabled=true;try{const d=await request('/api/cuenta/verificar',{correo,password,codigo:codigo.value});localStorage.setItem(TOKEN,d.token);localStorage.removeItem(CACHE);loading();await verificar()}catch(e){p.textContent=e.message;send.disabled=false}});
   const first=button('📨 Enviar código',async()=>{
     first.disabled=true;try{const d=await request('/api/cuenta/enviar',{correo,password});p.textContent=d.mensaje||'📬 Revisa tu correo para encontrar el código.'}
     catch(e){p.textContent=e.message}finally{first.disabled=false}
   });
   const resend=button('🔁 Reenviar código',async()=>{
     resend.disabled=true;try{const d=await request('/api/cuenta/reenviar',{correo,password});p.textContent=d.mensaje||'📬 Se solicitó un nuevo código.'}
     catch(e){p.textContent=e.message}finally{resend.disabled=false}
   },'#334155');
   const actions=document.createElement('div');
   actions.style.cssText='display:flex;align-items:stretch;gap:10px;width:100%;margin-top:12px';
   for(const b of [first,resend]){b.style.flex='1 1 0';b.style.minWidth='0';b.style.width='auto';b.style.marginTop='0';b.style.padding='12px 8px';b.style.fontSize='clamp(12px,3.1vw,14px)';b.style.whiteSpace='nowrap';}
   actions.append(first,resend);
   const help=document.createElement('div');help.textContent='💡 Si no ves el correo de inmediato, revisa también la carpeta de spam o promociones.';help.style.cssText='margin-top:10px;color:#94a3b8;font-size:13px;line-height:1.45';
   const back=button('⬅️ Volver al inicio de sesión',()=>accesoCuenta(),'#334155');s.append(intro,label,codigo,actions,help,send,back);
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
