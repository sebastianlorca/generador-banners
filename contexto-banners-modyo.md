# Contexto: generador de banners e integración con Modyo

Última actualización: 14 de noviembre de 2026.

## Estado consolidado para retomar (14 de noviembre de 2026)

Esta sección, actualizada con la confirmación del usuario del 14 de noviembre, prevalece sobre los pendientes y estados históricos del documento. Los detalles de implementación del 13 de noviembre siguen vigentes. Los cambios siguientes están implementados en local, tanto Individual como Masivo cuando corresponda; no se trasladaron ni publicaron en Modyo.

### Cambios realizados

- Estilos del generador local (14 de noviembre): `mvp-modyo.css` se renombró a `mvp-local.css` y se actualizó el enlace de `mvp.html`. El contenido de los estilos se conserva; Individual y Masivo usan la nueva ruta. Prueba de navegador con servicios simulados y `git diff --check` correctos. Las campañas continúan dependiendo de los endpoints de Modyo. Recargar con Ctrl+F5.
- Imagen personalizada mediante archivo adjunto (14 de noviembre): el generador local reemplaza el input de URL por un selector de archivos de imagen en Individual y Masivo. Adjuntar selecciona automáticamente la opción 11 y actualiza los formatos generados, conservando blancos y transparencia. Se puede alternar con el catálogo y reutilizar el archivo al regenerar el mismo producto; cambiar el ID limpia el adjunto. Si falta el archivo o no se puede decodificar, vuelve a la imagen 1. El archivo se procesa en el navegador, no se sube ni persiste tras recargar. Las URLs Blob de carga se liberan al terminar. Prueba Edge con servicios simulados y sintaxis JavaScript correctas, incluyendo adjunto, blancos, alternancia y archivo inválido. No se trasladó a Modyo. Esta sección reemplaza las instrucciones históricas de URL personalizada para el entorno local.
- Títulos automáticos según el nombre (14 de noviembre): notebooks y desktop reconocen IdeaPad/Gamer, parlantes reconocen Portátil y monitores reconocen Gamer/Curvo. Se usa solo la primera característica reconocida según su posición en el nombre (gamer curvo → Monitor Gamer; curvo gamer → Monitor Curvo), sin repetirla si ya aparece en la familia. Sin coincidencias se conserva familia + marca. Implementado en `mvp-local-generator.js` para Individual y Masivo; conserva títulos editados al regenerar el mismo ID y la separación visual de marca. No se trasladó a Modyo. Validación: 14 casos de títulos, sintaxis JavaScript y prueba de navegador Edge con servicios simulados correctos. Recargar con Ctrl+F5; los productos ya cargados conservan su título, por lo que hay que recargar la página o cambiar el ID para obtener el nuevo automático.
- Carga de Google Sheets por semana: elegir W01–W52 antes de pulsar «Cargar / actualizar semana». Se consultan diez filas de esa hoja en paralelo, sin descargar el Excel completo. Espera de 120 segundos por consulta y 150 segundos en navegador.
- Campaña independiente por banner desde la planilla, cruzada con las cinco entradas configuradas. Masivo no requiere elegir una campaña en Individual; se corrigió el bloqueo del botón Generar por esa validación antigua.
- Resumen masivo en tarjetas: nombre completo, IDs, campaña, celda de referencia, estados y formatos seleccionables. Contador de banners listos y por revisar. Las pestañas de resultados mantienen sus etiquetas abreviadas.
- Portaprecios SVG superpuestos al fondo, reemplazando las figuras antiguas en los formatos asignados. SVG horizontal siempre conserva su verde; el segundo SVG oculta solo `DCTO` si no hay descuento. Mini Tótem mantiene su caja anterior.
- ® al 50 % del tamaño del texto de marca, elevado, en los títulos y líneas de marca.
- Principal Mobile, Principal simple, FHD y Horizontal 3840: marca arriba, título sin repetir la marca debajo y nombre del producto en la línea siguiente. Los títulos compartidos del editor se conservan; la separación se aplica al dibujar esos cuatro formatos.
- Vistas previas con enlaces Blob: clic o clic derecho para abrir en otra pestaña, PNG/WebP según selección, actualizados tras ediciones válidas. Son URLs temporales del navegador.

| Formato | Portaprecio actual | Texto superior |
| --- | --- | --- |
| Principal simple, un producto | Segundo SVG, DCTO condicional | Marca → título sin marca → nombre |
| Principal doble y triple | SVG horizontal, verde permanente | Título compartido con marca → nombre |
| Principal Mobile | Segundo SVG, DCTO condicional | Marca → título sin marca → nombre |
| Storie | SVG horizontal, verde permanente | Título compartido con marca → nombre |
| FHD | Segundo SVG, DCTO condicional | Marca → título sin marca → nombre |
| Horizontal 5760 | SVG horizontal, verde permanente | Título compartido con marca → nombre |
| Horizontal 3840 | Segundo SVG, DCTO condicional | Marca → título sin marca → nombre |
| Mini Tótem | Caja anterior dibujada por código | Título compartido con marca → nombre |

### Validación, archivos y reinicio

- Última validación del 14 de noviembre: `node --check mvp-local-generator.js`, `python test_banners_browser.py` y `git diff --check` correctos tras reemplazar la URL personalizada por archivo adjunto. La prueba de navegador cubre selección automática de la opción 11, conservación de blancos, retorno al catálogo, reutilización del adjunto y fallback ante archivo inválido. Los cambios de títulos y adjuntos se validaron con servicios simulados; la confirmación previa del usuario sobre recursos reales corresponde al estado anterior a estas dos mejoras.
- Comprobación automatizada registrada después del cambio de Horizontal 3840: pasó `python test_banners_browser.py` en Edge con servicios simulados, `node --check mvp-local-generator.js` y `git diff --check`. Las ocho pruebas de planilla pasaron durante el cambio de carga por semana. Se verificaron Blob PNG/WebP y píxeles de los SVG. El 14 de noviembre el usuario confirmó como completadas la revisión visual con recursos reales y la comprobación de ambos ciclos completos (antiguos pendientes 1 y 2).
- Archivos de esta serie de cambios: `mvp-local-generator.js`, `mvp-batch.js`, `mvp-batch.css`, `mvp.html`, `mvp-local.js`, `servidor-mvp.py`, `planilla_banners.py`, ambas pruebas y este contexto. `ejemplos de banners/` contiene las referencias del usuario.
- Para aplicar los últimos cambios visuales: Ctrl+F5 y generar otra vez. Si todavía corre el servidor anterior al cambio de carga por semana, cerrar Python y ejecutar `iniciar-mvp.cmd` antes de recargar. Cambiar semana limpia el lote y requiere cargarla de nuevo.
- El 14 de noviembre el usuario confirmó como completado el guardado y envío de los cambios en Git (antiguo pendiente 6). No se registraron aquí hashes ni detalles del envío. Esa confirmación es anterior a las mejoras de títulos automáticos y archivos adjuntos: no se hizo commit ni push de esas mejoras ni de las actualizaciones posteriores del contexto en esta conversación. No se modificaron los archivos del widget Modyo ni se publicó un despliegue.

### Pendientes completados (confirmación del usuario, 14 de noviembre de 2026)

- Punto 1: revisión visual de banners con campañas, fondos limpios y productos reales, incluyendo posiciones, títulos largos, portaprecios, ® reducido y los cuatro formatos con marca separada.
- Punto 2: comprobación de ambos ciclos completos con carga por semana, precios y campañas distintos, errores parciales, ediciones, descargas PNG/WebP, apertura Blob y revisión de tiempos y memoria con un lote real. No se consignaron métricas en esta actualización.
- Punto 6: guardado y envío de los cambios en Git, conservando el historial.

### Pendientes vigentes

1. Trasladar expresamente las mejoras locales validadas a Modyo, incluidos los nuevos títulos automáticos y el selector de archivos para imagen personalizada, y verificar CORS, campañas, imágenes, Canvas y exportación en el CMS (antiguo punto 4). Los SVG están embebidos localmente; no existen nuevos campos de portaprecio en las entradas.
2. Si se requieren campañas adicionales, ampliar las cinco entradas configuradas o implementar un listado dinámico. Mini Tótem aún no tiene asignación de uno de los nuevos SVG (antiguo punto 5).

Ya no son pendientes locales: reducir ®, separar fondos y portaprecios con los SVG acordados, campaña por banner desde planilla, elegir semana antes de cargar, la corrección del botón Generar en Masivo, las reglas de títulos automáticos y reemplazar la URL personalizada por archivo adjunto.

## Marca y título separados en Horizontal 3840 (13 de noviembre de 2026)

- Horizontal 3840 local muestra marca con ® al 50 % arriba, título sin repetir la marca debajo y nombre del producto en la siguiente línea, según `ejemplos de banners/Banners Completos/PANTALLA-HORIZONTAL-3840X1080 -.png`.
- Conserva posiciones, tamaños y portaprecio SVG; utiliza la extracción de marca compartida con Mobile, Principal simple y FHD. Aplica a Individual y Masivo locales. No modifica el widget Modyo. Recargar con Ctrl+F5 y generar nuevamente.

## Marca y título separados en FHD (13 de noviembre de 2026)

- FHD local muestra marca con ® al 50 % arriba, título sin repetir la marca debajo y nombre del producto en la siguiente línea. Se conservan las posiciones y tamaños, ya alineados con `ejemplos de banners/Banners Completos/PANTALLA FHD 1920X1080 -.png`; se aplica la misma extracción del sufijo de marca usada en Mobile y Principal simple.
- Aplica a Individual y Masivo locales. No modifica el widget Modyo. Recargar con Ctrl+F5 y generar nuevamente.

## Abrir vistas previas Blob en otra pestaña (13 de noviembre de 2026)

- Cada canvas generado localmente está dentro de un enlace a una imagen Blob, con `target="_blank"`. Permite clic directo o clic derecho → Abrir enlace en una pestaña nueva, en los siete formatos y en Individual/Masivo.
- Se crean las imágenes con el formato PNG/WebP seleccionado y se actualizan después de cambios válidos de texto, precios, imágenes o ajustes. Una pausa de 180 ms evita exportar cada movimiento de un control; durante la actualización se retira el enlace anterior para no abrir una versión desactualizada.
- Se liberan las URLs reemplazadas y al invalidar resultados o salir de la página. Los Blob son temporales del navegador, no URLs públicas ni almacenamiento permanente. No se modificó el widget Modyo.
- Validación de navegador con servicios simulados: enlaces Blob PNG en Masivo, actualización al cambiar precios, y 19 enlaces WebP en Individual con siete formatos y tres productos, además del flujo existente de generación y descarga. Recargar con Ctrl+F5 y generar nuevamente.

## Marca primero en Principal simple (13 de noviembre de 2026)

