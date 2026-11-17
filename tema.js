// Tema editable de la tienda: vista previa, persistencia y aplicación global.
const COLORES_ORIGINALES = { fondo: "#fff7fb", principal: "#d96c9d", producto: "#ffffff", datos: "#4d3040", contorno: "#d8c2ce", bordes: "#e7d8e1", suave: "#f8eef4", nombre: "#303646" };
const esColorHex = valor => typeof valor === "string" && /^#[0-9a-fA-F]{6}$/.test(valor);
function leerColor(clave, alternativo) {
  try { const c = localStorage.getItem(clave); return esColorHex(c) ? c : alternativo; }
  catch (_) { return alternativo; }
}
function suavizarColor(hex) {
  return "#" + [1,3,5].map(i => {
    const n = parseInt(hex.slice(i,i+2), 16);
    return Math.round(n * .44 + 255 * .56).toString(16).padStart(2,"0");
  }).join("");
}
function contrasteColor(hex) {
  const c = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16) / 255);
  const luz = c.map(x => x <= .04045 ? x / 12.92 : ((x+.055)/1.055)**2.4);
  return luz[0]*.2126+luz[1]*.7152+luz[2]*.0722 > .40 ? "#28212a" : "#ffffff";
}
function aplicarColoresTienda(fondo, principal, producto, datos, contorno, bordes, suave, nombre) {
  fondo = esColorHex(fondo) ? fondo : leerColor("colorFondoTienda", COLORES_ORIGINALES.fondo);
  principal = esColorHex(principal) ? principal : leerColor("colorPrincipalTienda", COLORES_ORIGINALES.principal);
  producto = esColorHex(producto) ? producto : leerColor("colorProductoTienda", COLORES_ORIGINALES.producto);
  datos = esColorHex(datos) ? datos : leerColor("colorDatosTienda", COLORES_ORIGINALES.datos);
  contorno = esColorHex(contorno) ? contorno : leerColor("colorContornoTienda", COLORES_ORIGINALES.contorno);
  bordes = esColorHex(bordes) ? bordes : leerColor("colorBordesTienda", COLORES_ORIGINALES.bordes);
  suave = esColorHex(suave) ? suave : leerColor("colorSuaveTienda", COLORES_ORIGINALES.suave);
  nombre = esColorHex(nombre) ? nombre : leerColor("colorNombreProductoTienda", COLORES_ORIGINALES.nombre);
  const raiz = document.documentElement;
  raiz.style.setProperty("--fondo", fondo);
  raiz.style.setProperty("--producto-fondo", producto);
  raiz.style.setProperty("--producto-datos-color", datos);
  raiz.style.setProperty("--producto-contorno-color", contorno);
  raiz.style.setProperty("--producto-nombre-color", nombre);
  raiz.style.setProperty("--borde-ui", bordes);
  raiz.style.setProperty("--superficie-suave", suave);
  raiz.style.setProperty("--rosa", principal);
  raiz.style.setProperty("--texto", principal);
  raiz.style.setProperty("--rosa2", suavizarColor(principal));
  raiz.style.setProperty("--texto-sobre-principal", contrasteColor(principal));
  raiz.style.setProperty("--texto-sobre-datos", contrasteColor(datos));
  const vista = document.getElementById("vistaPreviaColores");
  if (vista) {
    vista.style.setProperty("--fondo", fondo);
    vista.style.setProperty("--producto-fondo", producto);
    vista.style.setProperty("--producto-datos-color", datos);
    vista.style.setProperty("--producto-contorno-color", contorno);
    vista.style.setProperty("--producto-nombre-color", nombre);
    vista.style.setProperty("--borde-ui", bordes);
    vista.style.setProperty("--superficie-suave", suave);
    vista.style.setProperty("--rosa", principal);
    vista.style.setProperty("--texto", principal);
    vista.style.setProperty("--rosa2", suavizarColor(principal));
    vista.style.setProperty("--texto-sobre-principal", contrasteColor(principal));
    vista.style.setProperty("--texto-sobre-datos", contrasteColor(datos));
  }
  const valorNombre = document.getElementById("valorColorNombreProducto");
  if(valorNombre) valorNombre.textContent = nombre.toUpperCase();
  const valorBordes = document.getElementById("valorColorBordes");
  if(valorBordes) valorBordes.textContent = bordes.toUpperCase();
  const valorSuave = document.getElementById("valorColorSuave");
  if(valorSuave) valorSuave.textContent = suave.toUpperCase();
  const valorContorno = document.getElementById("valorColorContorno");
  if (valorContorno) valorContorno.textContent = contorno.toUpperCase();
  const valorDatos = document.getElementById("valorColorDatos");
  if (valorDatos) valorDatos.textContent = datos.toUpperCase();
  const valorProducto = document.getElementById("valorColorProducto");
  if (valorProducto) valorProducto.textContent = producto.toUpperCase();
  const valorFondo = document.getElementById("valorColorFondo");
  const valorPrincipal = document.getElementById("valorColorPrincipal");
  if (valorFondo) valorFondo.textContent = fondo.toUpperCase();
  if (valorPrincipal) valorPrincipal.textContent = principal.toUpperCase();
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", principal);
}
function cargarSelectoresColores() {
  const fondo = leerColor("colorFondoTienda", COLORES_ORIGINALES.fondo);
  const principal = leerColor("colorPrincipalTienda", COLORES_ORIGINALES.principal);
  const producto = leerColor("colorProductoTienda", COLORES_ORIGINALES.producto);
  const datos = leerColor("colorDatosTienda", COLORES_ORIGINALES.datos);
  const contorno = leerColor("colorContornoTienda", COLORES_ORIGINALES.contorno);
  const bordes = leerColor("colorBordesTienda", COLORES_ORIGINALES.bordes);
  const suave = leerColor("colorSuaveTienda", COLORES_ORIGINALES.suave);
  const nombre = leerColor("colorNombreProductoTienda", COLORES_ORIGINALES.nombre);
  const inputNombre = document.getElementById("colorNombreProducto");
  if(inputNombre) inputNombre.value = nombre;
  const inputBordes = document.getElementById("colorBordes");
  if(inputBordes) inputBordes.value = bordes;
  const inputSuave = document.getElementById("colorSuave");
  if(inputSuave) inputSuave.value = suave;
  const inputDatos = document.getElementById("colorDatos");
  if (inputDatos) inputDatos.value = datos;
  const inputProducto = document.getElementById("colorProducto");
  if (inputProducto) inputProducto.value = producto;
  const inputFondo = document.getElementById("colorFondo");
  const inputPrincipal = document.getElementById("colorPrincipal");
  if (inputFondo) inputFondo.value = fondo;
  if (inputPrincipal) inputPrincipal.value = principal;
  const inputContorno = document.getElementById("colorContorno");
  if (inputContorno) inputContorno.value = contorno;
  aplicarColoresTienda(fondo, principal, producto, datos, contorno, bordes, suave, nombre);
}
function previsualizarColores() {
  const fondo = document.getElementById("colorFondo")?.value;
  const principal = document.getElementById("colorPrincipal")?.value;
  aplicarColoresTienda(fondo, principal, document.getElementById("colorProducto")?.value, document.getElementById("colorDatos")?.value, document.getElementById("colorContorno")?.value, document.getElementById("colorBordes")?.value, document.getElementById("colorSuave")?.value, document.getElementById("colorNombreProducto")?.value);
  const aviso = document.getElementById("estadoColores");
  if (aviso) aviso.textContent = "Vista previa activa. Pulsa GUARDAR CAMBIOS para publicar los colores.";
}
function restaurarColores() {
  document.getElementById("colorFondo").value = COLORES_ORIGINALES.fondo;
  document.getElementById("colorPrincipal").value = COLORES_ORIGINALES.principal;
  document.getElementById("colorProducto").value = COLORES_ORIGINALES.producto;
  document.getElementById("colorDatos").value = COLORES_ORIGINALES.datos;
  document.getElementById("colorContorno").value = COLORES_ORIGINALES.contorno;
  document.getElementById("colorBordes").value = COLORES_ORIGINALES.bordes;
  document.getElementById("colorSuave").value = COLORES_ORIGINALES.suave;
  document.getElementById("colorNombreProducto").value = COLORES_ORIGINALES.nombre;
  previsualizarColores();
}
function guardarColoresLocalmente() {
  const fondo = document.getElementById("colorFondo")?.value;
  const principal = document.getElementById("colorPrincipal")?.value;
  const producto = document.getElementById("colorProducto")?.value;
  const datos = document.getElementById("colorDatos")?.value;
  const contorno = document.getElementById("colorContorno")?.value;
  const bordes = document.getElementById("colorBordes")?.value;
  const suave = document.getElementById("colorSuave")?.value;
  const nombre = document.getElementById("colorNombreProducto")?.value;
  if (!esColorHex(fondo) || !esColorHex(principal) || !esColorHex(producto) || !esColorHex(datos) || !esColorHex(contorno) || !esColorHex(bordes) || !esColorHex(suave) || !esColorHex(nombre)) throw new Error("Colores no válidos");
  localStorage.setItem("colorFondoTienda", fondo);
  localStorage.setItem("colorPrincipalTienda", principal);
  localStorage.setItem("colorProductoTienda", producto);
  localStorage.setItem("colorDatosTienda", datos);
  localStorage.setItem("colorContornoTienda", contorno);
  localStorage.setItem("colorBordesTienda", bordes);
  localStorage.setItem("colorSuaveTienda", suave);
  localStorage.setItem("colorNombreProductoTienda", nombre);
  aplicarColoresTienda(fondo, principal, producto, datos, contorno, bordes, suave, nombre);
}
// Aplicar la última configuración conocida antes de que se abra la página.
aplicarColoresTienda();
window.addEventListener("storage", e => {
  if (["colorFondoTienda", "colorPrincipalTienda", "colorProductoTienda", "colorDatosTienda", "colorContornoTienda", "colorBordesTienda", "colorSuaveTienda", "colorNombreProductoTienda"].includes(e.key)) {
    if (document.getElementById("colorFondo")) cargarSelectoresColores();
    else aplicarColoresTienda();
  }
});
