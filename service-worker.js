
const CACHE_NAME = "pawa-pos-acceso-pro-v20";

const APP_FILES = [
  "./",
  "inicio.html",
  "config-licencias.js?v=1",
  "licencia-pos.js?v=20",
  "cuenta-pawa.js?v=6",
  "pawa-paneles.css?v=6",
  "mi-cuenta.html",
  "clave-admin-pawa.js?v=1",
  "index.html",
  "estilos.css?v=91",
  "stock-alertas.js?v=88",
  "seguridad-pos-v25.js?v=69",
  "respaldo-pos-v25.js?v=56",
  "app.js?v=92",
  "scanner.html",
  "scanner-producto.html",
  "scanner-producto.js?v=1",
  "carrito.js?v=50",
  "scanner-multiple.js?v=105",
  "pedidos.html",
  "control_pedidos.html",
  "historial-ventas.js?v=57",
  "ventas-reportes-v24.js?v=55",
  "inventario.js?v=56",
  "pago-escaneado.js?v=56",
  "ticket_canvas.js?v=114",
  "boleta-supermercado.js?v=114",
  "pdf-descarga-directa.js?v=1",
  "fin-venta-carrito.js?v=50",
  "transparencia-productos.js?v=6",
  "tema.js?v=67",
  "firebase-cloud.js?v=67",
  "acceso-panel-moderno.js?v=58",
  "manifest.json",
  "pos-profesional.js?v=67",
  "icon-tienda.png"
];

// Guardar interfaz básica sin bloquear si un archivo falla
self.addEventListener("install", event=>{
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(APP_FILES.map(file=>cache.add(file).catch(()=>{})))
    )
  );
  self.skipWaiting();
});

// Activar nueva versión y eliminar cachés viejas
self.addEventListener("activate", event=>{
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))
      )
    ).then(()=>self.clients.claim())
  );
});

// HTML primero actualizado, recursos rápidos desde caché
self.addEventListener("fetch", event=>{
  const request=event.request;

  if(request.method!=="GET") return;

  const url=new URL(request.url);

  // Firebase siempre debe ir a red para tener datos actuales
  if(url.hostname.includes("firebase") || url.pathname.includes("firestore")){
    return;
  }

  // HTML y scripts propios: red primero; evita ejecutar versiones viejas.
  if(url.origin === self.location.origin && (url.pathname.endsWith(".js") || url.pathname.endsWith(".html") || url.pathname.endsWith(".css"))){
    event.respondWith(fetch(request).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(c=>c.put(request,copy));}
      return response;
    }).catch(()=>caches.match(request)));
    return;
  }

  // HTML: red primero, si falla usa caché
  if(request.headers.get("accept")?.includes("text/html")){
    event.respondWith(
      fetch(request)
      .then(response=>{
        const clone=response.clone();
        caches.open(CACHE_NAME).then(c=>c.put(request,clone));
        return response;
      })
      .catch(()=>caches.match(request))
    );
    return;
  }

  // JS/CSS/iconos: caché primero y actualiza detrás
  event.respondWith(
    caches.match(request).then(cached=>{
      const network=fetch(request).then(response=>{
        if(response && response.status===200){
          caches.open(CACHE_NAME).then(c=>c.put(request,response.clone()));
        }
        return response;
      }).catch(()=>cached);

      return cached || network;
    })
  );
});