- Principal de escritorio con un producto muestra marca con ® al 50 %, título sin repetir la marca y nombre del producto debajo, antes del portaprecio. Referencia: `ejemplos de banners/Banners Completos/MODYO BANNER PPAL-SIMPLE 1920x525.png`.
- Comparte con Mobile la extracción del sufijo de marca del título; conserva el título editable compartido para los demás formatos. Aplica a Individual y Masivo locales. No cambia Principal doble/triple ni el widget Modyo. Recargar con Ctrl+F5 y generar nuevamente.

## Marca primero en Principal Mobile (13 de noviembre de 2026)

- Principal Mobile local presenta marca con ® reducido, título y nombre del producto en tres líneas, siguiendo `ejemplos de banners/Banners Completos/556x416.png`.
- El título mobile elimina la marca del final del título compartido para evitar duplicarla (el título automático sigue siendo familia + marca en el editor y demás formatos). Los títulos manuales se conservan, salvo ese sufijo de marca. Cada línea se ajusta al ancho disponible sobre el portaprecio.
- Aplica a Individual y Masivo locales. No modifica otros formatos ni el widget Modyo. Recargar con Ctrl+F5 y generar nuevamente.

## Símbolo de marca al 50 % (13 de noviembre de 2026)

- Implementado en el generador local: los títulos automáticos y líneas de marca dibujan ® al 50 % del tamaño del texto que acompaña, elevado junto a la marca. El resto del texto conserva su tamaño; la medición de ancho y los saltos de línea consideran el tamaño reducido.
- Aplica a los siete formatos en Individual y Masivo. Los campos editables conservan el carácter ® normal. Reemplaza el pendiente histórico de reducir el símbolo. No se modificó el widget Modyo. Recargar con Ctrl+F5 y generar nuevamente.

## Portaprecios SVG aplicados en local (13 de noviembre de 2026)

- Se integraron los dos SVG proporcionados por el usuario como capas independientes del fondo, embebidos en `mvp-local-generator.js`. Se cargan una vez por generador y se reutilizan al editar. Sus márgenes transparentes se recortan al dibujar para mantener las posiciones y dimensiones de las cajas existentes.
- SVG horizontal (gris `#42474a`, verde `#8ee8b2`): Principal doble, Principal triple, Storie y Horizontal 5760. Conserva siempre su zona verde, incluso sin descuento; el porcentaje solo aparece cuando es positivo. El precio no se expande hacia la zona verde al desaparecer el porcentaje.
- Segundo SVG, denominado vertical internamente (gris `#45494b`, verde `#a9e4b0`): Principal simple, Mobile, FHD y Horizontal 3840. El grupo `DCTO` se oculta mediante `display="none"` cuando el descuento calculado es cero; también sucede si no hay referencial válido. Se conserva el grupo `PRECIO`. Se actualiza al editar precios o alternar fuentes.
- Mini Tótem conserva el portaprecio anterior: el usuario no lo incluyó en la asignación. Se eliminaron los parches antiguos que copiaban partes del fondo en Mobile y Horizontal 3840 y el rectángulo blanco de FHD. Usar fondos limpios: los SVG no pueden eliminar portaprecios ya incluidos en una imagen de fondo.
- Aplica a Individual y Masivo locales. No se modificó ni publicó el widget Modyo; no se añadieron campos nuevos a las entradas de campaña. Recargar con Ctrl+F5 y generar nuevamente.
- Validación: sintaxis JavaScript y prueba Edge con servicios simulados, generación de siete formatos, descargas PNG/WebP y comprobación de píxeles reales del verde de ambos SVG. Se verificó que DCTO desaparece y reaparece al cambiar precios y que el horizontal conserva el verde sin descuento. Pendiente revisión visual con fondos y productos reales.
- Esta implementación reemplaza el pendiente de portaprecios PNG y su regla genérica anterior: la nueva asignación SVG y la excepción del horizontal prevalecen.

## Propuesta histórica de fondo y portaprecio separados — reemplazada por los SVG (13 de noviembre de 2026)

Nota: lo siguiente conserva la propuesta inicial con PNG. La implementación vigente es la asignación SVG descrita arriba; no tratar esta propuesta como un pendiente actual del generador local.

- El usuario confirmó la intención de cargar el fondo y el portaprecio como recursos independientes. Se confirmó la viabilidad; todavía no se ha modificado el generador para este comportamiento.
- Referencia de banner completo: `ejemplos de banners/Banners Completos/556x416.png`.
- Referencia de fondo sin portaprecio: `ejemplos de banners/Fondos/Destacados/556x416.png`.
- El portaprecio se superpone al fondo. Si el producto tiene descuento válido según el cálculo existente (referencial mayor que oferta y mayor que cero), usar `ejemplos de banners/Fondos Porta Precios/portaprecio vertical.png` y mostrar el porcentaje.
- Si no tiene descuento, usar `ejemplos de banners/Fondos Porta Precios/caja-precio.png`: no mostrar la zona verde del descuento ni el porcentaje.
- La elección debe actualizarse al editar precios o alternar entre precios de planilla y catálogo, respetando la condición de cada producto.
- Antes de implementar, revisar los recursos y definir su posición, escala y asignación por formato, además de cómo configurar sus URLs en las entradas de Modyo. La referencia indicada es mobile 556x416; no se han definido todavía variantes ni posiciones para los demás formatos.
- Esta solicitud solo registra el acuerdo en el contexto; no autoriza ni representa una publicación en Modyo.

## Corrección del botón Generar en Masivo (13 de noviembre de 2026)

- Se eliminó la validación histórica de `snapshot().ready` en la generación masiva: exigía una campaña individual cargada aunque el selector estuviera oculto. Cada grupo continúa validando y aplicando su campaña de la planilla de forma independiente.
- La prueba Edge inicia sin seleccionar campaña individual, carga la semana y pulsa el botón real Generar; comprueba generación, continuidad por errores y descargas. Para regresar a Individual, la prueba selecciona su campaña manualmente.
- Se versionó `mvp-batch.js` en `mvp.html`. Aplicar Ctrl+F5; no requiere reiniciar Python. No cambia el widget Modyo.

## Tarjetas del resumen masivo (13 de noviembre de 2026)

- Reemplazan el resumen centrado previo: tarjetas alineadas a la izquierda, número y celda del banner, nombre completo, campaña y su celda como dato secundario, IDs y formatos como controles amplios seleccionables. El listado tiene hasta 580 px de altura y scroll.
- Estados con texto e icono: verde para Listo, ámbar para Sin campaña, Sin formatos o Revisar IDs. El resumen superior cuenta banners listos y por revisar; se actualiza al cambiar formatos por grupo o generales. Listo indica configuración válida, no certifica acceso al catálogo ni exportación posterior. Los errores de precios siguen usando el fallback existente al catálogo.
- Se versionó el CSS local para renovar caché. Cambio exclusivo del entorno local; no se modificó Modyo. Esta sección reemplaza la presentación visual centrada documentada previamente.

## Carga por semana seleccionada (13 de noviembre de 2026)

- El selector W01–W52 aparece antes del botón «Cargar / actualizar semana» y está disponible sin descargar la planilla. Cambiar de semana limpia el lote y requiere una nueva carga; cambiar de ciclo usa los datos de la semana ya cargada.
- `/api/sheets` exige `week=W01` a `week=W52`. Ya no descarga el XLSX completo: consulta por CSV únicamente las diez filas necesarias de la hoja elegida (3, 9, 17, 18, 29, 37, 43, 51, 52 y 63), en paralelo. Las filas se consultan por separado para evitar que la inferencia de tipos de Google omita IDs numéricos en columnas con textos. Se conserva la lógica compartida de nombres, conceptos y precios, los huecos y las columnas posteriores a Z.
- Se mantiene la espera de 120 segundos por consulta y 150 segundos en el navegador. Reiniciar Python con `iniciar-mvp.cmd` y recargar con Ctrl+F5. El widget Modyo no cambia.
- Validación: ocho pruebas Python, sintaxis JavaScript y prueba Edge con servicios simulados. Una consulta real a la fila 9 de W45 devolvió nueve grupos y conservó el ID numérico simple 57629. No se midió el tiempo de una carga real completa ni se verificó aún la exportación de un lote con este flujo.
- Esta sección reemplaza las instrucciones históricas de cargar toda la planilla antes de elegir la hoja.

## Resumen visual de carga masiva (13 de noviembre de 2026)

- Cada banner del resumen se presenta en una sola columna centrada: nombre, campaña o aviso y una fila de formatos que se adapta al ancho disponible. Se conserva el panel con scroll y las líneas entre banners, según la referencia del usuario. Cambio exclusivo de `mvp-batch.css`; requiere Ctrl+F5.

## Tiempo de carga de planilla (13 de noviembre de 2026)

- Se amplió la espera de descarga de Google Sheets de 30 a 120 segundos en el servidor y de 45 a 150 segundos en el navegador. La interfaz avisa que la carga puede tardar hasta dos minutos.
- Reiniciar el servidor con `iniciar-mvp.cmd` y recargar con Ctrl+F5 para aplicar ambos cambios. Pendiente confirmar la carga con la planilla real; ampliar la espera no garantiza resolver lentitud o interrupciones de red.
- Esta configuración reemplaza los tiempos históricos de descarga de Sheets indicados más abajo. No cambia los tiempos de catálogo, imágenes ni campañas.

## Campaña por banner desde planilla (13 de noviembre de 2026)

- En local, Forma de generar los banners pasa al primer paso. Diseño de campaña solo aparece y permite selección en Individual. Masivo no requiere una campaña general.
- El lector devuelve `campaignConcept` y `campaignCell`: fila 3 para lunes a jueves y fila 37 para viernes a domingo, en la misma columna de los IDs desde E, incluidos huecos y columnas posteriores a Z.
- Cada grupo masivo cruza su concepto con las cinco entradas configuradas: UUID, slug normalizado y nombre completo normalizado, en ese orden. Se normalizan mayúsculas, tildes, espacios y puntuación con guiones; por ejemplo, Toma tu Like coincide con toma-tu-like. Cada grupo recibe los fondos y colores de su propia entrada.
- Si falta el concepto, no hay coincidencia o es ambigua, ese grupo no se genera y muestra un aviso con la celda y el motivo. Los demás continúan. El resumen también anticipa estos avisos.
- Reiniciar Python con `iniciar-mvp.cmd`, recargar con Ctrl+F5 y cargar nuevamente la planilla. El frontend detecta servidores antiguos que todavía no devuelven conceptos.
- Validación: siete pruebas Python de planilla, sintaxis de los tres JavaScript locales, prueba Edge con servicios simulados y `git diff --check`. Se verificaron slug normalizado, campañas distintas por UUID dentro del lote, concepto vacío, ausencia de coincidencia y continuidad. Falta validar con Sheets y campañas reales. No se modificó ni publicó el widget Modyo; no se hizo commit ni push.
- Esta sección reemplaza el pendiente histórico de campaña por banner desde planilla para el entorno local.
- Archivos de esta implementación: `planilla_banners.py`, `mvp-local.js`, `mvp-local-generator.js`, `mvp-batch.js`, `mvp.html`, `test_planilla_banners.py` y `test_banners_browser.py`. Se conservan los cambios previos de las cinco campañas y del servidor.
- Punto para retomar: comprobar con la planilla real ambos ciclos, un lote con conceptos distintos, un concepto vacío y otro sin entrada correspondiente. Confirmar fondos y colores por grupo, avisos de omisión y descarga PNG/WebP. Volver a Individual y comprobar que el selector manual funciona. El usuario todavía no confirmó reinicio ni validación real posterior a esta implementación.
- El cruce masivo usa las cinco entradas locales configuradas, no un listado dinámico de todas las entradas del espacio Modyo. Para incorporar conceptos de nuevas entradas se deberá ampliar esa configuración o implementar su listado dinámico.

