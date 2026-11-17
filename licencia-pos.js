/* Validación de suscripción sin parpadeo del formulario entre páginas.
   La última comprobación permite hasta 1 hora de continuidad si la red falla.
   La validación remota continúa ejecutándose en cada página y periódicamente. */
(()=>{
  'use strict';
  const KEY='pos_licencia_codigo';
  const CACHE='pos_licencia_ultima_validacion';
  const API=(window.POS_LICENSE_API_URL||location.origin).replace(/\/$/,'');
  const OFFLINE_GRACE_MS=60*60*1000;
  const VERIFY_INTERVAL_MS=5*60*1000;
  let validating=false;
  let requestId=0;

  function cacheValida(code){
    if(!code)return false;
    try{
      const cache=JSON.parse(localStorage.getItem(CACHE)||'null');
      return !!(cache&&cache.code===code&&
        Number.isFinite(cache.verified)&&cache.verified<=Date.now()&&
        Date.now()-cache.verified<OFFLINE_GRACE_MS&&
        Number.isFinite(Date.parse(cache.expiresAt))&&Date.parse(cache.expiresAt)>Date.now());
    }catch(_){return false;}
  }

  function cerrarPantalla(){document.getElementById('licenciaBloqueo')?.remove();}

  function crearBase(){
    let capa=document.getElementById('licenciaBloqueo');
    if(!capa){
      capa=document.createElement('div');
      capa.id='licenciaBloqueo';
      capa.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#101827;color:white;display:grid;place-items:center;padding:16px;font:16px system-ui';
      document.body.append(capa);
    }
    capa.replaceChildren();
    return capa;
  }

  // Sólo indica que se está comprobando el acceso, sin mostrar el formulario.
  function mostrarEspera(){
    const capa=crearBase();
    const p=document.createElement('p');
    p.textContent='Comprobando suscripción…';
    p.style.cssText='font-weight:600;text-align:center';
    capa.append(p);
  }

  function mostrarFormulario(msg){
    const capa=crearBase();
    const box=document.createElement('section');
    box.style.cssText='background:#1e293b;border:1px solid #475569;padding:30px;border-radius:18px;max-width:400px;width:100%;box-shadow:0 20px 50px #0008';
    const title=document.createElement('h2');
    title.textContent='🔐 Licencia POS';
    const desc=document.createElement('p');
    desc.textContent=msg;
    const input=document.createElement('input');
    input.placeholder='Código de licencia';
    input.value=localStorage.getItem(KEY)||'';
    input.style.cssText='width:100%;padding:13px;border-radius:9px;border:1px solid #64748b;box-sizing:border-box;color:#111';
    const btn=document.createElement('button');
    btn.textContent='Verificar licencia';
    btn.style.cssText='margin-top:15px;width:100%;padding:13px;border:0;border-radius:9px;background:#38bdf8;color:#082f49;font-weight:bold;cursor:pointer';
    btn.onclick=async()=>{
      if(btn.disabled)return;
      const code=input.value.trim().toUpperCase();
      if(!code){desc.textContent='Introduce tu código de licencia.';return;}
      localStorage.setItem(KEY,code);
      localStorage.removeItem(CACHE);
      desc.textContent='Verificando licencia…';
      btn.disabled=true;
      await validar({manual:true});
    };
    box.append(title,desc,input,btn);
    capa.append(box);
  }

  async function validar({manual=false}={}){
    if(validating)return;
    const code=(localStorage.getItem(KEY)||'').trim().toUpperCase();
    if(!code){mostrarFormulario('Introduce el código que te entregó el propietario.');return;}
    const accesoAnterior=cacheValida(code);
    if(!accesoAnterior&&!manual)mostrarEspera();
    validating=true;
    const current=++requestId;
    try{
      const ctl=new AbortController();
      const timeout=setTimeout(()=>ctl.abort(),60000);
      let res;
      try{
        res=await fetch(API+'/api/licencia/verificar',{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({codigo:code}),signal:ctl.signal,cache:'no-store'
        });
      }finally{clearTimeout(timeout);}
      const data=await res.json();
      if(current!==requestId)return;
      if(res.ok&&data.activa){
        localStorage.setItem(CACHE,JSON.stringify({code,verified:Date.now(),expiresAt:data.vence}));
        cerrarPantalla();
      }else{
        localStorage.removeItem(CACHE);
        mostrarFormulario(data.mensaje||'Licencia suspendida, vencida o no encontrada. Comunícate con el proveedor.');
      }
    }catch(_){
      if(current!==requestId)return;
      if(cacheValida(code))cerrarPantalla();
      else mostrarFormulario('No se pudo verificar la suscripción. Conéctate a internet. La última validación permite hasta 1 hora de uso sin conexión si no ha vencido.');
    }finally{validating=false;}
  }

  document.addEventListener('DOMContentLoaded',()=>{
    if(location.protocol==='file:'){
      mostrarFormulario('Abre el POS desde un servidor web, no como archivo local.');
      return;
    }
    const code=localStorage.getItem(KEY);
    // Si hay una validación reciente, nunca mostrar por un instante el formulario.
    // Aun así, contactar siempre con Render en segundo plano para detectar bloqueos.
    if(!code)mostrarFormulario('Introduce el código que te entregó el propietario.');
    else if(!cacheValida(code))mostrarEspera();
    validar();
    setInterval(()=>validar(),VERIFY_INTERVAL_MS);
  });
})();
