document.addEventListener("DOMContentLoaded", function () {
  // Seleccionamos todos los botones de eliminar que tienen nuestra clase personalizada.
  const removeButtons = document.querySelectorAll(".cart-item-remove-btn");

  removeButtons.forEach((button) => {
    button.addEventListener("click", async function (event) {
      // Prevenimos que el enlace navegue a su href original.
      event.preventDefault();
      // Evitamos que el evento se propague a otros elementos.
      event.stopPropagation();

      const itemCart = document.querySelector('[data-is-gift="true"]');

      const variantId = this.dataset.variantId;
      const giftVariantId = itemCart.dataset.giftVariantId;

      const itemsToRemove = {
        [variantId]: 0, // Pone la cantidad del servicio a 0.
        [giftVariantId]: 0, // Pone la cantidad del regalo a 0.
      };

      // Llamamos a nuestra función para actualizar el carrito.
      updateCart(itemsToRemove);
    });

    // Deshabilita los botones de eliminar al inicio para evitar clics múltiples.
    const removeButtons = document.querySelectorAll(
      ".cart-item-remove-btn.is-loading"
    );
    removeButtons.forEach((button) => {
      button.classList.remove("is-loading");
    });
  });

  // Envía una petición a la API de Shopify para actualizar el carrito y luego recarga la página
  async function updateCart(updates) {
    try {
      await fetch("/cart/update.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates }),
      });

      // Una vez que la API responde, recargamos la página del carrito para ver los cambios.
      window.location.href = "/cart";
    } catch (error) {
      console.error("Error al actualizar el carrito:", error);
    }
  }
});