## Cinco campañas en el generador local (12 de noviembre de 2026)

- El desplegable local contiene, en el orden solicitado, los UUID `40dd98db-cdc8-4d40-9950-a195bdbde8a5`, `ddd3ff5d-88dd-4ca7-86f6-959313238eea`, `0b5d9f6d-4a44-4a52-83c7-d8634799ca0d`, `f1bbd79b-c557-4f2f-80bd-8d101480f810` y `a1a77a6a-dc62-4fd9-983f-f1f8562d7a2f`.
- Todos corresponden a `https://ww3.pcfactory.cl/api/content/spaces/banners-principales/types/campana/entries/<uuid>?locale=es`. `mvp-local.js` conserva la carga de sus nombres reales desde `meta.name`; el servidor permite exclusivamente estos cinco UUID en `/api/campaigns/<uuid>`.
- Se actualizaron `mvp.html` y `servidor-mvp.py`. Reiniciar Python con `iniciar-mvp.cmd` y recargar con Ctrl+F5. Las referencias históricas a solo dos campañas quedan reemplazadas por esta lista.
- Modyo conserva su selector dinámico mediante Liquid. No se modificó ni publicó el widget. Queda pendiente comprobar la carga real de las cinco campañas.
- Validación realizada: pasaron las seis pruebas de `python -m unittest test_planilla_banners -q`, la compilación de `servidor-mvp.py` con `py_compile` y `git diff --check`. Estas comprobaciones no certifican acceso a los endpoints ni la carga de fondos y colores de las nuevas campañas.
- Punto para retomar: cerrar el servidor Python anterior, ejecutar `iniciar-mvp.cmd`, recargar con Ctrl+F5 y comprobar que aparecen los cinco nombres reales. Seleccionar cada campaña y verificar fondos, colores y generación en Individual y Masivo. No se confirmó todavía este reinicio ni la prueba real por parte del usuario.
- Los cambios de campañas y esta actualización de contexto no se han confirmado en un commit ni enviado mediante push durante esta sesión.

## Commits incorporados y revisión del contexto (12 de noviembre de 2026)

Se revisaron los diffs completos de los dos commits del 11 de noviembre, posteriores al commit inicial `b8ee5ef`. Esta sección prevalece sobre las notas históricas siguientes.

### Nombres de banners desde planilla — `4b8c236`

- El lector obtiene el nombre de cada grupo desde la misma columna de sus IDs: fila 29 para lunes a jueves (IDs en fila 9) y fila 63 para viernes a domingo (IDs en fila 43). Devuelve `name` y `nameCell`, conservando la correspondencia incluso con huecos y columnas posteriores a Z.
- El resumen y las pestañas del modo Masivo muestran `celda: nombre`. Si el nombre está vacío, utilizan los IDs; si tampoco hay IDs, el valor original de la celda. El texto visible se limita a 45 caracteres, incluida la elipsis, y el atributo `title` conserva la etiqueta completa. Los errores se agregan después de la etiqueta en el resumen.
- Se versionó la referencia de `mvp-batch.js` en `mvp.html` para actualizar la caché. El cambio afecta las etiquetas de interfaz; no incorpora nombres de planilla a los archivos descargados.
- Archivos: `planilla_banners.py`, `mvp-batch.js`, `mvp.html` y `test_planilla_banners.py`.

### Inicio de Python y conexiones locales — `31adcf8`

- `iniciar-mvp.cmd` intenta, en orden, `py -3`, la instalación de Python313 bajo `%LocalAppData%` y `python`. Si ninguno está disponible, muestra instrucciones de instalación; mantiene la pausa final para poder leer errores.
- El servidor centraliza las consultas externas en `open_upstream`. Ante un error de verificación de certificado SSL en Windows, reintenta con `curl.exe` del sistema para utilizar la confianza de Windows. Conserva la verificación de certificados y host, restringe las conexiones y redirecciones a HTTPS y establece límites de tiempo y tamaño. Se utiliza para Sheets, campañas, catálogo e imágenes.
- El generador local muestra mensajes de conexión propios del entorno local y, ante una respuesta HTTP fallida del catálogo, presenta el detalle JSON enviado por el servidor. Ya no remite a configurar CORS o `api-url-new` de Modyo para ese error local.
- Archivos: `iniciar-mvp.cmd`, `servidor-mvp.py` y `mvp-local-generator.js`. Ninguno de estos dos commits modifica el widget Modyo.

### Validación y estado al retomar

- El 12 de noviembre se ejecutó `python -m unittest test_planilla_banners -v`: pasaron las seis pruebas, incluida la nueva correspondencia de nombres por columna y ciclo. Esta revisión no ejecutó pruebas de navegador ni conexiones externas reales; el fallback SSL de Windows y el lanzador siguen sin validación específica en esta revisión.
- Antes de editar este documento, el árbol estaba limpio y `main` y la referencia local `origin/main` apuntaban a `4b8c236`. El remoto configurado es `https://github.com/sebastianlorca/generador-banners.git`. No se hizo fetch ni consulta de red en esta revisión.
- Para probar estos commits, reiniciar el servidor con `iniciar-mvp.cmd`, recargar con Ctrl+F5, actualizar la planilla y generar un lote nuevo. Comprobar nombres en ambos ciclos, nombres vacíos y largos, además del flujo real de generación y descarga ya pendiente.
- Siguen vigentes los pendientes de títulos automáticos y tamaño del símbolo ®, validación real, rendimiento e integración con Modyo. No se publicó ningún despliegue durante esta revisión.

## Formatos por banner, descarga masiva y marcas (10 de noviembre de 2026)

Esta sección documenta el estado más reciente del generador local y complementa las reglas de precios del 9 de noviembre.

- Al cargar la planilla, cada grupo válido muestra siete casillas de formatos independientes. La selección se conserva al cambiar de hoja o ciclo durante la sesión. Cargar nuevamente la planilla reinicia estas selecciones a partir de los controles generales.
- En modo Masivo, cambiar una casilla general aplica ese formato a los grupos ya configurados en la planilla cargada. Los grupos que se muestran por primera vez toman los valores generales actuales. El texto de ayuda explica este comportamiento.
- Antes de generar se exige al menos un formato por grupo y se indican las celdas que quedaron sin selección. Cada generador recibe exclusivamente los formatos elegidos para su grupo.
- Los botones de la vista previa distinguen el banner activo mediante fondo verde oscuro y texto blanco. Los demás tienen fondo gris claro. Se conserva la navegación por teclado y la indicación de errores por grupo.
- Cada grupo generado incluye «Descargar todos los formatos». El modo Individual también tiene este botón junto al encabezado de vista previa, habilitado después de generar. Descarga todas las piezas seleccionadas del banner o grupo, incluidas las de cada producto, con los ajustes actuales y el formato PNG o WebP elegido.
- La descarga masiva entrega archivos individuales y prepara todas las imágenes antes de iniciar las descargas. El navegador puede solicitar permiso para descargas múltiples.
- Se corrigió la carga de versiones antiguas del generador que provocaba «generator.downloadAll is not a function». La plantilla se consulta sin caché, el generador se carga con un parámetro de versión por sesión y el script masivo tiene una referencia versionada. Tras actualizar, recargar con Ctrl+F5 y generar nuevamente el lote.
- Las marcas se muestran con ® en los títulos automáticos y en las líneas de marca de todos los formatos locales, tanto Individual como Masivo. Ejemplo solicitado por el usuario, «Notebook Lenovo®». Se evita duplicar el símbolo si la marca ya lo incluye. El título sigue siendo editable.
- Archivos modificados durante estas actualizaciones, `mvp-batch.js`, `mvp-batch.css`, `mvp-local-generator.js`, `mvp-local.js`, `mvp.html` y `test_banners_browser.py`.
- Validación realizada con sintaxis JavaScript y pruebas Edge con servicios simulados. Se verificaron selecciones distintas por grupo, validación de selección vacía, estilo activo, descarga masiva y nombres WebP, disponibilidad del botón en Individual y marcas en títulos de ambos modos. También pasaron las cinco pruebas Python de planilla durante la actualización de formatos. Sigue pendiente validar el flujo con Google Sheets y catálogo reales.

### Pendientes solicitados para desarrollar más adelante

Estos cambios quedan registrados para una implementación futura.

- Notebooks y desktop. Si el nombre contiene «Ideapad» o «notebook gamer», mover esa información al título principal.
- Parlantes. Si el nombre contiene «portátil», mover esa característica al título principal.
- Monitores. Si el nombre contiene «gamer» o «curvo», mover esas características al título principal. Si aparecen ambas, incluir ambas.
- Reducir el tamaño visual del símbolo ® de las marcas. Actualmente usa el mismo tamaño del texto al que acompaña.

Los pendientes de validación real, integración con Modyo y publicación del apartado del 9 de noviembre siguen vigentes.

## Precios de planilla y selección por banner (9 de noviembre de 2026)

Esta sección prevalece sobre las referencias históricas a comas como separador de productos y a precios de planilla pendientes de fase 2.

