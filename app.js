/* ==========================================
   COMMERCEX - APPLICATION JAVASCRIPT
   Supabase + Administration + Catalogue
   Panier + Commandes + Checkout indépendant
   Notifications e-mail client et administrateur
========================================== */

// ==========================================
// 1. CONFIGURATION SUPABASE
// ==========================================

const SUPABASE_URL = "https://tamfdjidwwvjeknrpsnu.supabase.co";
const SUPABASE_KEY = "sb_publishable_FhoVI4WalyjgpHjpoGTqow_MJ9LaKce";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const $ = (selector) => document.querySelector(selector);

const toast = (message) => {
  const element = $("#toast");
  if (!element) return;

  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    element.classList.remove("show");
  }, 2600);
};

if ($("#year")) {
  $("#year").textContent = new Date().getFullYear();
}

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " HTG";
}

function formatDate(date) {
  if (!date) return "Date inconnue";

  return new Date(date).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

// ==========================================
// 2. NAVIGATION
// ==========================================

$("#menuToggle")?.addEventListener("click", () => {
  $(".desktop-nav")?.classList.toggle("open");
});

$(".desktop-nav")?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    $(".desktop-nav")?.classList.remove("open");
  });
});

$("#searchToggle")?.addEventListener("click", () => {
  toast("La recherche sera bientôt disponible.");
});

$("#notifyButton")?.addEventListener("click", () => {
  toast("Merci de votre intérêt pour CommerceX !");
});

// ==========================================
// 3. GESTION DU PANIER
// ==========================================

let cart = [];

try {
  cart = JSON.parse(
    localStorage.getItem("commercex_cart") || "[]"
  );

  if (!Array.isArray(cart)) cart = [];
} catch (error) {
  console.error("Erreur panier local :", error);
  cart = [];
}

function saveCart() {
  localStorage.setItem(
    "commercex_cart",
    JSON.stringify(cart)
  );
}

function addToCart(product) {
  const stock = Number(product.stock) || 0;

  if (stock <= 0) {
    toast("Ce produit est indisponible.");
    return;
  }

  const existing = cart.find(
    (item) => item.id === product.id
  );

  if (existing) {
    if (existing.quantity >= stock) {
      toast("Stock insuffisant !");
      return;
    }

    existing.quantity++;
    existing.stock = stock;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image_url: product.image_url || "",
      stock: stock,
      quantity: 1
    });
  }

  saveCart();
  renderCart();
  toast("Produit ajouté au panier !");
}

function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  saveCart();
  renderCart();
}

function changeCartQuantity(id, amount) {
  const item = cart.find((product) => product.id === id);

  if (!item) return;

  const newQuantity = item.quantity + amount;

  if (newQuantity <= 0) {
    removeFromCart(id);
    return;
  }

  if (newQuantity > item.stock) {
    toast("Stock insuffisant !");
    return;
  }

  item.quantity = newQuantity;

  saveCart();
  renderCart();
}

function renderCart() {
  const itemsContainer = $("#cartItems");
  const countElement = $("#cartCount");
  const totalElement = $("#cartTotal");

  if (!itemsContainer || !countElement || !totalElement) {
    return;
  }

  itemsContainer.replaceChildren();

  let total = 0;
  let count = 0;

  if (cart.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Votre panier est vide.";
    empty.className = "cart-empty";

    itemsContainer.appendChild(empty);
  }

  cart.forEach((item) => {
    const line = document.createElement("div");
    line.className = "cart-item";

    const name = document.createElement("strong");
    name.textContent = item.name;

    const price = document.createElement("p");
    price.textContent = formatMoney(item.price);

    const quantityControls = document.createElement("div");
    quantityControls.className = "quantity-controls";

    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    minus.setAttribute("aria-label", "Diminuer la quantité");

    const quantity = document.createElement("span");
    quantity.textContent = item.quantity;

    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.setAttribute("aria-label", "Augmenter la quantité");

    minus.addEventListener("click", () => {
      changeCartQuantity(item.id, -1);
    });

    plus.addEventListener("click", () => {
      changeCartQuantity(item.id, 1);
    });

    quantityControls.append(minus, quantity, plus);

    const subtotal = document.createElement("p");
    subtotal.textContent =
      "Sous-total : " +
      formatMoney(item.price * item.quantity);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Retirer";

    remove.addEventListener("click", () => {
      removeFromCart(item.id);
    });

    line.append(
      name,
      price,
      quantityControls,
      subtotal,
      remove
    );

    itemsContainer.appendChild(line);

    total += Number(item.price) * item.quantity;
    count += item.quantity;
  });

  countElement.textContent = count;
  totalElement.textContent = formatMoney(total);

  const checkoutButton = $("#checkoutButton");

  if (checkoutButton) {
    checkoutButton.disabled = cart.length === 0;
  }
}

