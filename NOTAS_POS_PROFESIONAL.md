# POS Profesional 2.0 — basado en `pos-funciona.zip`

Esta versión mantiene las páginas originales, los colores 1–5, los carritos, la boleta térmica, la opción de vaciar o mantener el carrito y el registro de inventario existente.

## Mejoras añadidas
- Diseño de Inicio con tarjetas uniformes, menú lateral y carrito a la derecha en pantallas grandes; barra inferior móvil en Inicio, Escáner, Ventas y Administración.
- Dashboard con ventas del día, ingreso, stock bajo, valoración del stock a precio de venta y barras de los últimos siete días.
- Métodos de pago (Efectivo, Yape, Plin, Tarjeta), con cálculo de vuelto en efectivo; se guarda la selección con el pedido.
- Reportes de ventas por día, semana, mes y globales; resumen por método y productos más vendidos, exportación CSV apta para Excel y reporte imprimible/PDF.
- Historial de movimientos de inventario. Los movimientos nuevos de ajustes, entradas y salidas se guardan en `movimientos_stock`; las ventas ya se registraban en esa colección.
- Campo opcional de categoría al crear/editar producto; filtro por categoría en Inicio. Los productos anteriores sin categoría aparecen como General.
- Temas de color prediseñados; requieren guardar para conservarse.

## Antes de publicar
1. Haz una copia de seguridad de los archivos y datos actuales. La configuración y los pedidos usan Firebase; los carritos usan almacenamiento de sesión.
2. Prueba ventas desde Inicio y Escáner, comprobando que el stock se descuenta una vez. Comprueba inventario al mismo tiempo en dos dispositivos.
3. Prueba impresión PC/80 mm, compartir en iPhone/Printer A, PDF, selección Vaciar/Mantener y una reimpresión.
4. Comprueba las reglas de Firestore: la lectura de `pedidos`, `productos` y `movimientos_stock` y escritura de movimientos deben estar permitidas para usuarios autorizados.
5. Si empaquetas en Capacitor, reemplaza la carpeta `www` con los archivos de `pos/` y recompila. No basta con actualizar el ZIP en una APK antigua.

**Límites:** los botones de Yape/Plin/Tarjeta registran el método declarado, **no confirman ni procesan un pago**. El valor de inventario usa precio de venta, no costo. Los movimientos manuales antiguos no se reconstruyen. La exportación CSV es un archivo compatible con Excel, no XLSX nativo. Esta versión necesita pruebas reales de Firebase, impresora y móviles antes de uso comercial.