- Implementado exclusivamente en local para carga masiva: referenciales en filas 17 (primer ciclo, IDs en 9) y 51 (viernes a domingo, IDs en 43); ofertas en filas 18 y 52. Siempre en la misma columna que los IDs, desde E en adelante. Las filas de ahorros se ignoran.
- Los IDs se separan por guion o slash. En cada segmento, si hay variantes separadas por coma, se toma solo la primera: `12345 - 23456, 23457` genera dos productos, 12345 y 23456. Se mantienen de uno a tres productos.
- Los precios se separan por guion o slash, en el mismo orden que los IDs. Se aceptan pesos enteros con puntos de miles, símbolo $ y espacios. Se exige exactamente un valor por producto en ambas filas; no se usan comas como separador de precios.
- Cada pestaña/banner generado incluye el checkbox «Usar precios de planilla», marcado inicialmente cuando los precios son válidos. Afecta todos los formatos del grupo. Desmarcar restaura los precios originales del endpoint, volver a marcar restaura los de planilla y recalcula descuentos, sin consultar el catálogo nuevamente. El estado es independiente entre grupos.
- Si faltan precios o son inválidos, el grupo se genera con los precios del endpoint; el checkbox queda desmarcado y deshabilitado, con un aviso. Se conserva la edición manual existente; cambiar la fuente reemplaza los precios editados por los de la fuente seleccionada.
- Validación: pasaron cinco pruebas Python de planilla, revisión de sintaxis de ambos JS y prueba Edge con servicios simulados, incluidos valores iniciales, orden por producto, descuentos, cambio de fuente, independencia y fallback por precios ausentes. Falta validación con Google Sheets y catálogo reales. Modyo no se modificó.
- Para probar: reiniciar `iniciar-mvp.cmd`, recargar con Ctrl+F5, cargar/actualizar la planilla y generar un nuevo lote.
- Diagnóstico posterior: se comprobó que el servidor activo en 8765 seguía devolviendo el esquema antiguo (solo IDs), por lo que aparecía el aviso genérico pese a tener precios válidos. El Excel real W45/E se leyó correctamente: ofertas 619990/799990 y referenciales 1029990/1189990. El frontend ahora detecta respuestas antiguas y solicita cerrar el servidor Python anterior, iniciar de nuevo y actualizar la planilla; la consulta usa `cache: no-store`. Pasaron sintaxis JS y prueba Edge simulada tras el cambio.
- Corrección visual posterior: el botón «Cargar / actualizar planilla» tenía texto verde sobre fondo verde al hacer hover. Se agregó en `mvp-batch.css` una regla exclusiva de `#loadSheets:hover:not(:disabled)` con fondo `#05613a` y texto blanco `#fff`. Solo requiere Ctrl+F5; este último cambio CSS no tuvo revisión visual automatizada ni confirmación posterior del usuario.

### Archivos modificados en esta sesión

- `planilla_banners.py`: nueva regla de IDs, lectura de las cuatro filas de precios, normalización y validación por cantidad de productos; devuelve `sheetPrices`, `priceCells` y `priceError` por grupo.
- `mvp-batch.js`: checkbox independiente por banner, aviso por precios ausentes/incorrectos, detección de servidor antiguo y consulta de Sheets sin caché.
- `mvp-local-generator.js`: métodos `setPrices` y `endpointPrices` para alternar fuentes sin consultar otra vez el catálogo; conserva la edición y composición existentes.
- `mvp-batch.css`: estilos del checkbox y corrección de contraste del botón de carga.
- `test_planilla_banners.py` y `test_banners_browser.py`: cobertura de reglas de IDs, filas/precios, alternancia, descuentos e independencia entre banners.
- Este documento. No se modificaron los archivos del widget Modyo ni se publicó un despliegue.

### Pendientes vigentes y punto para retomar

1. Cerrar el servidor Python anterior y volver a ejecutar `iniciar-mvp.cmd`; recargar con Ctrl+F5, pulsar «Cargar / actualizar planilla» y generar un lote nuevo. No se confirmó que el usuario haya completado este reinicio después del diagnóstico.
2. Validar el flujo completo real en ambos ciclos: precios de planilla por producto, checkbox inicialmente marcado, restauración del endpoint, descuento recalculado, independencia entre pestañas y descargas PNG/WebP de los formatos elegidos. Verificar también precios ausentes o cantidades incorrectas y cambios manuales antes de alternar la fuente.
3. La consulta al servidor local sí logró obtener hojas de Google Sheets durante el diagnóstico; el proceso activo usaba el lector antiguo. El bloqueo de red de las notas anteriores es histórico. Sigue sin certificarse la lectura remota con el backend actualizado ni la generación/exportación completa con catálogo real.
4. Revisar visualmente el hover del botón y la distribución de recorte; comprobar nombres largos, productos blancos y fotos de baja resolución. Medir consumo de memoria y rendimiento con un ciclo real completo.
5. Tras validar local, adaptar el modo masivo, precios y controles de imagen a Modyo; resolver CORS y verificar carga de campañas, fotos y exportación en el CMS. Los JavaScript local y Modyo siguen separados y los cambios deben trasladarse expresamente. No hay despliegue autorizado en esta sesión.
6. Ampliaciones aún sin implementar: campaña distinta por banner desde la planilla y otros campos. Los precios oferta/referencial ya están implementados localmente; el descuento se calcula con ellos, no se lee de la fila de porcentajes. Los ahorros se ignoran.
7. Resuelto el pendiente histórico de inicialización y configuración de Git: existen el commit inicial y dos commits posteriores, con `main` y la referencia local `origin/main` en `4b8c236` al revisar el 12 de noviembre. No se consultó el remoto por red en esta revisión; conservar historial y evitar force push.

Este documento conserva el contexto del proyecto y las decisiones de la conversación. Las secciones iniciales del 12, 10 y 9 de noviembre prevalecen, en ese orden, sobre las notas históricas posteriores, que documentan versiones anteriores.

Este es el documento único de contexto e instrucciones del proyecto. Se consolidó aquí el contenido vigente de `README-modyo.md` y se eliminó ese archivo; las instrucciones obsoletas del README sobre JavaScript compartido y `data-local-proxy` quedan reemplazadas por la separación de ambientes documentada abajo.

## Repositorio Git

Estado revisado el 12 de noviembre de 2026: el commit inicial `b8ee5ef` del 10 de noviembre contiene el proyecto; los commits `31adcf8` y `4b8c236` del 11 de noviembre incorporan las mejoras descritas al inicio. `origin` está configurado como `https://github.com/sebastianlorca/generador-banners.git`; `main` y la referencia local `origin/main` coinciden en `4b8c236`. No se consultó GitHub por red durante esta revisión. Las notas de bloqueo siguientes son históricas y no representan el estado actual.

Destino solicitado: `https://github.com/sebastianlorca/generador-banners.git`. Se inicializó Git local con rama `main` y se agregó `.gitignore` para excluir perfiles de navegador, cachés, archivos de entorno y credenciales habituales, planillas/datos locales, ejemplos gráficos y la aplicación independiente `taller-de-fichas.html`. Se conservarán el código local, los archivos Modyo, las pruebas y este contexto.

Bloqueo histórico anterior al commit inicial, ya superado según el historial y las referencias locales actuales: el entorno no pudo conectar a GitHub y rechazó la escritura de `.git/index.lock`. En aquel intento no se creó un commit ni se configuró el remoto. No sobrescribir historial con force push.

## Desarrollo local: generación por ciclos desde planilla (5 de noviembre de 2026)

### Últimos cambios y punto para retomar

- Se conserva el modo Individual y se agregó Masivo desde Google Sheets en el desplegable **Productos → Modo de generación**. Los controles de planilla solo aparecen al elegir Masivo.
- Nota histórica del 5 de noviembre: la coma separaba productos. Desde el 9 de noviembre solo guion y slash separan productos; las comas indican variantes de las que se usa la primera. Ver reglas y pruebas vigentes al comienzo de este documento.
- Se corrigió el margen negativo de `.section-help` en el CSS compartido: pasó de `-8px` a `8px`.
- En local se restauraron los controles de eliminación de blancos dentro de **Producto → Editar controles**: activar/desactivar recorte, blancos interiores e intensidad de 5 a 90. Se configuran por producto dentro de cada banner/pestaña y se reflejan en sus formatos; no son controles generales del lote.
- El reemplazo sigue disponible mediante el selector **11 - Personalizada** y su URL. Las fotos personalizadas conservan sus blancos y transparencia, sin recorte; sus controles de eliminación se deshabilitan. El fallback a la imagen 1 del catálogo sí utiliza la configuración de recorte del producto.
- Se redistribuyó el bloque de recorte a todo el ancho: tres columnas en escritorio (dos opciones e intensidad), ayuda en fila completa y zoom/ejes debajo. Adaptación progresiva a pantallas pequeñas mediante `mvp-batch.css`. Este último ajuste de distribución no tuvo una nueva revisión visual automatizada.
- Pasó la prueba Edge con servicios simulados tras restaurar los controles, incluyendo independencia entre pestañas y conservación de blancos de una imagen personalizada. Sigue pendiente validar Google Sheets y el flujo completo con catálogo real desde el equipo del usuario; las capturas aportadas muestran la interfaz, pero no confirman ese flujo completo.
- Para retomar pruebas: reiniciar Python si cambió el backend, recargar con Ctrl+F5 y volver a generar para que las pestañas incorporen los últimos estilos y controles. Si cambian datos en Sheets, pulsar Cargar / actualizar planilla.
- La integración masiva y los nuevos controles de imagen siguen exclusivos del generador local. La adaptación de HTML/JS a Modyo y la resolución de CORS siguen pendientes. Desde el 9 de noviembre los precios de planilla ya están implementados en local y los descuentos se calculan con la fuente elegida; campaña por banner y otros datos siguen pendientes.

El usuario solicita ampliar el administrador para generar todos los banners de un ciclo desde una planilla. La primera implementación local ya incorpora los dos modos y las pestañas; la conexión real con Google Sheets y el flujo completo con servicios reales siguen pendientes de validación. El widget de Modyo conserva su implementación individual anterior.

### Fuente y estructura aportadas

- Confirmaciones del usuario para fase 1: planilla de prueba en https://docs.google.com/spreadsheets/d/1ic5fOWwP3AqzgsIcJ70ySvrq0y0TPX-nB3-KZnfieeQ/edit?usp=sharing (ID `1ic5fOWwP3AqzgsIcJ70ySvrq0y0TPX-nB3-KZnfieeQ`). El enlace fue aportado, pero todavía no se verificaron acceso, permisos ni contenido.
- Listar todas las hojas semanales cuyos nombres estén entre `W01` y `W52`, ambos incluidos; excluir otras hojas.
- Leer desde la columna E hasta el final disponible de la fila correspondiente, sin límite fijo en la letra X. La expresión E9 a X9 / E43 a X43 del usuario usa X como variable de final indeterminado, no como columna literal. Omitir celdas vacías, sin detenerse ante un hueco intermedio.
- Archivo de referencia suministrado por el usuario: `C:\Users\Seba\Downloads\ Programación Publicaciones MKT Y ECO 2026.xlsx`. Se encontró y leyó el archivo real `📅 Programación Publicaciones MKT Y ECO 2026.xlsx` en Descargas para validar la estructura; no se modificó.
- La fuente de la prueba será Google Sheets. La conexión local descarga su exportación XLSX sin autenticación y lee las hojas en Python; requiere acceso de lectura y descarga sin iniciar sesión. Si la fuente es privada, se necesitará implementar autenticación antes de usarla. No se cambió la privacidad de la planilla.
- La planilla contiene varias hojas semanales, como `W45`, `W46`, etc. El administrador debe permitir elegir la hoja.
- Cada hoja contiene dos ciclos: lunes a jueves (filas 2 a 32) y viernes a domingo (filas 36 a 68). El administrador debe permitir elegir uno de ellos.
- Para lunes a jueves, leer los grupos de IDs desde `E9`, `F9`, `G9`, `H9`, etc.
- Para viernes a domingo, leer los grupos de IDs desde `E43`, `F43`, `G43`, `H43`, etc.
- Cada celda representa un banner/grupo independiente de uno, dos o tres productos. Los IDs pueden estar separados por guion (`-`), slash (`/`) o coma (`,`), con espacios opcionales; también se aceptan separadores combinados. Ejemplos: `34512`, `12345 - 54321`, `55460 / 57757 / 31218`, `12345, 54321`.
- Conservar el orden de las columnas y el orden de los IDs dentro de cada celda. Omitir celdas vacías y validar los grupos antes de generar. No fijar una última columna manualmente.