// Ouvrir le panier

$("#cartButton")?.addEventListener("click", () => {
  $("#cartOverlay")?.classList.add("active");
  renderCart();
});

// Fermer le panier

$("#closeCartButton")?.addEventListener("click", () => {
  $("#cartOverlay")?.classList.remove("active");
});

// Fermer en cliquant à l'extérieur

$("#cartOverlay")?.addEventListener("click", (event) => {
  if (event.target.id === "cartOverlay") {
    $("#cartOverlay").classList.remove("active");
  }
});

// Aller vers la nouvelle page de commande

$("#checkoutButton")?.addEventListener("click", () => {
  if (cart.length === 0) {
    toast("Votre panier est vide.");
    return;
  }

  saveCart();
  window.location.href = "checkout.html";
});

// ==========================================
// 4. AFFICHAGE DES PRODUITS
// ==========================================

async function loadProducts() {
  const container = $("#productGrid");
  const emptyProducts = $("#emptyProducts");

  try {
    const { data: products, error } = await supabaseClient
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const productList = products || [];

    if (container) {
      container.replaceChildren();
    }

    if (emptyProducts) {
      emptyProducts.hidden = productList.length > 0;
    }

    productList.forEach((product) => {
      if (!container) return;

      const card = document.createElement("article");
      card.className = "product-card";

      if (product.image_url) {
        const image = document.createElement("img");

        image.className = "product-image";
        image.src = product.image_url;
        image.alt = product.name;
        image.loading = "lazy";

        image.onerror = () => {
          image.style.display = "none";
        };

        card.appendChild(image);
      }

      const details = document.createElement("div");
      details.className = "product-details";

      const category = document.createElement("span");
      category.className = "product-category";
      category.textContent = product.category || "Autres";

      const name = document.createElement("h3");
      name.textContent = product.name;

      const description = document.createElement("p");
      description.textContent = product.description || "";

      const price = document.createElement("strong");
      price.className = "product-price";
      price.textContent = formatMoney(product.price);

      const stock = document.createElement("small");
      stock.textContent = Number(product.stock) > 0
        ? "Disponible : " + product.stock
        : "Rupture de stock";

      const addButton = document.createElement("button");
      addButton.type = "button";
      addButton.className = "add-to-cart-button";
      addButton.textContent = "🛒 Ajouter au panier";

      addButton.disabled = Number(product.stock) <= 0;

      if (addButton.disabled) {
        addButton.textContent = "Rupture de stock";
      }

      addButton.addEventListener("click", () => {
        addToCart(product);
      });

      details.append(
        category,
        name,
        description,
        price,
        stock,
        addButton
      );

      card.appendChild(details);
      container.appendChild(card);
    });

    renderAdminProducts(productList);

  } catch (error) {
    console.error("Erreur chargement produits :", error);
    toast("Impossible de charger les produits.");
  }
}
// ==========================================
// 5. CONNEXION ADMINISTRATEUR
// ==========================================

let editingImageUrl = "";

async function checkAdmin(user) {
  try {
    const { data, error } = await supabaseClient
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      await supabaseClient.auth.signOut();

      if ($("#adminLogin")) $("#adminLogin").hidden = false;
      if ($("#adminDashboard")) $("#adminDashboard").hidden = true;

      if ($("#loginMessage")) {
        $("#loginMessage").textContent =
          "Ce compte n'a pas les droits administrateur.";
      }

      return false;
    }

    if ($("#adminLogin")) $("#adminLogin").hidden = true;
    if ($("#adminDashboard")) $("#adminDashboard").hidden = false;

    if ($("#loginMessage")) $("#loginMessage").textContent = "";

    await loadProducts();
    await loadOrders();

    return true;

  } catch (error) {
    console.error("Erreur vérification admin :", error);

    if ($("#adminLogin")) $("#adminLogin").hidden = false;
    if ($("#adminDashboard")) $("#adminDashboard").hidden = true;

    if ($("#loginMessage")) {
      $("#loginMessage").textContent =
        "Impossible de vérifier les droits administrateur.";
    }

    return false;
  }
}

