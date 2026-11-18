/* Modo local: compatibilidad con las funciones existentes, sin Firebase. */
const firebaseConfig={projectId:'pos_local_v1'};
const LL_PREFIX='pos_local_coleccion_';
const LL_GET=(c)=>{try{let x=JSON.parse(localStorage.getItem(LL_PREFIX+c)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch(_){return {}}};
const LL_SAVE=(c,x)=>{localStorage.setItem(LL_PREFIX+c,JSON.stringify(x));window.dispatchEvent(new CustomEvent('pos-local-cambio',{detail:{coleccion:c}}))};
const LL_CLONE=x=>JSON.parse(JSON.stringify(x));
const LL_DOC=(id,data)=>({id:String(id),exists:data!==undefined,data:()=>data===undefined?undefined:LL_CLONE(data)});
const LL_SNAP=(map)=>({metadata:{fromCache:false},docs:Object.entries(map).map(([id,d])=>LL_DOC(id,d)),forEach(fn){this.docs.forEach(fn)},get empty(){return !this.docs.length}});
let LL_QUEUE=Promise.resolve();
const cloudDB={
 collection(c){return {
  doc(id){id=String(id);const ref={_c:c,_id:id,
    async get(){return LL_DOC(id,LL_GET(c)[id])},
    async set(data,opt={}){const all=LL_GET(c);all[id]=opt.merge?{...(all[id]||{}),...LL_CLONE(data)}:LL_CLONE(data);LL_SAVE(c,all)},
    async update(data){const all=LL_GET(c);if(!Object.hasOwn(all,id))throw Error('Registro no encontrado');all[id]={...all[id],...LL_CLONE(data)};LL_SAVE(c,all)},
    async delete(){const all=LL_GET(c);delete all[id];LL_SAVE(c,all)}
   };return ref},
  async get(){return LL_SNAP(LL_GET(c))},
  onSnapshot(options,callback,error){if(typeof options==='function'){error=callback;callback=options}let active=true;const update=()=>{if(active)try{callback(LL_SNAP(LL_GET(c)))}catch(e){if(error)error(e)}};let scheduled=Promise.resolve().then(update);const handler=e=>{if(e.detail?.coleccion===c)update()};window.addEventListener('pos-local-cambio',handler);return ()=>{active=false;window.removeEventListener('pos-local-cambio',handler)}}
 }},
 async runTransaction(fn){const job=LL_QUEUE.then(async()=>{const writes=[];let readOnly=true;const tx={
  get:async ref=>LL_DOC(ref._id,LL_GET(ref._c)[ref._id]),
  set(ref,data,opt){writes.push({ref,data:LL_CLONE(data),op:'set',opt});readOnly=false},
  update(ref,data){writes.push({ref,data:LL_CLONE(data),op:'update'});readOnly=false},
  delete(ref){writes.push({ref,op:'delete'});readOnly=false}
 };const result=await fn(tx);for(const w of writes){let all=LL_GET(w.ref._c),id=w.ref._id;if(w.op==='delete')delete all[id];else if(w.op==='update')all[id]={...(all[id]||{}),...w.data};else all[id]=w.opt?.merge?{...(all[id]||{}),...w.data}:w.data;LL_SAVE(w.ref._c,all)}return result});LL_QUEUE=job.catch(()=>{});return job}
};
function actualizarManifestDesdeFirebase(){ /* PAWA POS usa un icono de instalación fijo. */ }
async function sincronizarProductoFirebase(p){await cloudDB.collection('productos').doc(String(p.id)).set(p)}
async function actualizarProductoFirebase(p){await cloudDB.collection('productos').doc(String(p.id)).set(p,{merge:true})}
async function eliminarProductoFirebase(id){await cloudDB.collection('productos').doc(String(id)).delete()}
async function sincronizarProductosFirebase(){return true}
const CONFIG_KEYS=['nombreTienda','contactoTienda','mensajeTienda','mensajeTicket','claveAdmin','colorFondoTienda','colorPrincipalTienda','colorProductoTienda','colorDatosTienda','colorContornoTienda','colorBordesTienda','colorSuaveTienda','colorNombreProductoTienda','logoTienda','logoTiendaURL','logoURL','qrPagoYape','qrPagoPlin'];
async function sincronizarTiendaFirebase(){const data={};for(const k of CONFIG_KEYS)data[k]=localStorage.getItem(k)||'';await cloudDB.collection('configuracion').doc('tienda').set(data);return true}
async function cargarTiendaDesdeFirebase(){const d=await cloudDB.collection('configuracion').doc('tienda').get();if(d.exists){for(const [k,v] of Object.entries(d.data()))if(typeof v==='string')localStorage.setItem(k,v);if(typeof aplicarColoresTienda==='function')aplicarColoresTienda()}return true}
async function sincronizarPedidoFirebase(p){await cloudDB.collection('pedidos').doc(String(p.numero)).set(p)}
async function cargarPedidosFirebase(){const s=await cloudDB.collection('pedidos').get(),arr=[];s.forEach(d=>arr.push(d.data()));if(arr.length)localStorage.setItem('pedidos',JSON.stringify(arr))}
async function actualizarEstadoPedidoFirebase(p){await sincronizarPedidoFirebase(p)}
async function subirLogoFirebase(v){localStorage.setItem('logoTienda',v||'');return v||''}
async function subirLogoPWAFirebase(){throw Error('El icono oficial de PAWA POS no se puede modificar')}
let ultimoErrorProductosFirebase=null,productosVigentesFirebase=[],catalogoVerificadoDisponible=true,productosConfirmadosPorServidor=false,cancelarEscuchaProductos=null,promesaPrimeraCargaProductos=null;
function guardarCatalogoVerificado(p){try{localStorage.setItem('productos',JSON.stringify(p))}catch(_){}}
function cargarProductosDesdeFirebase(){if(productosConfirmadosPorServidor)return Promise.resolve(true);if(promesaPrimeraCargaProductos)return promesaPrimeraCargaProductos;promesaPrimeraCargaProductos=new Promise(resolve=>{let first=true;try{cancelarEscuchaProductos=cloudDB.collection('productos').onSnapshot({},snap=>{const arr=[];snap.forEach(d=>arr.push({...d.data(),id:d.data()?.id??d.id}));productosVigentesFirebase=arr;productosConfirmadosPorServidor=true;guardarCatalogoVerificado(arr);if(typeof window.catalogoOfflineGuardar==='function')window.catalogoOfflineGuardar(arr);if(typeof cargarProductos==='function')cargarProductos();if(typeof window.renderizarInventario==='function')window.renderizarInventario();if(typeof renderizarInicioCache==='function')renderizarInicioCache();window.dispatchEvent(new Event('pos-catalogo-actualizado'));if(first){first=false;resolve(true)}},e=>{ultimoErrorProductosFirebase=e;if(first){first=false;resolve(false)}})}catch(e){ultimoErrorProductosFirebase=e;resolve(false)}});return promesaPrimeraCargaProductos}
function mensajeErrorProductosFirebase(){return ultimoErrorProductosFirebase?.message||'No fue posible leer los productos locales'}
window.addEventListener('load',()=>{if(!document.getElementById('productosInicio')&&!document.getElementById('listaProductos')){cargarTiendaDesdeFirebase();cargarProductosDesdeFirebase()}});