### Alcance confirmado por fases

**Fase 1 — generador local:** implementar primero ambos modos en el entorno local. El modo masivo consume solamente IDs de Sheets; los otros datos de producto continúan viniendo del catálogo y los ajustes existentes. Todos los grupos del lote utilizan una misma campaña seleccionada en el administrador. Conservar el modo individual sin dependencia de Sheets. No trasladar todavía esta funcionalidad a Modyo: el usuario solicita hacerlo después de tener implementado el flujo local; sigue pendiente obtener permisos CORS para usarlo en el CMS.

**Fase 2 — ampliación de datos de la planilla:** permitir que la planilla indique qué campaña utiliza cada banner/grupo y consumir otros datos, como precios y descuentos. Todavía no están definidos los campos, filas, identificación de campañas ni las reglas de prioridad frente al catálogo y el cálculo actual de descuento; se definirán antes de esa fase. No incorporar estas funciones como requisito de la fase 1.

La posterior adaptación a Modyo es un trabajo pendiente tras completar el desarrollo local y resolver el acceso a imágenes en el CMS; no equivale a un despliegue autorizado en esta iteración.

### Comportamiento solicitado

El administrador debe ofrecer **dos modos de generación**, seleccionables de forma clara:

- **Individual:** conservar el generador actual, con ingreso manual de uno a tres IDs, selección de campaña y formatos, vistas previas, ajustes y descargas. Este modo debe funcionar sin configurar ni conectar una planilla.
- **Masivo desde Google Sheets:** agregar la lectura de los grupos de un ciclo y su generación en pestañas. Antes de generar, ofrecer controles de configuración de la fuente (inputs, dropdowns u otros controles apropiados): identificación/enlace de la planilla, selección de hoja semanal y selección de ciclo. Los rangos/filas documentados son la estructura inicial; definir durante la implementación si requieren controles adicionales de configuración. La configuración de Sheets pertenece al modo masivo y no debe convertirla en requisito del modo individual.

La generación masiva complementa al generador individual; no lo reemplaza. Ambos modos conservan la selección de campaña Modyo y formatos de salida. La elección concreta de controles queda a criterio de implementación, manteniendo el flujo simple y permitiendo configurar la planilla antes de iniciar la generación.

Los siguientes pasos corresponden al modo masivo:

1. Seleccionar la campaña de Modyo que aporta fondos y colores, la hoja semanal y el ciclo.
2. Al pulsar Generar, procesar todos los grupos de IDs del ciclo seleccionado, sin tener que ingresarlos manualmente uno a uno.
3. Mostrar los resultados en pestañas dentro de la página, una por celda/grupo; no son pestañas del navegador ni una pestaña por producto.
4. Rotular cada pestaña con sus IDs, por ejemplo `12345 - 54321`, `34512` o `12345 - 56789 - 78941`, según el boceto del usuario.
5. Cada pestaña contiene las vistas previas, ajustes y descargas de los formatos seleccionados para ese grupo. Desk compone sus uno, dos o tres productos; los formatos por producto conservan su comportamiento actual.
6. Mantener independientes los datos, ajustes, resultados y descargas de cada grupo al cambiar de pestaña.

### Etapas previstas de desarrollo

1. Revisar la planilla real y definir el acceso a Google Sheets, listado de hojas y lectura de los rangos de ambos ciclos.
2. Incorporar selección de modo individual/masivo y configuración previa de la planilla, hoja y ciclo, con parseo y validación de grupos de uno a tres IDs. Conservar el flujo individual sin dependencia de Sheets.
3. Adaptar el generador para procesar múltiples grupos y conservar su estado independiente, con progreso y manejo de errores por grupo.
4. Implementar las pestañas de resultados y conectar los controles, vistas previas y descargas existentes.
5. Validar en local ambos modos y el cambio entre ellos: generación individual sin Sheets, ambos ciclos masivos, distintas hojas, separadores, grupos de uno/dos/tres productos y generación/exportación. Adaptar posteriormente Modyo, una vez completado el flujo local y atendido el pendiente CORS, conservando la separación de JavaScript.

La integración con Sheets no resuelve el pendiente CORS de las fotografías en Modyo. No se ha solicitado ni realizado un despliegue.

### Implementación local y cómo probarla

- `mvp-batch.js` agrega el selector Individual / Masivo desde Google Sheets, el enlace o ID de la fuente, carga/actualización de hojas, selector de ciclo y resumen de las celdas antes de generar.
- `mvp-batch.css` contiene los estilos exclusivos del flujo local masivo. Los HTML y JavaScript del widget Modyo no se modificaron en esta etapa.
- `GET /api/sheets?id=<spreadsheet-id>` descarga exclusivamente una exportación XLSX de `docs.google.com`, con timeout de 30 segundos y límite de descarga de 40 MiB. Valida el ID y devuelve solo las hojas W01–W52 y sus celdas no vacías de las filas 9/43 desde E. La lectura de XML se limita a 300 MiB descomprimidos; no extrae archivos al disco.
- `planilla_banners.py` interpreta XLSX con la biblioteca estándar, incluidos textos compartidos, inline y valores numéricos enteros como `57629.0`. Conserva orden y huecos; informa la celda de cada grupo inválido. No se generan lotes con celdas inválidas hasta corregirlas en la fuente y actualizarla.
- La generación es secuencial y muestra progreso. Cada grupo tiene una pestaña y un generador aislado en un iframe del mismo origen, con sus propios controles, escena y descargas. Un error de catálogo/imagen de un grupo no detiene los siguientes. Las pestañas se recorren también con flechas, Inicio y Fin.
- El formato PNG/WebP del administrador se propaga a los grupos generados. Cambiar fuente, hoja, ciclo, campaña o formatos de salida limpia el lote anterior. Cambiar entre Individual y Masivo conserva los resultados respectivos; volver a generar un lote reemplaza sus resultados anteriores.
- Para probar: reiniciar `iniciar-mvp.cmd`, recargar con Ctrl+F5, seleccionar campaña, cambiar a Masivo, cargar la planilla de prueba, elegir hoja/ciclo, revisar IDs y generar. El modo Individual no necesita cargar Sheets.
- Los lotes mantienen los canvas de todos los grupos para conservar edición y descarga; con muchos grupos y formatos grandes aumenta el uso de memoria. Pendiente medir rendimiento con el ciclo real.

### Validación de esta implementación

La lectura del Excel real de Descargas encontró 45 hojas semanales. En W45 obtuvo 9 grupos de lunes a jueves (E9–M9) y 10 de viernes a domingo (E43–N43), todos válidos tras normalizar enteros numéricos. Esto verifica ese archivo de referencia, no la planilla remota.

Pasaron `node --check` de los JavaScript locales, compilación Python y tres pruebas `python -m unittest test_planilla_banners -v`: filtros de hojas y rangos, huecos y columnas posteriores a Z, separadores, validaciones y respuesta de la ruta local con descarga simulada/error HTTP 403. La red saliente del entorno bloqueó el acceso a Google (WinError 10013); no se verificaron permisos de la planilla remota ni exportación con productos reales.

Pasó `python test_banners_browser.py` en Edge con servicios simulados: resumen del ciclo, grupos de uno/dos/tres productos, continuidad tras fallo de catálogo en un grupo intermedio, edición conservada al cambiar pestañas y aislada entre grupos, propagación de WebP y exportación real de un blob WebP, retorno al modo individual y generación individual de los siete formatos (19 canvas con tres productos), cambio al segundo ciclo y URLs externas de fotos/fondos redirigidas al proxy local desde las pestañas. La prueba reemplaza únicamente la carga de Ubuntu para no depender de Google Fonts y no certifica la tipografía ni integración externa. Requiere Edge en su ruta estándar de Windows y Node; usa puertos locales 8876 y 9223, con un perfil aislado de prueba.

Quedaron carpetas auxiliares `.browser-test-profile` y `.browser-test-profile-2` de las pruebas. La revisión automática rechazó su limpieza por requerir una aprobación de sandbox no disponible en esta sesión; no forman parte del funcionamiento del generador.

## Estado vigente al 5 de noviembre de 2026

### Objetivo y preferencias del usuario

Generador interno de banners para PC Factory, con una campana de Modyo que aporta fondos y colores y entre uno y tres IDs de productos del catalogo. No es una landing comercial. El usuario pidio que el encabezado diga solamente **Generador de banners**: sin slogan, etiqueta de estudio creativo ni badges. Conservar este criterio al realizar cambios de diseno.

El selector de campanas debe estar dentro de la caja principal del formulario, junto con productos y formatos. Fondos y colores se administran exclusivamente en las entradas de Modyo: no reintroducir inputs de URLs, carga de archivos ni Opciones generales en el sitio.

### Archivos y ejecucion

- `mvp-modyo.html`: HTML Liquid del widget personalizado.
- `mvp-modyo-widget.html`: copia sincronizada del mismo HTML.
- `mvp-modyo.css`: estilos compartidos entre Modyo y local.
- `mvp-modyo.js`: logica exclusiva del widget Modyo, con consultas directas; no contiene `localMode` ni rutas al proxy local.
- `mvp.html`: documento local completo, actualizado a partir del widget; ya no es el antiguo MVP independiente con JS integrado.
- `mvp-local.js`: carga los nombres reales de las dos entradas y despues inicia `mvp-local-generator.js`.
- `mvp-local-generator.js`: logica independiente del generador local, con catalogo e imagenes a traves del proxy Python.
- `servidor-mvp.py`: servidor local y proxy restringido de entradas, catalogo e imagenes.
- `iniciar-mvp.cmd`: inicia Python y abre http://127.0.0.1:8765/mvp.html. Reiniciar el servidor si cambio Python y recargar con Ctrl+F5 tras cambios de HTML/CSS/JS. No abrir por file://.

