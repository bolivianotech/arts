# Cómo hacer correos HTML (estilo `sample_art.jpg`) para AIgentic Bolivianotech

## Regla #1: un correo NO es una página web
Gmail y Outlook ignoran gran parte del CSS moderno. Por eso:
- **Layout con `<table>`**, no con `div`/flex/grid.
- **CSS inline** (`style="..."` en cada elemento). El `<style>` del `<head>` solo sirve para el responsive.
- **Sin JavaScript, sin SVG, sin animaciones.** Los logos deben ser **PNG** (`email/img/`).
- Ancho máximo **600 px**; en móvil se adapta con `@media (max-width:620px)`.
- **Fuente**: Inter con alternativas (`-apple-system, 'Segoe UI', Arial`). Muchos clientes no cargan Inter y usarán la alternativa; es normal.

## Anatomía del correo de referencia (de arriba abajo)
1. **Hero**: fondo de color + título grande + imagen. (Derco: rojo → AIgentic: negro)
2. **Saludo + botón principal (CTA)**.
3. **Tarjeta gris** con 3 opciones/precios.
4. **Dos columnas**: imagen + lista.
5. **Bloque oscuro** con segundo CTA.
6. **Footer** con logos y términos.

`plantilla-aigentic.html` ya trae estas 6 secciones. Cada una es un `<tr>` dentro de la tabla principal: para quitar una sección, borra su `<tr>`; para duplicarla, cópiala.

## Marca AIgentic aplicada
- Solo monocromo: `#000000`, `#1D1D1F`, `#4A4A4F`, `#86868B`, `#D2D2D7`, `#F5F5F7`, `#FFFFFF`. **Sin colores de acento.**
- Jerarquía con tamaño/peso, no con color. Slogan: *"Inteligencia con raíces."*
- Botón principal: negro sobre blanco; sobre fondo oscuro: blanco con texto negro.

## Flujo de trabajo
1. Abre `plantilla-aigentic.html` en el navegador y edita textos, enlaces (`https://TU-ENLACE-AQUI`) y precios.
2. **Imágenes**: súbelas a un hosting público (tu web, Cloudinary, etc.) y usa la URL **completa** en `src="https://..."`. Las rutas relativas (`img/...`) solo funcionan en tu computador. Siempre pon `alt` y `width`.
3. Fotos de ~1200 px de ancho (se ven nítidas en pantallas retina), peso < 200 KB cada una.
4. **Pruebas** antes de enviar: Gmail, Outlook y móvil. Herramientas: Litmus, Email on Acid o enviarte pruebas.
5. Pega el HTML en tu plataforma de envío (Mailchimp, Brevo, Mailerlite, etc.). Incluye el enlace de **baja** que exige la plataforma.

## Errores comunes
- Usar imágenes para el texto (si no cargan, el correo queda vacío). Deja el texto como texto.
- Botones hechos con imagen: usa el enlace con `padding` como en la plantilla.
- Olvidar el *preheader* (el texto oculto del inicio que aparece junto al asunto).
- Correos > 100 KB de HTML: Gmail los recorta.