$("#loginForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = $("#adminEmail").value.trim();
  const password = $("#adminPassword").value;

  $("#loginMessage").textContent = "Connexion en cours...";

  const { data, error } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    console.error("Erreur connexion :", error);

    $("#loginMessage").textContent =
      "Connexion impossible. Vérifie ton e-mail et ton mot de passe.";

    return;
  }

  const authorized = await checkAdmin(data.user);

  if (authorized) {
    toast("Bienvenue dans l'administration CommerceX !");
  }
});

// Restaurer la session

async function restoreAdminSession() {
  try {
    const { data, error } =
      await supabaseClient.auth.getSession();

    if (error) throw error;

    if (data.session) {
      await checkAdmin(data.session.user);
    }

  } catch (error) {
    console.error("Erreur restauration session :", error);
  }
}

// ==========================================
// 6. DÉCONNEXION ADMIN
// ==========================================

$("#logoutButton")?.addEventListener("click", async () => {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    toast("Erreur pendant la déconnexion.");
    console.error(error);
    return;
  }

  if ($("#adminLogin")) $("#adminLogin").hidden = false;
  if ($("#adminDashboard")) $("#adminDashboard").hidden = true;
  if ($("#adminPassword")) $("#adminPassword").value = "";
  if ($("#loginMessage")) $("#loginMessage").textContent = "";

  toast("Déconnexion réussie.");
});

// ==========================================
// 7. AJOUT ET MODIFICATION DES PRODUITS
// ==========================================

$("#productForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const button = $("#saveProductButton");

  if (!button) return;

  button.disabled = true;
  button.textContent = "Enregistrement...";

  try {
    const id = $("#productId").value;

    const product = {
      name: $("#productName").value.trim(),
      price: Number($("#productPrice").value),
      category: $("#productCategory").value,
      stock: Number($("#productStock").value),
      description: $("#productDescription").value.trim(),
      image_url: editingImageUrl || null
    };

    const file = $("#productImage")?.files?.[0];

    if (file) {
      if (!file.type.startsWith("image/")) {
        throw new Error("Le fichier doit être une image.");
      }

      const safeName = file.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

      const filePath =
        Date.now() + "-" + crypto.randomUUID() + "-" + safeName;

      const { error: uploadError } = await supabaseClient
        .storage
        .from("product-image")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: imageData } = supabaseClient
        .storage
        .from("product-image")
        .getPublicUrl(filePath);

      product.image_url = imageData.publicUrl;
    }

    let result;

    if (id) {
      result = await supabaseClient
        .from("products")
        .update(product)
        .eq("id", id);
    } else {
      result = await supabaseClient
        .from("products")
        .insert(product);
    }

    if (result.error) throw result.error;

    toast(id ? "Produit modifié !" : "Produit ajouté !");

    resetProductForm();

    await loadProducts();

  } catch (error) {
    console.error("Erreur enregistrement :", error);
    toast("Erreur : " + error.message);

  } finally {
    button.disabled = false;

    button.textContent = $("#productId")?.value
      ? "Enregistrer les modifications"
      : "Ajouter le produit";
  }
});

// ==========================================
// 8. LISTE DES PRODUITS ADMIN
// ==========================================

function renderAdminProducts(products) {
  const list = $("#adminProductList");

  if (!list) return;

  list.replaceChildren();

  if (!products.length) {
    const message = document.createElement("p");

    message.textContent =
      "Aucun produit enregistré pour le moment.";

    list.appendChild(message);
    return;
  }

  products.forEach((product) => {
    const item = document.createElement("div");
    item.className = "admin-product-item";

    const info = document.createElement("div");

    const name = document.createElement("strong");
    name.textContent = product.name;

    const details = document.createElement("small");

    details.textContent =
      formatMoney(product.price) +
      " · Stock : " + product.stock;

    info.append(name, details);

    const actions = document.createElement("div");
    actions.className = "admin-product-actions";

    const editButton = document.createElement("button");

    editButton.type = "button";
    editButton.className = "outline-button";
    editButton.textContent = "Modifier";

    editButton.addEventListener("click", () => {
      editProduct(product);
    });

    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className = "outline-button";
    deleteButton.textContent = "Supprimer";

    deleteButton.addEventListener("click", () => {
      deleteProduct(product);
    });

    actions.append(editButton, deleteButton);
    item.append(info, actions);

    list.appendChild(item);
  });
}

