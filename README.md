# Prueba Técnica: Backend Engineer - Shopify

Este repositorio contiene la solución a la prueba técnica para la vacante de Backend Engineer. El objetivo del proyecto es desarrollar una experiencia de compra personalizada para los servicios de la empresa SMG, integrando lógica de negocio específica directamente en un tema de Shopify.

## Live Demo

- **Página de Servicios:** `https://smg-test-elias.myshopify.com/pages/servicios`
- **Contraseña de la Tienda:** `elias`

## Configuración y Arquitectura

El proyecto se construyó sobre el tema **Dawn**, utilizando las siguientes tecnologías y principios:

- **Plantillas y Secciones (OS 2.0):** Se ha aprovechado al máximo la arquitectura de Online Store 2.0, creando secciones modulares y reutilizables con schemas configurables.
- **Liquid:** Utilizado para la renderización del lado del servidor, la lógica de plantillas y para pasar datos de forma segura al frontend.
- **JavaScript (Vanilla JS):** Toda la lógica del lado del cliente se ha implementado con JavaScript puro para garantizar la máxima compatibilidad y rendimiento, sin dependencias externas. Se ha hecho un uso extensivo de la **Shopify AJAX API** y la **Section Rendering API**.
- **CSS/SCSS:** Se han añadido estilos personalizados de forma organizada para complementar la estética del tema Dawn.

---

## Documentación del Desarrollo

A continuación, se detallan las decisiones técnicas clave tomadas durante el desarrollo, tal como se solicita en los requisitos de la prueba.

### 1. Documentación del Schema de la Página de Servicios

Para crear la página de aterrizaje de los servicios, se implementó una arquitectura basada en plantillas y secciones de OS 2.0, lo que permite una gestión de contenido flexible y sin necesidad de tocar el código.

**Archivos Creados para la página template:**

- `templates/page.servicios-smg.json`: Una plantilla de página JSON que define la estructura y el orden de las secciones que la componen.
- `sections/page-servicios-smg-template.liquid`: La sección principal que muestra la lista de servicios.
- `sections/page-servicios-smg-reviews.liquid`: Una sección secundaria y modular para mostrar las opiniones de los clientes.

**Funcionamiento del Schema `Lista de Servicios`:**

La sección `page-servicios-smg-template.liquid` contiene un schema que expone las siguientes opciones en el personalizador de temas:

- **`featured_collection` (Tipo: `collection`):** Permite al administrador de la tienda seleccionar de forma intuitiva la colección de productos que se mostrarán. En este caso, se seleccionó la colección "Nuestros Servicios", que agrupa automáticamente todos los productos de tipo `Servicio`.
- **`title` (Tipo: `text`):** Un campo de texto simple para personalizar el título de la sección (ej: "Nuestros Servicios").

El código Liquid itera sobre los productos de la colección seleccionada (`collection.products`) y renderiza una tarjeta para cada uno, mostrando su título, descripción y precio.

Este enfoque modular permite que la página sea fácilmente actualizable y mantenible por el equipo de SMG sin intervención de un desarrollador.

---

### 2. Documentación del Desarrollo AJAX "Add to Cart"

Para proporcionar una experiencia de usuario fluida y sin recargas de página, toda la interacción con el carrito se maneja de forma asíncrona mediante la **Shopify AJAX API**.

**Archivo Principal:** `assets/custom-cart.js`

**Flujo de la Operación:**

1.  **Captura del Evento:** Un `event listener` se adjunta a todos los botones con la clase `.add-to-cart-js`. Al hacer clic, se previene la acción por defecto del formulario.
2.  **Llamada a la API:** Se realiza una petición `POST` asíncrona a los endpoints `/cart/update.js` o `/cart/add.js`.
3.  **Actualización de la UI en Tiempo Real:** Tras una respuesta exitosa de la API, en lugar de manipular el DOM manualmente (lo cual es propenso a errores), se utiliza el mecanismo nativo del tema Dawn. Se hace una petición `GET` a `/cart?sections=cart-icon-bubble` utilizando la **Section Rendering API**.
    - Esta petición devuelve el HTML renderizado y actualizado del icono del carrito.
    - El script reemplaza el contenido del icono del carrito en el header con este nuevo HTML, asegurando una actualización instantánea y 100% precisa del contador de ítems.
4.  **Feedback al Usuario:** Se utilizan notificaciones "toast" personalizadas para informar al usuario del resultado de la operación (ej: "¡Servicio añadido!", "Servicio actualizado.").

---

### 3. Documentación de la Lógica de "Un Solo Servicio por Carrito" (Reemplazo)

Este es el núcleo de la lógica de negocio personalizada. El objetivo es asegurar que un cliente solo pueda tener un producto de tipo `Servicio` en su carrito en cualquier momento.

**Implementación:**

La lógica se encuentra centralizada en la función `performCartOperation` dentro de `assets/custom-cart.js`.

1.  **Inspección del Carrito:** Antes de cualquier acción, el script realiza una petición `GET` a `/cart.js` para obtener el estado actual del carrito.
2.  **Identificación del Servicio:** El script itera sobre los ítems del carrito y busca si ya existe un producto cuyo `product_type` sea `Servicio`.
3.  **Lógica Condicional (Reemplazo vs. Adición):**
    - **Si ya existe un servicio en el carrito:** El script construye un objeto `updates` para la API `/cart/update.js`. Este objeto contiene dos instrucciones:
      - `"OLD_SERVICE_VARIANT_ID": 0`: Pone la cantidad del servicio antiguo a cero, eliminándolo del carrito.
      - `"NEW_SERVICE_VARIANT_ID": 1`: Añade el nuevo servicio seleccionado.
    - **Si no existe un servicio en el carrito:** El script simplemente añade el nuevo servicio y el producto de regalo.
4.  **Operación Atómica:** Al usar el endpoint `/cart/update.js` con múltiples operaciones, nos aseguramos de que el reemplazo se realice en una única llamada a la API, lo que es más eficiente y previene estados intermedios inconsistentes.
5.  **Automatización del Regalo:** Para cumplir el requisito de que la adición del regalo sea automática, el script primero obtiene dinámicamente el ID de la variante del producto de regalo (buscando por la etiqueta `Regalo`). Luego, en la misma operación de `update`, se asegura de que el regalo también se añada al carrito si no estaba ya presente. Esto complementa la regla de descuento "Buy X Get Y", que se encarga de poner su precio a cero una vez que ambos ítems están en el carrito.

Esta implementación garantiza que la regla de negocio se cumpla rigurosamente, proporcionando una experiencia de compra clara y sin errores para el cliente.