En Modyo copiar HTML, CSS y JS en sus respectivas pestanas; una instancia por pagina. La variable `api-url-new` se usa para el catalogo, no para la API de contenido. No se ha desplegado desde esta sesion.

### Guía rápida de uso e instalación

- **Local:** ejecutar `iniciar-mvp.cmd` y abrir http://127.0.0.1:8765/mvp.html. Mantener el servidor Python abierto. Reiniciarlo si cambia `servidor-mvp.py` y recargar con Ctrl+F5 tras cambios del frontend. No abrir mediante `file://` ni usar un servidor estático que no implemente las rutas del proxy.
- **Modyo:** copiar `mvp-modyo.html` (o su copia sincronizada `mvp-modyo-widget.html`) en la pestaña HTML, `mvp-modyo.css` en CSS y `mvp-modyo.js` en JavaScript del widget. Usar una instancia por página y configurar `api-url-new` para el catálogo. No copiar el JavaScript local al CMS.
- **Generación individual actual:** seleccionar una campaña, esperar su carga, completar entre uno y tres IDs, elegir los formatos y pulsar Generar. Después ajustar productos y descargar las piezas en PNG o WebP. Los fondos y colores provienen de la campaña; los colores vacíos conservan los valores originales de cada formato.
- **Verificación pendiente en Modyo:** comprobar el render de Liquid, la carga de campañas e imágenes y la exportación en la página real. Las pruebas simuladas no confirman la integración ni sustituyen los permisos CORS necesarios para Canvas.

### Campanas y datos

Space `banners-principales`, tipo `campana`. El HTML Modyo lista hasta 20 entradas ordenadas por `published_at` ascendente:

```liquid
{% assign campana = spaces['banners-principales'].types['campana'].entries | sort_by: 'published_at', 'asc' | limit: 20 %}
```

El nombre visible es `entrada.meta.name`; el valor del select es `entrada.meta.uuid`. Cada opcion entrega `data-content-url`, construido con `entrada.meta.account_url` y el endpoint, y `data-locale`. Al seleccionar se consulta la API, se comprueba el UUID y se leen los campos de la respuesta JSON. Generar se deshabilita durante la carga. Un contador de solicitudes evita aplicar una respuesta antigua al cambiar rapidamente. Cambiar campana limpia resultados y valores anteriores, incluidos los que la siguiente entrada traiga vacios.

Entradas reales suministradas por el usuario (locale es):

1. `campana-prueba` / nombre mostrado por API: campana-prueba (con la tilde que entregue meta.name).
   https://ww3.pcfactory.cl/api/content/spaces/banners-principales/types/campana/entries/f1bbd79b-c557-4f2f-80bd-8d101480f810?locale=es
2. Copia de la campana de prueba; usar siempre el nombre real de meta.name.
   https://ww3.pcfactory.cl/api/content/spaces/banners-principales/types/campana/entries/a1a77a6a-dc62-4fd9-983f-f1f8562d7a2f?locale=es

Nombres exactos de los campos y destino interno:

| Campo en fields | Destino |
| --- | --- |
| Color del título | titleColor |
| Color del nombre | nameColor |
| Color del precio (oferta y referencial) | priceColor |
| Color del porcentaje de descuento | discountColor |
| Banner Principal Web Desk (1 producto) | background1 |
| Banner Principal Web Desk (2 productos) | background |
| Banner Principal Web Desk (3 productos) | background3 |
| Banner Principal Web Mobile | backgroundMobile |
| Banner Stories | backgroundStory |
| Pantalla FHD | backgroundFhd |
| Banner Mini Totem | backgroundMini |
| Horizontal 5760 | backgroundHorizontal |
| Horizontal 3840 | backgroundHorizontal3840 |

Los campos de imagen del JSON de API son objetos con `url`; no construir rutas ni usar miniaturas. Los colores vacios conservan el color original por formato. El JS mantiene esos datos en `campaignValues`, sin inputs ocultos. En el widget Modyo la eliminación de blanco sigue fija: removeWhite=true, removeInterior=true, tolerance=35. En el generador local se restauraron controles por producto dentro de cada banner: quitar fondo blanco, quitar blancos interiores e intensidad de 5 a 90 (35 inicial). Se aplican al cambiar el control, conservando textos y posiciones, en los formatos de ese grupo; no son ajustes generales ni campos del esquema de Modyo. Cada pestaña conserva su configuración independiente.

En local, el selector de fotos 1–10 y la opción 11 Personalizada con URL siguen en los controles del producto. Las imágenes personalizadas se cargan conservando sus blancos y transparencia originales, sin eliminación de blancos; mientras se usa la opción 11 los controles de recorte se deshabilitan. Si falla la URL personalizada, se vuelve a la foto 1 del catálogo con el recorte configurado. La comprobación de acceso a píxeles se mantiene para asegurar exportación. Prueba Edge con servicios simulados: recorte independiente entre pestañas y conservación de píxeles blancos en una imagen personalizada, además del flujo de generación/exportación existente. Todavía no se trasladó este cambio al widget Modyo.

Distribución local de estos controles: el bloque de fondo ocupa todo el ancho, con las dos opciones de recorte y la intensidad en tres columnas; la ayuda va debajo en una fila completa. Zoom y ejes se alinean debajo con el mismo ancho. En pantallas pequeñas se apilan progresivamente. Estilos exclusivos en `mvp-batch.css`.

### Errores investigados y decisiones

Se probaron anteriormente accesos directos a campos Liquid, `asset_url` y `entrada.as_json`. El filtro devolvio `<!-- Liquid Error -->`, que se interpreto como una URL relativa y termino en `/cert-portal/%3C!--...`. La serializacion Liquid tampoco entrego correctamente el fondo en el entorno del usuario. Esos enfoques se abandonaron: usar la API de contenido por UUID, cuyo JSON el usuario compartio con imagenes presentes. No atribuir automaticamente una imagen faltante a falta de publicacion.

Despues fallo la foto del producto 57024:
`https://assets.pcfactory.cl/public/foto/57024/google_250.jpg?t=1783109815726`.

La captura del usuario confirmo solicitudes google_250.jpg bloqueadas por **Access-Control-Allow-Origin: Missing header**. El bloqueo confirmado corresponde al servidor de fotos del catalogo `assets.pcfactory.cl`; no hay evidencia equivalente que culpe a los fondos de `assets-v3.pcfactory.cl`.

Se recomendo pedir al equipo de desarrollo habilitar `Access-Control-Allow-Origin: https://ww3.pcfactory.cl` en las respuestas de fotos, incluido CDN/cache, o implementar un proxy backend. No quitar crossOrigin=anonymous ni usar no-cors: Canvas necesita acceso a pixeles para quitar blancos y exportar. La extension CORS que intento el usuario no funciono.

### CORS: diferencia con el widget de Ofertas y Lanzamientos

El usuario compartio el JS y HTML de otro widget Modyo que funciona con el mismo endpoint de catalogo. Ese widget obtiene JSON mediante fetch y coloca las URLs de fotos en etiquetas img sin crossorigin; compone textos y precios con HTML, sin leer pixeles ni exportar Canvas. Mostrar esas fotos no demuestra que el servidor permita procesarlas mediante Canvas. Catalogo JSON y descarga de fotos son solicitudes distintas, a servidores distintos.

El generador usa crossOrigin='anonymous', getImageData para quitar blancos y toBlob para exportar PNG/WebP. Requiere autorizacion CORS del servidor de imagenes. No quitar crossOrigin ni copiar Content-Type del fetch del otro widget como solucion. Que ww3 sea un stage interno no desactiva las restricciones del navegador. El proxy Python evita las solicitudes entre origenes desde el navegador al servir los recursos bajo el mismo origen local; no cambia las cabeceras ni los permisos del servidor remoto y no se despliega automaticamente en Modyo.

No se volvieron a consultar las cabeceras externas en esta revision: el bloqueo confirmado corresponde a la captura anterior. Sigue pendiente verificar si desarrollo habilito CORS en el servidor/CDN para https://ww3.pcfactory.cl o proveer un proxy backend para Modyo.

Otra captura mostro `Identifier 'interval' has already been declared` en la pagina Modyo; esa variable no aparece en el JS del generador revisado. Quedo como problema de otro script de la pagina, sin resolver.

### Simulacion local actual

El usuario pidio continuar con sus dos entradas reales mientras se resuelve CORS. No son fixtures de campanas: Python consulta los endpoints reales. El navegador llama al mismo origen local:

- `/api/campaigns/<uuid>`: solo los dos UUID configurados, locale es.
- `/api/products?productsIds=...`: proxy al catalogo de api.pcfactory.cl.
- `/api/image?url=...`: solo HTTPS de assets.pcfactory.cl/public/foto/ y assets-v3.pcfactory.cl/uploads/.

Los ambientes usan archivos JS separados por solicitud del usuario. `mvp.html` carga `mvp-local.js`, que luego carga `mvp-local-generator.js`; este consulta `/api/products` y redirige las fotos y fondos de los dominios autorizados a `/api/image`. Ya no se usa `data-local-proxy` ni `localMode`. Modyo usa exclusivamente `mvp-modyo.js`, con consultas directas. Los cambios futuros de logica deben aplicarse por separado a cada generador. El CSS sigue compartido. No usar proxies publicos ni afirmar que el servidor local resuelve CORS en produccion.

### Diseno vigente

Encabezado simple Generador de banners. Una tarjeta de configuracion con tres secciones numeradas: diseno de campana, productos y formatos de salida. Selector dentro del formulario. Formatos en tarjetas con checkbox y dimensiones, controles verdes, exportacion y boton generar en el pie, estado de carga/error, y bloque de vistas previas y descarga. Estilos responsive, foco visible y respeto de reduced-motion. Se actualizaron mvp.html y ambos HTML de Modyo; comparten CSS. Mantener los tres HTML alineados al modificar estructura.

Formatos: Desk 1920x525 (1/2/3 productos), Mobile 556x416, Stories 1080x1920, FHD 1920x1080, Mini Totem 800x1280, Horizontal 5760x1080 y Horizontal 3840x1080. Salida PNG o WebP. Se conservan controles de productos, textos/precios/foto compartidos y ajustes por formato.

### Validacion y pendientes

Tras separar los ambientes se verifico con `node --check` la sintaxis de `mvp-modyo.js`, `mvp-local.js` y `mvp-local-generator.js`. No se ejecuto una prueba completa en navegador contra servicios reales despues de esta separacion. Para retomar: iniciar `iniciar-mvp.cmd`, recargar con Ctrl+F5 y comprobar generacion y descarga local; en Modyo copiar solamente el JS exclusivo de ese ambiente y validar CORS.