// ==========================================
// 9. MODIFIER UN PRODUIT
// ==========================================

function editProduct(product) {
  $("#productId").value = product.id;
  $("#productName").value = product.name;
  $("#productPrice").value = product.price;
  $("#productCategory").value = product.category;
  $("#productStock").value = product.stock;
  $("#productDescription").value = product.description || "";

  editingImageUrl = product.image_url || "";

  $("#saveProductButton").textContent =
    "Enregistrer les modifications";

  $("#cancelEditButton").hidden = false;

  $("#productForm").scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function resetProductForm() {
  $("#productForm").reset();

  $("#productId").value = "";
  editingImageUrl = "";

  $("#saveProductButton").textContent = "Ajouter le produit";
  $("#cancelEditButton").hidden = true;
}

$("#cancelEditButton")?.addEventListener("click", () => {
  resetProductForm();
});

// ==========================================
// 10. SUPPRIMER UN PRODUIT
// ==========================================

async function deleteProduct(product) {
  const confirmed = window.confirm(
    "Veux-tu vraiment supprimer le produit « " +
    product.name + " » ?"
  );

  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("products")
    .delete()
    .eq("id", product.id);

  if (error) {
    console.error(error);
    toast("Impossible de supprimer ce produit.");
    return;
  }

  toast("Produit supprimé.");

  await loadProducts();
}

// ==========================================
// 11. GESTION DES COMMANDES ADMIN
// ==========================================

let cachedOrders = [];

const ORDER_STATUSES = [
  "En attente",
  "Confirmée",
  "Expédiée",
  "Livrée",
  "Annulée"
];

async function loadOrders() {
  const list = $("#adminOrdersList");
  const message = $("#ordersMessage");

  if (!list) return;

  if (message) {
    message.textContent = "Chargement des commandes...";
  }

  try {
    const { data: orders, error } = await supabaseClient
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const orderList = orders || [];
    const orderIds = orderList.map((order) => order.id);

    let orderItems = [];

    if (orderIds.length > 0) {
      const { data: items, error: itemsError } =
        await supabaseClient
          .from("order_items")
          .select("*")
          .in("order_id", orderIds);

      if (itemsError) throw itemsError;

      orderItems = items || [];
    }

    cachedOrders = orderList.map((order) => ({
      ...order,
      items: orderItems.filter(
        (item) => item.order_id === order.id
      )
    }));

    renderOrders(cachedOrders);

    if (message) {
      message.textContent =
        cachedOrders.length + " commande(s) enregistrée(s).";
    }

  } catch (error) {
    console.error("Erreur chargement commandes :", error);

    if (message) {
      message.textContent =
        "Impossible de charger les commandes.";
    }
  }
}
cachedOrders = orderList.map((order) => ({
  ...order,
  order_items: orderItems.filter(
    (item) => item.order_id === order.id
  )
}));
// ==========================================
// 18. VALIDATION DE L'ADRESSE E-MAIL
// ==========================================

function isValidCustomerEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ==========================================
// 19. PARTAGE DE COMMANDE ET PHOTOS WHATSAPP
// ==========================================

const WHATSAPP_SELLERS_GROUP =
  "https://chat.whatsapp.com/Fy9aaXnHuJG9vsDqW8d38i?s=cl&p=a&mlu=4&ilr=4&iam=2";

let commerceXShareData = null;

// Construire le message de commande

function buildWhatsAppOrderMessage(orderId, customer, orderedItems) {
  const reference =
    "CX-" + String(orderId).slice(0, 8).toUpperCase();

  const productLines = orderedItems.map((item, index) => {
    const subtotal = Number(item.price) * Number(item.quantity);

    return (
      (index + 1) + ". " + item.name +
      "\n   Quantité : " + item.quantity +
      "\n   Prix unitaire : " + formatMoney(item.price) +
      "\n   Sous-total : " + formatMoney(subtotal)
    );
  });

  const total = orderedItems.reduce((sum, item) => {
    return sum + Number(item.price) * Number(item.quantity);
  }, 0);

  return [
    "🛍️ NOUVELLE COMMANDE COMMERCEX",
    "",
    "Référence : " + reference,
    "Client : " + customer.name,
    "E-mail : " + customer.email,
    "Téléphone : " + customer.phone,
    "Adresse : " + customer.address,
    "",
    "ARTICLES COMMANDÉS :",
    productLines.join("\n\n"),
    "",
    "TOTAL : " + formatMoney(total),
    "",
    "Bonjour, je viens de passer cette commande sur CommerceX.",
    "Merci de me confirmer la disponibilité et la date prévue de livraison."
  ].join("\n");
}

// Préparer les photos des produits

async function prepareWhatsAppOrderShare(
  orderId,
  customer,
  orderedItems
) {
  const message = buildWhatsAppOrderMessage(
    orderId,
    customer,
    orderedItems
  );

  const files = [];

  for (let index = 0; index < orderedItems.length; index++) {
    const item = orderedItems[index];

    if (!item.image_url) continue;

    try {
      const response = await fetch(
        item.image_url,
        { mode: "cors" }
      );

      if (!response.ok) {
        throw new Error("Photo inaccessible");
      }

      const blob = await response.blob();

      if (!blob.type.startsWith("image/")) {
        throw new Error("Le fichier récupéré n'est pas une image");
      }

      const extension = blob.type
        .split("/")[1]
        .replace("jpeg", "jpg")
        .split(";")[0];

      const safeName = String(item.name || "article")
        .replace(/[^a-z0-9-_]/gi, "-")
        .slice(0, 35);

      files.push(
        new File(
          [blob],
          "CommerceX-" + (index + 1) + "-" +
          safeName + "." + extension,
          { type: blob.type }
        )
      );

    } catch (error) {
      console.warn(
        "Photo non préparée pour WhatsApp :",
        item.name,
        error
      );
    }
  }

  commerceXShareData = {
    message,
    files
  };

  return files.length;
}

// ==========================================
// 20. BOUTON DE PARTAGE WHATSAPP
// ==========================================

function showWhatsAppShareButton() {
  const message = $("#checkoutMessage");

  if (!message) return;

  $("#shareWhatsAppOrderButton")?.remove();

  const shareButton = document.createElement("button");

  shareButton.type = "button";
  shareButton.id = "shareWhatsAppOrderButton";
  shareButton.className = "btn btn-primary";

  shareButton.textContent =
    "Partager la commande et les photos sur WhatsApp";

  shareButton.addEventListener("click", async () => {
    if (!commerceXShareData) {
      toast("Le récapitulatif de commande n'est pas encore prêt.");
      return;
    }

    const {
      message: orderMessage,
      files
    } = commerceXShareData;

    // Partage du message et des photos

    if (
      files.length > 0 &&
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files })
    ) {
      try {
        await navigator.share({
          title: "Commande CommerceX",
          text: orderMessage,
          files
        });

        return;

      } catch (error) {
        if (error.name === "AbortError") return;

        console.warn(
          "Partage avec photos impossible :",
          error
        );
      }
    }

    // Partage du texte si les photos ne sont pas compatibles

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Commande CommerceX",
          text: orderMessage
        });

        return;
      }

    } catch (error) {
      if (error.name === "AbortError") return;

      console.warn(
        "Partage du texte impossible :",
        error
      );
    }

    // Solution de secours : copier le message

    try {
      await navigator.clipboard.writeText(orderMessage);

      toast(
        "Message copié. Colle-le dans le groupe WhatsApp."
      );

    } catch (error) {
      toast(
        "Ouvre le groupe WhatsApp et envoie les informations de la commande."
      );
    }

    window.open(
      WHATSAPP_SELLERS_GROUP,
      "_blank",
      "noopener,noreferrer"
    );
  });

  message.insertAdjacentElement(
    "afterend",
    shareButton
  );
}

