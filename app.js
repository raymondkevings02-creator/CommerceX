
/* ==========================================
   COMMERCEX - APPLICATION JAVASCRIPT
   Supabase + Administration + Catalogue + Panier
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
    price.textContent =
      Number(item.price).toLocaleString("fr-FR") + " HTG";

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
      (item.price * item.quantity).toLocaleString("fr-FR") +
      " HTG";

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

  totalElement.textContent =
    total.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + " HTG";

  const checkoutButton = $("#checkoutButton");

  if (checkoutButton) {
    checkoutButton.disabled = cart.length === 0;
  }
}

// Ouverture du panier

$("#cartButton")?.addEventListener("click", () => {
  $("#cartOverlay")?.classList.add("active");
  renderCart();
});

// Fermeture du panier

$("#closeCartButton")?.addEventListener("click", () => {
  $("#cartOverlay")?.classList.remove("active");
});

// Fermeture en cliquant à l'extérieur

$("#cartOverlay")?.addEventListener("click", (event) => {
  if (event.target.id === "cartOverlay") {
    $("#cartOverlay").classList.remove("active");
  }
});

// Fermeture avec la touche Échap

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    $("#cartOverlay")?.classList.remove("active");
  }
});

// Première actualisation du panier

renderCart();

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
      price.textContent =
        Number(product.price).toLocaleString("fr-FR") + " HTG";

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

      $("#adminLogin").hidden = false;
      $("#adminDashboard").hidden = true;

      $("#loginMessage").textContent =
        "Ce compte n'a pas les droits administrateur.";

      return false;
    }

    $("#adminLogin").hidden = true;
    $("#adminDashboard").hidden = false;
    $("#loginMessage").textContent = "";

    await loadProducts();

    return true;

  } catch (error) {
    console.error("Erreur vérification admin :", error);

    $("#adminLogin").hidden = false;
    $("#adminDashboard").hidden = true;

    $("#loginMessage").textContent =
      "Impossible de vérifier les droits administrateur.";

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

  $("#adminLogin").hidden = false;
  $("#adminDashboard").hidden = true;
  $("#adminPassword").value = "";
  $("#loginMessage").textContent = "";

  toast("Déconnexion réussie.");
});

// ==========================================
// 7. AJOUT ET MODIFICATION DES PRODUITS
// ==========================================

$("#productForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const button = $("#saveProductButton");

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

    const file = $("#productImage").files[0];

    // Vérifier et envoyer la photo

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

    button.textContent = $("#productId").value
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
      Number(product.price).toLocaleString("fr-FR") +
      " HTG · Stock : " + product.stock;

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
// 11. VALIDATION DE COMMANDE
// ==========================================

// Le bouton sera connecté au formulaire de commande
// après la création de la table des commandes dans Supabase.

$("#checkoutButton")?.addEventListener("click", () => {
  if (cart.length === 0) {
    toast("Votre panier est vide.");
    return;
  }

  toast("Préparation du formulaire de commande...");
});

// ==========================================
// 12. DÉMARRAGE DE L'APPLICATION
// ==========================================

renderCart();
loadProducts();
restoreAdminSession();