Validado en esta conversacion: sintaxis Node de JS compartido/local; compilacion Python; pruebas simuladas de parseo de campos, URL de Desk, endpoint/locale, carga async y limpieza ante error HTTP; rutas locales con upstream simulado para campanas/catalogo/ambos servidores de imagenes y rechazo de destinos ajenos. Tras el rediseno se comprobo selector dentro del formulario, tres secciones, IDs unicos y copias de HTML Modyo identicas.

No se verificaron aqui acceso real a endpoints externos, render visual final en navegador, exportacion con las entradas reales ni despliegue Modyo. El entorno del agente no pudo conectar a la URL de foto. No confundir pruebas simuladas con exito de integracion real. Pendientes: probar local desde el equipo del usuario y resolver CORS de produccion con desarrollo.

## Notas historicas (versiones anteriores)

Las secciones que siguen describen la evolucion previa. Referencias a inputs de fondos/colores, a cuatro/cinco formatos, al MVP independiente o al modo file pertenecen a esas versiones y no prevalecen sobre el estado vigente anterior.

## Imagen personalizada por URL

El dropdown tiene opciones **1 a 10** para las fotos del catálogo y **11 - Personalizada** para usar la URL del input adicional. El contenido del input se ignora al seleccionar una foto del catálogo. El campo puede completarse antes de elegir la opción 11; editarlo aplica la imagen al salir del campo solo si la 11 está seleccionada.

Si la opción 11 tiene una URL vacía, inválida, sin imagen o sin permisos CORS, se usa la imagen 1 y el dropdown vuelve a 1. La URL se conserva para corregirla. El mismo comportamiento se aplica al regenerar; escritorio y mobile comparten la imagen seleccionada. Cambiar el ID limpia el input y reinicia el selector. Las URLs personalizadas HTTPS de `assets.pcfactory.cl/public/foto/` usan el proxy local, igual que las fotos del catálogo, incluyendo variantes de 500 px. Las de otros dominios se cargan directamente y requieren CORS. En modo `file:` todas se cargan directamente.

Se verificaron con pruebas simuladas la opción 11, el fallback a 1 por URL vacía o fallida y que las opciones del catálogo ignoren el input. Falta la revisión visual en navegador.

## Selector de imagen por producto

Cada acordeón de producto incluye, debajo de los campos de texto y precios, un dropdown de 1 a 10 para el catálogo y una opción 11 para la URL personalizada. La opción 1 usa `imagenes["0"]["250"]`; la 10 usa `imagenes["9"]["250"]`. Se utilizan las URLs reales del objeto del endpoint, sin construir nombres de archivo.

Al cambiar la selección se carga la foto y se actualizan escritorio y mobile, conservando textos, precios y ajustes. Si la imagen no existe o falla su carga/procesamiento, se intenta la principal y el selector vuelve a 1. Si también falla la principal, se muestra el error y las descargas quedan deshabilitadas. Cambiar el ID reinicia el selector a 1. La selección se conserva al regenerar con el mismo ID.

Se verificaron con pruebas simuladas las opciones 2 y 10, el recorte, el fallback por ausencia y error de carga y el cambio de imagen en la escena compartida. No se realizó una prueba visual en navegador.

## Avance: versiones mobile (1 de noviembre de 2026)

El MVP ahora genera, en una misma operación, el banner de escritorio de 1920 × 525 px y **un banner mobile de 556 × 416 px por producto**: uno, dos o tres PNG mobile, respetando el orden de los IDs completados.

- Referencia visual: `ejemplos/556x416.png`. Fondo mobile predeterminado: `ejemplos/ejemplomob.png`, configurable mediante su propio campo de URL.
- Cada pieza mobile muestra título y nombre a la izquierda, foto a la derecha, precio, referencial tachado cuando corresponde y descuento calculado.
- Textos, precios y recorte de blancos se comparten con escritorio. El zoom y los desplazamientos mobile son independientes por producto.
- Cada vista mobile incluye su descarga PNG individual: `banner-mobile-<posición>-<id>.png`.
- La generación valida la exportación de escritorio y de todos los canvas mobile. Los fondos remotos siguen requiriendo CORS.
- Se verificó la lógica con un DOM/canvas simulado para uno, dos y tres productos, edición compartida y bloqueo de descargas ante precios inválidos. Falta validación visual en navegador y prueba contra el catálogo real.

Las secciones siguientes describen la revisión previa; este avance actualiza su alcance: ya hay dos tamaños de salida, escritorio y mobile, y se modificó `mvp.html`.

## Estado actual

Ya existe un **MVP local para generar banners de PC Factory de 1920 × 525 px**, con datos obtenidos de un endpoint real. Permite seleccionar de uno a tres productos, usar un fondo distinto por cantidad, ajustar imágenes, editar textos y precios y descargar el resultado como PNG.

La aplicación original de fichas de cómics sigue disponible como archivo independiente. El MVP de PC Factory tiene su propia interfaz y servidor local.

**La integración con Modyo sigue pendiente:** no hay en esta carpeta una implementación de publicación en el CMS, almacenamiento permanente del PNG ni generación desatendida.

## Archivos del proyecto

| Archivo | Función actual |
| --- | --- |
| [mvp.html](./mvp.html) | Interfaz del generador PC Factory, consulta de productos, edición y composición con Canvas 2D. |
| [servidor-mvp.py](./servidor-mvp.py) | Servidor HTTP local y proxy de catálogo e imágenes, implementado con la biblioteca estándar de Python. |
| [iniciar-mvp.cmd](./iniciar-mvp.cmd) | Cambia a la carpeta del proyecto y ejecuta `python servidor-mvp.py --open`. |
| [ejemplos/](./ejemplos/) | Fondos y referencias gráficas para banners y otros formatos. |
| [taller-de-fichas.html](./taller-de-fichas.html) | Generador original de fichas de cómics de 1080 × 1080 px. |
| [contexto-banners-modyo.md](./contexto-banners-modyo.md) | Contexto del proyecto para retomar el trabajo. |

No hay framework, proceso de build, `package.json` ni suite de pruebas en esta carpeta. El frontend usa HTML, CSS y JavaScript puro; el servidor usa Python sin dependencias externas.

## Cómo ejecutar el MVP

1. Tener Python disponible como `python` en Windows.
2. Ejecutar `iniciar-mvp.cmd`, o abrir una terminal en `banners` y ejecutar:

   ```powershell
   python servidor-mvp.py --open
   ```

3. Abrir `http://127.0.0.1:8765/mvp.html` si el navegador no se abre automáticamente.
4. Completar entre uno y tres IDs numéricos; los valores iniciales son `57024` y `49917`.
5. Elegir el fondo correspondiente y pulsar **Generar banner**.
6. Ajustar los textos, precios, zoom y posición; descargar el PNG.

El servidor escucha únicamente en `127.0.0.1:8765`. Se debe mantener abierta su terminal; `Ctrl+C` lo detiene. No basta con un servidor estático genérico: el modo HTTP del MVP usa las rutas `/api/products` y `/api/image` del servidor incluido.

Existe una alternativa al abrir el HTML con `file:`, que consulta directamente el catálogo y las fotos. Depende de los permisos CORS del entorno y requiere reemplazar los fondos relativos por enlaces HTTP/HTTPS. La vía local con Python es la ruta documentada de ejecución.

## Funcionalidades implementadas en el MVP

### Productos y fondos

- Entre uno y tres IDs; los campos vacíos no se consultan y el orden de los campos completados determina la posición de los productos.
- La cantidad selecciona automáticamente la composición y muestra el campo de fondo correspondiente.
- Fondos iniciales:
  - Un producto: `./ejemplos/ejemplo1.png`.
  - Dos productos: `./ejemplos/MODYO BANNER PPAL 1920x525-sinprecios.png`.
  - Tres productos: `./ejemplos/ejemplo3.png`.
- Los fondos se cargan por ruta/URL y se ajustan a 1920 × 525, aunque tengan otra proporción. No hay selector de archivo para subir un fondo en este MVP.
- Las posiciones y bloques de precio están definidos en el código para cada composición; no es un editor libre de plantillas.

### Edición por producto

Después de consultar el catálogo se habilitan:

- Título principal, inicialmente formado por familia y marca.
- Nombre del producto.
- Precio efectivo y precio referencial, como enteros mayores o iguales a cero.
- Zoom de la imagen entre 50 % y 250 %.
- Desplazamiento horizontal y vertical entre −500 y 500 px.

Los cambios de texto, precios y posición redibujan la escena cargada sin volver a consultar el endpoint. Al regenerar con el mismo ID se conservan los textos y precios editados en la sesión; cambiar el ID vacía y deshabilita esos campos hasta la siguiente carga.

El descuento se calcula con los precios editados: `round((referencial - efectivo) / referencial × 100)`, limitado entre 0 y 100. Solo se muestra si el referencial es mayor que el precio efectivo y mayor que cero. Los importes se formatean con `Intl.NumberFormat('es-CL')` y símbolo `$`.

### Tratamiento de imágenes y exportación

- Usa la foto principal `imagenes['0']['250']` del catálogo, descrita en la interfaz como JPG de 250 px. No obtiene una versión de mayor resolución.
- Permite quitar blancos conectados a los bordes y, opcionalmente, blancos interiores. Ambas opciones están activadas inicialmente.
- Tolerancia configurable de 5 a 90, con valor inicial 35. Los cambios de recorte requieren volver a generar.
- Es un algoritmo de píxeles cercanos al blanco, sin IA; puede borrar detalles claros del producto, especialmente al quitar blancos interiores.
- Dibuja fondo, imágenes, textos y precios con Canvas 2D; exporta con `canvas.toBlob()`.
- Descarga como `banner-<ids separados por guiones>.png`.
- Carga Ubuntu 400, 500 y 700 desde Google Fonts y comprueba su disponibilidad antes de generar. No hay copia al portapapeles en este MVP.
- No hay persistencia de ajustes del MVP en `localStorage` ni guardado de campañas.

## Endpoint y contrato utilizado

Endpoint configurado en frontend y servidor:

```text
https://api.pcfactory.cl/pcfactory-services-catalogo/v1/catalogo/productos/banners
```

Los IDs se envían como parámetros repetidos, por ejemplo:

```text
?productsIds=57024&productsIds=49917
```

El frontend espera un array y busca cada producto por `id`, respetando el orden solicitado. Campos consumidos:

```javascript
{
  id,
  nombre,
  familia: { nombre },
  marca: { nombre },
  precio: { efectivo, referencia },
  imagenes: { '0': { '250': 'https://assets.pcfactory.cl/public/foto/...' } }
}
```