// ==========================================
// 21. SOUMISSION DE LA COMMANDE
// ==========================================

$("#checkoutForm")?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    const button = $("#confirmOrderButton");
    const message = $("#checkoutMessage");

    if (!button) return;

    if (cart.length === 0) {
      if (message) {
        message.textContent = "Votre panier est vide.";
      }

      return;
    }

    const customerName =
      $("#customerName")?.value.trim() || "";

    const customerEmail =
      $("#customerEmail")?.value.trim() || "";

    const customerPhone =
      $("#customerPhone")?.value.trim() || "";

    const customerAddress =
      $("#customerAddress")?.value.trim() || "";

    if (
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !customerAddress
    ) {
      if (message) {
        message.textContent =
          "Remplis toutes les informations obligatoires.";
      }

      return;
    }

    if (!isValidCustomerEmail(customerEmail)) {
      if (message) {
        message.textContent =
          "Entre une adresse e-mail valide.";
      }

      return;
    }

    button.disabled = true;
    button.textContent = "Enregistrement...";

    if (message) {
      message.textContent =
        "Enregistrement de ta commande...";
    }

    try {
      // Conserver les articles, prix et photos
      // avant de vider le panier.

      const orderedItems = cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        image_url: item.image_url || ""
      }));

      const customerInfo = {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        address: customerAddress
      };

      // Préparer les produits pour Supabase

      const items = orderedItems.map((item) => ({
        product_id: item.id,
        quantity: Number(item.quantity)
      }));

      // 1. Créer la commande dans Supabase

      const { data, error } =
        await supabaseClient.rpc(
          "create_commercex_order",
          {
            p_customer_name: customerName,
            p_customer_phone: customerPhone,
            p_customer_address: customerAddress,
            p_items: items
          }
        );

      if (error) throw error;

      if (!data) {
        throw new Error(
          "La commande n'a pas été confirmée par le serveur."
        );
      }

      const orderId = data;

      // 2. Vider le panier après confirmation

      cart = [];

      saveCart();
      renderCart();

      // 3. Envoyer les e-mails

      let emailSent = false;

      if (message) {
        message.textContent =
          "Commande enregistrée. Envoi des notifications...";
      }

      try {
        const {
          data: emailResult,
          error: emailError
        } = await supabaseClient.functions.invoke(
          "send-order-email",
          {
            body: {
              order_id: orderId,
              customer_email: customerEmail
            }
          }
        );

        if (emailError) throw emailError;

        if (emailResult?.error) {
          throw new Error(emailResult.error);
        }

        emailSent = true;

        console.log(
          "Résultat des e-mails :",
          emailResult
        );

      } catch (emailError) {
        console.error(
          "Erreur e-mail :",
          emailError
        );
      }

      // 4. Confirmer la commande

      $("#checkoutForm").reset();

      if (message) {
        message.textContent = emailSent
          ? "Commande confirmée ! Une notification par e-mail a été envoyée. Préparation du partage WhatsApp..."
          : "Commande enregistrée avec succès. Préparation du partage WhatsApp...";
      }

      toast(
        "Commande confirmée ! Référence : CX-" +
        String(orderId).slice(0, 8).toUpperCase()
      );

      renderCheckoutPage();

      // 5. Préparer les photos et le récapitulatif

      const preparedPhotoCount =
        await prepareWhatsAppOrderShare(
          orderId,
          customerInfo,
          orderedItems
        );

      if (message) {
        message.textContent = preparedPhotoCount > 0
          ? "Ta commande est enregistrée. " +
            preparedPhotoCount +
            " photo(s) prête(s) à être partagée(s) avec le récapitulatif. Clique ci-dessous, puis sélectionne le groupe WhatsApp des vendeurs."
          : "Ta commande est enregistrée. Le récapitulatif est prêt. Clique ci-dessous pour le partager dans le groupe WhatsApp des vendeurs. Les photos pourront être ajoutées manuellement si ton navigateur ne permet pas leur partage automatique.";
      }

      // 6. Afficher le bouton WhatsApp

      showWhatsAppShareButton();

    } catch (error) {
      console.error(
        "Erreur commande :",
        error
      );

      if (message) {
        message.textContent =
          error.message ||
          "Impossible d'enregistrer la commande.";
      }

      toast("Impossible d'enregistrer la commande.");

    } finally {
      button.disabled = false;

      button.textContent =
        "Confirmer ma commande";
    }
  }
);

// ==========================================
// 22. AFFICHER LES ARTICLES DU CHECKOUT
// ==========================================

renderCheckoutPage();

// ==========================================
// 23. FERMETURE AVEC LA TOUCHE ÉCHAP
// ==========================================

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    $("#cartOverlay")?.classList.remove("active");

    closeOrderDetails();
  }
});

// ==========================================
// 24. DÉMARRAGE DE L'APPLICATION
// ==========================================

renderCart();

loadProducts();

restoreAdminSession();
