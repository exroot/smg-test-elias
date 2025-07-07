document.addEventListener("DOMContentLoaded", function () {
  const allServiceButtons = document.querySelectorAll(".add-to-cart-js");

  function initializeCartLogic() {
    const allServiceButtons = document.querySelectorAll(".add-to-cart-js");
    if (!allServiceButtons.length) return;

    // Activar los botones que estaban deshabilitados por defecto.
    allServiceButtons.forEach((button) => {
      button.disabled = false;
      button.textContent = "Añadir al Carrito"; // Restaura el texto original.
    });
    // Sincronizar estado con el carrito actual (marcando el que ya está añadido).
    syncAllButtonStates();

    // Adjuntar los listeners para que reaccionen a los clics.
    allServiceButtons.forEach((button) => {
      button.addEventListener("click", handleAddToCartClick);
    });
  }

  async function handleAddToCartClick(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const newServiceVariantId = button.dataset.variantId;

    allServiceButtons.forEach((btn) => (btn.disabled = true));
    button.textContent = "Procesando...";

    try {
      // Obtener el ID del regalo que pasamos desde Liquid.
      const giftVariantId = window.smgConfig?.giftProductVariantId;

      if (!giftVariantId) {
        throw new Error("No se ha configurado un producto de regalo.");
      }

      const cart = await (await fetch("/cart.js")).json();
      const serviceInCart = cart.items.find(
        (item) => item.product_type === "Servicio"
      );
      const giftInCart = cart.items.find(
        (item) => item.variant_id == giftVariantId
      );

      let itemsToAdd = [];
      let itemsToUpdate = {};
      let toastMessage = "¡Servicio añadido!";
      let toastType = "success";

      // --- LÓGICA DE DECISIÓN ---
      if (serviceInCart) {
        // Ya hay un servicio en el carrito
        if (serviceInCart.variant_id.toString() !== newServiceVariantId) {
          itemsToUpdate[serviceInCart.variant_id] = 0; // Elimina el viejo.
          itemsToUpdate[newServiceVariantId] = 1; // Añade el nuevo.
          toastMessage = "Servicio actualizado.";
          toastType = "info";
        } else {
          toastMessage = "Este servicio ya está en tu carrito.";
          toastType = "info";
        }
      } else {
        // No hay servicio, es una adición nueva.
        itemsToAdd.push({ id: newServiceVariantId, quantity: 1 });
      }

      // Comprueba si el regalo necesita ser añadido.
      if (!giftInCart) {
        itemsToAdd.push({ id: giftVariantId, quantity: 1 });
      }

      // --- EJECUCIÓN DE LLAMADAS A LA API ---
      let finalCart = cart;
      if (Object.keys(itemsToUpdate).length > 0) {
        finalCart = await (
          await fetch("/cart/update.js", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ updates: itemsToUpdate }),
          })
        ).json();
      }

      if (itemsToAdd.length > 0) {
        finalCart = await (
          await fetch("/cart/add.js", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: itemsToAdd }),
          })
        ).json();
      }

      // Notifica al tema para que actualice el contador y el minicarrito.
      document.dispatchEvent(
        new CustomEvent("cart:updated", {
          bubbles: true,
          detail: { cart: finalCart },
        })
      );

      showToast(toastMessage, toastType);
      syncAllButtonStates(finalCart);

      // Actualiza todas las secciones del carrito usando la Section Rendering API
      await updateCartUI();
    } catch (error) {
      console.error("Error en la operación del carrito:", error);
      showToast(error.message, "error");
      syncAllButtonStates(); // Revertir al estado conocido
    }
  }

  // --- ACTUALIZACIÓN DE LA UI ---
  async function updateCartUI() {
    // Pide el HTML renderizado de la página del carrito, pero solo las secciones que nos interesan.
    const response = await fetch(
      "/cart?sections=cart-icon-bubble,cart-notification"
    );
    const sections = await response.json();
    console.log("Secciones del carrito actualizadas:", sections);
    // Función auxiliar para reemplazar el HTML de una sección.
    const getSectionInnerHTML = (html, selector) => {
      return new DOMParser()
        .parseFromString(html, "text/html")
        .querySelector(selector).innerHTML;
    };

    // Actualiza el icono del carrito en el header.
    const headerElement = document.getElementById("cart-icon-bubble");
    if (headerElement && sections["cart-icon-bubble"]) {
      headerElement.innerHTML = getSectionInnerHTML(
        sections["cart-icon-bubble"],
        ".shopify-section"
      );
    }

    // Muestra la notificación del carrito (¡bonus!).
    const notificationElement = document.querySelector("cart-notification");
    if (notificationElement && sections["cart-notification"]) {
      notificationElement.innerHTML = getSectionInnerHTML(
        sections["cart-notification"],
        "cart-notification"
      );
      notificationElement.show();
    }
  }

  // --- FUNCIONES DE SOPORTE (syncAllButtonStates, showToast) ---
  async function syncAllButtonStates(cart = null) {
    const currentCart = cart || (await (await fetch("/cart.js")).json());
    const serviceInCart = currentCart.items.find(
      (item) => item.product_type === "Servicio"
    );
    allServiceButtons.forEach((button) => {
      const buttonVariantId = button.dataset.variantId;
      if (
        serviceInCart &&
        serviceInCart.variant_id.toString() === buttonVariantId
      ) {
        button.textContent = "¡Añadido!";
        button.disabled = true;
      } else {
        button.textContent = "Añadir al Carrito";
        button.disabled = false;
      }
    });
  }

  function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    const icons = { success: "✓", error: "✖", info: "ℹ" };
    toast.innerHTML = `<span class="toast__icon">${icons[type]}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
      toast.classList.remove("show");
      toast.classList.add("hide");
      toast.addEventListener("transitionend", () => toast.remove(), {
        once: true,
      });
    }, 3000);
  }

  initializeCartLogic();
});