Este esquema resume lo que lee el código; no es una respuesta capturada ni una especificación formal del proveedor. Se exige `precio.efectivo` numérico finito y foto principal. La referencia es opcional: al poblar el editor, si no es numérica se usa el precio efectivo. El descuento mostrado se recalcula localmente.

No hay credenciales ni cabeceras de autenticación configuradas.

## Servidor local y CORS

`servidor-mvp.py` sirve la carpeta del proyecto y agrega:

- `GET /api/products`: acepta entre uno y tres parámetros `productsIds` con dígitos ASCII y consulta el catálogo fijo.
- `GET /api/image?url=...`: permite URLs HTTPS cuyo host sea exactamente `assets.pcfactory.cl` y cuya ruta comience con `/public/foto/`.

Las solicitudes externas tienen un timeout de 20 segundos y un máximo de respuesta de 12 MiB. El servidor comprueba que el catálogo sea JSON y que las fotos tengan un tipo de contenido `image/`; devuelve errores de consulta como HTTP 502. El frontend aplica además un timeout de 25 segundos a la consulta de productos.

El proxy permite cargar catálogo y fotos desde el mismo origen del frontend. **Los fondos remotos no pasan por este proxy**: deben permitir CORS para leer/exportar el canvas. Los fondos incluidos se sirven localmente. El frontend solicita las imágenes con `crossOrigin='anonymous'`.

El servidor incluido es una herramienta de desarrollo local; no representa todavía la arquitectura de producción para Modyo.

## Recursos gráficos disponibles

Además de los tres fondos predeterminados, `ejemplos` contiene referencias de banner principal simple y triple, banner móvil, una imagen `556x416.png`, mini tótem, pantalla FHD, pantallas horizontales y formato story.

La existencia de esas imágenes **no implica soporte de esos formatos en el generador**. El canvas y la exportación actuales están fijados en 1920 × 525 px.

## Aplicación original: taller de fichas

[taller-de-fichas.html](./taller-de-fichas.html) conserva el generador independiente de ofertas de cómics de 1080 × 1080 px. Permite editar información editorial, portada, país, insignia, precios, descuento manual, estado del libro, marca y colores.

Usa Canvas 2D y JavaScript puro. Su flujo principal es `leer()` → `pedir()` → `dibujar()` → `drawFicha()` / `drawPie()` → `canvas.toBlob()`. Incluye descarga y copia de imagen según las capacidades del navegador, dos ejemplos y un prompt copiable para otra IA; ese prompt no llama a un servicio de IA.

Este taller guarda campos y colores en `localStorage`, pero no conserva portadas y logos cargados al recargar. Sus características no deben confundirse con las del MVP PC Factory: por ejemplo, allí el descuento es manual y en el MVP se calcula.

## Pendientes y límites para continuar

1. Validar en navegador el flujo completo con el catálogo real: uno, dos y tres productos, fondos, recorte, edición y descarga. Esta revisión no ejecutó ese flujo.
2. Revisar visualmente nombres largos, productos blancos y fotos de baja resolución. Los tamaños y posiciones son fijos y el recorte puede afectar partes del producto.
3. Definir cómo se alojará el frontend en Modyo y dónde se implementarán las funciones del proxy; las rutas locales `/api/products` y `/api/image` no se trasladan automáticamente al CMS.
4. Confirmar acceso, autenticación, contrato y CORS del catálogo y recursos en el entorno final.
5. Si se necesita una URL pública permanente, almacenamiento o generación sin abrir la página, implementar ese servicio: hoy el PNG se descarga en el navegador.
6. Implementar otros tamaños o formatos solo si se requieren; actualmente hay recursos de referencia, pero un único tamaño de salida.

## Alcance de esta actualización

Se revisaron el HTML del MVP, el servidor, el lanzador, el generador original y el inventario de recursos. Se actualizó únicamente este documento. No se modificó la aplicación, no se consultó el endpoint durante esta revisión y no se publicaron cambios en Modyo.


## Stories por producto (2 de noviembre de 2026)

`mvp.html` genera ahora una storie de 1080 x 1920 px por producto, junto a escritorio y mobile. Usa `ejemplos/ejemplo storie.png` como fondo configurable y `ejemplos/STORIE 1080X1920 -.png` como referencia visual. Comparte foto, textos y precios; cada storie tiene zoom y ejes independientes dentro de su tarjeta, visibles tras generar correctamente. Las tarjetas se conservan al redibujar para no interrumpir el arrastre. Descarga individual `banner-storie-<posicion>-<id>.png` o `.webp`, segun el selector global (WebP nativo al 90%, sin bibliotecas adicionales). La validacion de exportacion incluye los tres formatos. Se verificaron con DOM/canvas simulado uno, dos y tres productos, dimensiones, permanencia de controles y nombre de descarga; falta revision visual en navegador con catalogo real.


## Pantalla FHD (2 de noviembre de 2026)

`mvp.html` incorpora una Pantalla FHD de 1920 x 1080 por producto. Fondo configurable: `ejemplos/Ejemplo PANTALLA FHD 1920X1080 -.png`; referencia: `ejemplos/PANTALLA FHD 1920X1080 -.png`. Marca, titulo, nombre y precios a la izquierda; imagen a la derecha, con zoom y ejes propios por producto. Comparte foto y edicion de textos/precios con los otros formatos. Acordeon vacio hasta generar, descarga individual PNG o WebP nativo al 90%, sin nuevas dependencias. Prueba en Edge con datos y codificacion simulados: uno, dos y tres productos, posiciones salteadas, regeneracion, controles persistentes, precios invalidos y cambio de imagen/fondo.


## Seleccion de formatos (2 de noviembre de 2026)

Sobre Generar Banner hay cuatro checkboxes, marcados inicialmente: Desk, Mobile, Storie y FHD. Solo se cargan fondos, dibujan y validan exportaciones de los formatos seleccionados. Se exige al menos uno antes de consultar el catalogo. Cambiar la seleccion limpia las vistas hasta volver a generar. Si Desk esta desmarcado, los campos compartidos pasan a Datos de productos y sus ajustes exclusivos de escritorio se ocultan. Las opciones se bloquean durante la generacion. Prueba en Edge con catalogo, fondos y codificacion simulados: las 15 combinaciones no vacias para uno, tres y un producto en posicion salteada (45 casos), mas seleccion vacia; validacion de fondos, canvas, controles, descargas, edicion compartida y cambio de foto.


## Banner Mini Totem (2 de noviembre de 2026)

Nuevo formato por producto de 800 x 1280 px. Plantilla configurable `ejemplos/minitotem-ejemplo.png`; referencia `ejemplos/Mini totem 800x1280 -.png`. Foto centrada, titulo y nombre debajo, precio y descuento al pie. Comparte textos, foto y precios; tiene zoom y ejes propios. Checkbox Mini Totem marcado inicialmente; al desmarcarlo no carga el fondo ni genera/exporta piezas y oculta su seccion. Exportacion individual PNG o WebP, sin nuevas dependencias. Prueba en Edge con datos y codificacion simulados: 32 combinaciones de los cinco formatos, uno/dos/tres productos y posiciones salteadas, controles persistentes, edicion, cambio de foto/fondo y bloqueo por precios invalidos. Pendiente revision visual con productos reales.


## Colores de textos (2 de noviembre de 2026)

Opciones generales incluye cuatro inputs de texto CSS: titulo (familia/marca), nombre, precio (oferta y referencial, con tachado) y descuento. Aceptan hexadecimal, rgba/rgb, hsl y nombres CSS compatibles con Canvas. Aplican a todos los productos y los cinco formatos, redibujando sin consultar catalogo. Un valor vacio conserva el color original por formato (precio automatico por defecto). Se valida CSS y su aceptacion por Canvas, se marca el input invalido y se bloquean descargas hasta corregirlo; al generar, la validacion ocurre antes del catalogo. Prueba en Edge con recursos/codificacion simulados y Canvas real: colores dibujados por rol en los cinco formatos, Desk de uno/dos/tres productos, actualizacion inmediata, formatos CSS, valores vacios e invalidos.


## Pantalla Horizontal (5760x1080) (2 de noviembre de 2026)

Nuevo formato por producto de 5760 x 1080 px. Fondo configurable `ejemplos/EJEMPLO-PANTALLA-HORIZONTAL-5760x1080 -.png`; referencia `ejemplos/PANTALLA-HORIZONTAL-5760x1080 -.png`. Textos/precios al centro y foto a la derecha. Checkbox Horizontal marcado inicialmente, seccion oculta al desmarcar, carga/generacion condicional. Zoom y ejes independientes por producto (X hasta +/-1500 px); comparte foto, textos, precios y cuatro colores CSS. Descarga `pantalla-horizontal-<posicion>-<id>.png` o `.webp`. Sin nuevas dependencias. Prueba en Edge con recursos/codificacion simulados: las 64 combinaciones de seis formatos, productos en posiciones salteadas y tres productos, dimensiones, controles persistentes, colores, nombre de descarga, precio invalido y cambio de imagen/fondo. Falta revision visual con catalogo real.


## Horizontal 3840 (2 de noviembre de 2026)

Nuevo formato por producto de 3840 x 1080 px, independiente de Horizontal 5760. Fondo configurable `ejemplos/EJEMPLOPANTALLA-HORIZONTAL-3840X1080 -.png`; referencia `ejemplos/PANTALLA-HORIZONTAL-3840X1080 -.png`. Marca, titulo, nombre, precio, referencial tachado y descuento a la izquierda del producto; foto a la derecha. Checkbox Horizontal 3840 marcado inicialmente, carga y generacion condicionales y seccion oculta al desmarcar. Zoom y ejes propios por producto; X hasta +/-1000 px. Respeta los cuatro colores CSS. Descarga `horizontal-3840-<posicion>-<id>.png` o `.webp`, sin nuevas dependencias. Prueba en Edge con recursos/codificacion simulados: formatos solos, pares con nuevo formato y todos juntos, seleccion vacia, uno/dos/tres productos y posiciones salteadas, dimensiones, controles persistentes, colores, nombre de descarga, precios invalidos, sin descuento y cambio de imagen/fondo. Pendiente revision visual con catalogo real.

## Separacion de JavaScript por ambiente (5 de noviembre de 2026)

Estado vigente: Modyo usa exclusivamente `mvp-modyo.js`, con consultas directas y sin modo local. `mvp.html` carga `mvp-local.js`, que obtiene los nombres de las campanas y luego carga `mvp-local-generator.js`. Este ultimo contiene la logica independiente del generador local: catalogo por `/api/products` e imagenes autorizadas por `/api/image`. Las campanas usan `/api/campaigns/<uuid>`. Python sigue siendo necesario. Los cambios de logica deben aplicarse por separado a cada JS; las referencias anteriores a JS compartido o a `data-local-proxy` quedan reemplazadas por esta separacion.
