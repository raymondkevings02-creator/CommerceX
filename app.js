
/* =====================================================
   COMMERCEX — APPLICATION PRINCIPALE
   Supabase + Authentification + Panier privé
   Catalogue + Administration + Commandes
===================================================== */

const SUPABASE_URL = "https://tamfdjidwwvjeknrpsnu.supabase.co";
const SUPABASE_KEY = "sb_publishable_FhoVI4WalyjgpHjpoGTqow_MJ9LaKce";

const ADMIN_EMAIL = "CommerceX6@gmail.com";
const DRIVER_PHONE = "+50931832938";
const STORAGE_BUCKET = "product-image";

const { createClient } = window.supabase;

const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const $ = selector => document.querySelector(selector);

let currentUser = null;
let currentProfile = null;
let isAdmin = false;
let products = [];
let cart = [];
let authMode = "login";

const money = value =>
  Number(value || 0).toLocaleString("fr-FR") + " HTG";

const escapeHTML = value =>
  String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);

function notify(message) {
  const toast = $("#toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => toast.classList.remove("show"), 3500);
}

/* =====================================================
   1. PANIER INDIVIDUEL
===================================================== */

function getCartKey() {
  return currentUser
    ? `commercex_cart_${currentUser.id}`
    : "commercex_guest_cart";
}

function loadCart() {
  try {
    cart = JSON.parse(localStorage.getItem(getCartKey()) || "[]");
  } catch {
    cart = [];
  }

  renderCart();
}

function saveCart() {
  localStorage.setItem(getCartKey(), JSON.stringify(cart));
  renderCart();
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);

  if (!product) return notify("Produit introuvable.");

  if (Number(product.stock) <= 0) {
    return notify("Ce produit est en rupture de stock.");
  }

  const existing = cart.find(item => item.id === productId);

  if (existing) {
    if (existing.quantity >= Number(product.stock)) {
      return notify("Stock insuffisant.");
    }

    existing.quantity++;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image_url: product.image_url || "",
      quantity: 1
    });
  }

  saveCart();
  notify("Produit ajouté au panier.");
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
}

function changeCartQuantity(productId, change) {
  const item = cart.find(p => p.id === productId);
  const product = products.find(p => p.id === productId);

  if (!item) return;

  const newQuantity = item.quantity + change;

  if (newQuantity <= 0) {
    return removeFromCart(productId);
  }

  if (product && newQuantity > Number(product.stock)) {
    return notify("Stock insuffisant.");
  }

  item.quantity = newQuantity;
  saveCart();
}

function getCartTotal() {
  return cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
}

function renderCart() {
  const container = $("#cartItems");
  const count = $("#cartCount");
  const total = $("#cartTotal");
  const checkoutTotal = $("#checkoutTotal");

  const quantity = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  if (count) count.textContent = quantity;
  if (total) total.textContent = money(getCartTotal());
  if (checkoutTotal) checkoutTotal.textContent = money(getCartTotal());

  if (!container) return;

  if (!cart.length) {
    container.innerHTML = "<p>Ton panier est vide.</p>";
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img
        src="${escapeHTML(item.image_url || "")}"
        alt="${escapeHTML(item.name)}"
        onerror="this.style.display='none'"
      >

      <div>
        <strong>${escapeHTML(item.name)}</strong>
        <p>${money(item.price)}</p>

        <button type="button"
          onclick="changeCartQuantity('${item.id}', -1)">−</button>

        <span>${item.quantity}</span>

        <button type="button"
          onclick="changeCartQuantity('${item.id}', 1)">+</button>

        <button type="button"
          onclick="removeFromCart('${item.id}')">Supprimer</button>
      </div>
    </div>
  `).join("");
}

/* =====================================================
   2. AFFICHAGE DU PANIER
===================================================== */

function openCart() {
  $("#cartOverlay")?.classList.add("active");
}

function closeCart() {
  $("#cartOverlay")?.classList.remove("active");
}

$("#cartButton")?.addEventListener("click", openCart);
$("#closeCartButton")?.addEventListener("click", closeCart);

/* =====================================================
   3. AUTHENTIFICATION CLIENT
===================================================== */

function showAuth(mode = "login") {
  authMode = mode;

  $("#authOverlay").hidden = false;
  $("#authMessage").textContent = "";

  $("#registerNameGroup").hidden = mode !== "register";

  $("#authTitle").textContent =
    mode === "register"
      ? "Créer mon compte CommerceX"
      : "Connexion à CommerceX";

  $("#authDescription").textContent =
    mode === "register"
      ? "Crée ton compte pour acheter sur CommerceX."
      : "Connecte-toi pour retrouver ton panier personnel.";

  $("#authSubmitButton").textContent =
    mode === "register" ? "Créer mon compte" : "Se connecter";

  $("#showLoginButton")?.classList.toggle("primary-button", mode === "login");
  $("#showRegisterButton")?.classList.toggle("primary-button", mode === "register");
}

function closeAuth() {
  $("#authOverlay").hidden = true;
}

$("#accountButton")?.addEventListener("click", () => {
  if (currentUser) {
    updateAccountDisplay();
    $("#authOverlay").hidden = false;
  } else {
    showAuth("login");
  }
});

$("#showLoginButton")?.addEventListener("click", () => showAuth("login"));
$("#showRegisterButton")?.addEventListener("click", () => showAuth("register"));
$("#closeAuthButton")?.addEventListener("click", closeAuth);

$("#authForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  const email = $("#authEmail").value.trim().toLowerCase();
  const password = $("#authPassword").value;
  const name = $("#registerName")?.value.trim() || "";

  const message = $("#authMessage");
  const button = $("#authSubmitButton");

  button.disabled = true;
  message.textContent = "Veuillez patienter...";

  try {
    if (authMode === "register") {
      if (!name) {
        throw new Error("Indique ton nom complet.");
      }

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          }
        }
      });

      if (error) throw error;

      if (data.session) {
        currentUser = data.user;
        await initializeUser();
        closeAuth();
        notify("Ton compte a été créé.");
      } else {
        message.textContent =
          "Compte créé. Vérifie ton e-mail pour confirmer ton inscription, puis connecte-toi.";
      }
    } else {
      const { data, error } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

      if (error) throw error;

      currentUser = data.user;
      await initializeUser();

      closeAuth();
      notify("Connexion réussie.");
    }
  } catch (error) {
    message.textContent = error.message || "Une erreur est survenue.";
  } finally {
    button.disabled = false;
  }
});

async function customerLogout() {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    notify(error.message);
    return;
  }

  currentUser = null;
  currentProfile = null;
  isAdmin = false;
  cart = [];

  updateAccountDisplay();
  loadCart();
  closeAuth();

  notify("Déconnexion réussie.");
}

$("#customerLogoutButton")?.addEventListener(
  "click",
  customerLogout
);

function updateAccountDisplay() {
  const accountButton = $("#accountButton");
  const accountInfo = $("#customerAccountInfo");
  const logoutButton = $("#customerLogoutButton");
  const emailDisplay = $("#customerEmailDisplay");

  if (currentUser) {
    if (accountButton) {
      accountButton.textContent = "Mon compte";
    }

    if (accountInfo) accountInfo.hidden = false;
    if (logoutButton) logoutButton.hidden = false;

    if (emailDisplay) {
      emailDisplay.textContent = currentUser.email;
    }

    if ($("#customerEmail")) {
      $("#customerEmail").value = currentUser.email;
    }
  } else {
    if (accountButton) accountButton.textContent = "Mon compte";
    if (accountInfo) accountInfo.hidden = true;
    if (logoutButton) logoutButton.hidden = true;
  }
}

async function initializeUser() {
  if (!currentUser) return;

  isAdmin = await checkAdmin();

  loadCart();
  updateAccountDisplay();

  if (isAdmin) {
    await showAdminDashboard();
  }
}

/* =====================================================
   4. VÉRIFICATION ADMINISTRATEUR
===================================================== */

async function checkAdmin() {
  if (!currentUser) return false;

  const { data, error } = await supabaseClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (error) {
    console.error("Vérification admin :", error);
    return false;
  }

  return !!data;
}

/* =====================================================
   5. CATALOGUE PRODUITS
===================================================== */

async function loadProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    notify("Impossible de charger les produits.");
    return;
  }

  products = data || [];
  renderProducts();
  renderAdminProducts();
  renderCart();
}

function renderProducts() {
  const grid = $("#productGrid");
  const empty = $("#emptyProducts");

  if (!grid) return;

  if (!products.length) {
    grid.innerHTML = "";
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;

  grid.innerHTML = products.map(product => `
    <article class="product-card">

      <div class="product-image">
        <img
          src="${escapeHTML(product.image_url || "")}"
          alt="${escapeHTML(product.name)}"
          onerror="this.style.display='none'"
        >
      </div>

      <div class="product-info">
        <span>${escapeHTML(product.category || "Autres")}</span>

        <h3>${escapeHTML(product.name)}</h3>

        <p>${escapeHTML(product.description || "")}</p>

        <strong>${money(product.price)}</strong>

        <p>Stock : ${Number(product.stock)}</p>

        <button
          type="button"
          class="primary-button"
          onclick="addToCart('${product.id}')"
          ${Number(product.stock) <= 0 ? "disabled" : ""}
        >
          🛒 Ajouter au panier
        </button>
      </div>
    </article>
  `).join("");
}

/* =====================================================
   6. CHECKOUT : COMPTE OBLIGATOIRE
===================================================== */

$("#checkoutButton")?.addEventListener("click", async () => {
  if (!cart.length) {
    notify("Ton panier est vide.");
    return;
  }

  closeCart();

  if (!currentUser) {
    showAuth("login");
    notify("Connecte-toi pour commander.");
    return;
  }

  $("#customerEmail").value = currentUser.email;
  $("#checkoutOverlay").hidden = false;
  $("#checkoutTotal").textContent = money(getCartTotal());
});

$("#cancelCheckoutButton")?.addEventListener("click", () => {
  $("#checkoutOverlay").hidden = true;
});

/* =====================================================
   7. CRÉATION DE COMMANDE
===================================================== */

$("#checkoutForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  if (!currentUser) {
    $("#checkoutOverlay").hidden = true;
    showAuth("login");
    return;
  }

  if (!cart.length) {
    notify("Ton panier est vide.");
    return;
  }

  const button = $("#confirmOrderButton");
  const message = $("#checkoutMessage");

  button.disabled = true;
  message.textContent = "Enregistrement de ta commande...";

  try {
    const customerName = $("#customerName").value.trim();
    const customerPhone = $("#customerPhone").value.trim();
    const customerAddress = $("#customerAddress").value.trim();

    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser();

    if (userError || !userData.user) {
      throw new Error("Reconnecte-toi avant de commander.");
    }

    const activeUser = userData.user;

    if (activeUser.id !== currentUser.id) {
      throw new Error("Session invalide. Reconnecte-toi.");
    }

    const items = cart.map(item => ({
      product_id: item.id,
      quantity: item.quantity
    }));

    const { data: orderId, error } = await supabaseClient.rpc(
      "create_commercex_order",
      {
        p_customer_name: customerName,
        p_customer_phone: customerPhone,
        p_customer_address: customerAddress,
        p_items: items
      }
    );

    if (error) throw error;

    // Enregistrer l'e-mail du compte dans la commande.
    const { error: emailError } = await supabaseClient
      .from("orders")
      .update({
        customer_email: activeUser.email
      })
      .eq("id", orderId)
      .eq("user_id", activeUser.id);

    if (emailError) {
      console.error("E-mail de commande :", emailError);
    }

    // Notification à l'administrateur.
    const { error: functionError } =
      await supabaseClient.functions.invoke("send-order-email", {
        body: {
          action: "notify_admin",
          order_id: orderId,
          customer_email: activeUser.email
        }
      });

    if (functionError) {
      console.error("Notification e-mail :", functionError);
    }

    cart = [];
    saveCart();

    $("#checkoutForm").reset();
    $("#checkoutOverlay").hidden = true;

    notify("Commande enregistrée ! Elle est en attente de validation.");

    await loadProducts();
  } catch (error) {
    console.error(error);
    message.textContent =
      error.message || "Impossible d'enregistrer la commande.";
  } finally {
    button.disabled = false;
  }
});

/* =====================================================
   8. ADMINISTRATION : CONNEXION
===================================================== */

$("#loginForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  const email = $("#adminEmail").value.trim().toLowerCase();
  const password = $("#adminPassword").value;
  const message = $("#loginMessage");

  message.textContent = "Connexion en cours...";

  try {
    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

    if (error) throw error;

    currentUser = data.user;

    if (!(await checkAdmin())) {
      await supabaseClient.auth.signOut();
      currentUser = null;
      throw new Error("Ce compte n'est pas administrateur.");
    }

    isAdmin = true;

    await initializeUser();
    notify("Bienvenue dans l'administration.");
  } catch (error) {
    message.textContent = error.message;
  }
});

async function showAdminDashboard() {
  if (!isAdmin) return;

  if ($("#adminLogin")) $("#adminLogin").hidden = true;
  if ($("#adminDashboard")) $("#adminDashboard").hidden = false;

  await loadAdminOrders();
  await renderAdminProducts();
}

/* =====================================================
   9. DÉCONNEXION ADMIN
===================================================== */

$("#logoutButton")?.addEventListener("click", async () => {
  await customerLogout();

  if ($("#adminLogin")) $("#adminLogin").hidden = false;
  if ($("#adminDashboard")) $("#adminDashboard").hidden = true;
});

/* =====================================================
   10. AJOUT / MODIFICATION PRODUITS
===================================================== */

async function uploadProductImage(file) {
  if (!file) return null;

  if (!file.type.startsWith("image/")) {
    throw new Error("Choisis un fichier image.");
  }

  const extension = file.name.split(".").pop();
  const filename = `${crypto.randomUUID()}.${extension}`;

  const { error } = await supabaseClient.storage
    .from(STORAGE_BUCKET)
    .upload(filename, file, {
      upsert: false
    });

  if (error) throw error;

  const { data } = supabaseClient.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filename);

  return data.publicUrl;
}

$("#productForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  if (!isAdmin) {
    notify("Accès administrateur requis.");
    return;
  }

  const id = $("#productId").value;
  const name = $("#productName").value.trim();
  const price = Number($("#productPrice").value);
  const category = $("#productCategory").value;
  const stock = Number($("#productStock").value);
  const description = $("#productDescription").value.trim();
  const imageFile = $("#productImage").files[0];

  try {
    let imageUrl = null;

    if (imageFile) {
      imageUrl = await uploadProductImage(imageFile);
    }

    const payload = {
      name,
      price,
      category,
      stock,
      description
    };

    if (imageUrl) payload.image_url = imageUrl;

    let result;

    if (id) {
      result = await supabaseClient
        .from("products")
        .update(payload)
        .eq("id", id);
    } else {
      result = await supabaseClient
        .from("products")
        .insert(payload);
    }

    if (result.error) throw result.error;

    $("#productForm").reset();
    $("#productId").value = "";
    $("#saveProductButton").textContent = "Ajouter le produit";
    $("#cancelEditButton").hidden = true;

    await loadProducts();

    notify(id ? "Produit modifié." : "Produit ajouté.");
  } catch (error) {
    notify(error.message);
  }
});

function renderAdminProducts() {
  const container = $("#adminProductList");

  if (!container || !isAdmin) return;

  container.innerHTML = products.map(product => `
    <div class="admin-product-item">
      <strong>${escapeHTML(product.name)}</strong>
      <span>${money(product.price)}</span>
      <span>Stock : ${Number(product.stock)}</span>

      <button
        type="button"
        onclick="editProduct('${product.id}')"
      >Modifier</button>

      <button
        type="button"
        onclick="deleteProduct('${product.id}')"
      >Supprimer</button>
    </div>
  `).join("");
}

function editProduct(id) {
  if (!isAdmin) return;

  const product = products.find(p => p.id === id);
  if (!product) return;

  $("#productId").value = product.id;
  $("#productName").value = product.name;
  $("#productPrice").value = product.price;
  $("#productCategory").value = product.category;
  $("#productStock").value = product.stock;
  $("#productDescription").value = product.description || "";

  $("#saveProductButton").textContent = "Enregistrer les modifications";
  $("#cancelEditButton").hidden = false;

  $("#administration").scrollIntoView({ behavior: "smooth" });
}

async function deleteProduct(id) {
  if (!isAdmin) return;

  if (!confirm("Supprimer ce produit ?")) return;

  const { error } = await supabaseClient
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    notify(error.message);
    return;
  }

  await loadProducts();
  notify("Produit supprimé.");
}

$("#cancelEditButton")?.addEventListener("click", () => {
  $("#productForm").reset();
  $("#productId").value = "";
  $("#saveProductButton").textContent = "Ajouter le produit";
  $("#cancelEditButton").hidden = true;
});

/* =====================================================
   11. COMMANDES ADMINISTRATEUR
===================================================== */

async function loadAdminOrders() {
  if (!isAdmin) return;

  const container = $("#adminOrdersList");
  if (!container) return;

  const { data: orders, error } = await supabaseClient
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    $("#ordersMessage").textContent = error.message;
    return;
  }

  const allOrders = orders || [];

  $("#totalOrdersCount").textContent = allOrders.length;

  $("#pendingOrdersCount").textContent =
    allOrders.filter(o => o.status === "En attente").length;

  $("#deliveredOrdersCount").textContent =
    allOrders.filter(o => o.status === "Livrée").length;

  $("#ordersRevenue").textContent = money(
    allOrders.reduce((sum, order) => sum + Number(order.total || 0), 0)
  );

  const filter = $("#orderStatusFilter")?.value || "Toutes";

  const filteredOrders = filter === "Toutes"
    ? allOrders
    : allOrders.filter(order => order.status === filter);

  if (!filteredOrders.length) {
    container.innerHTML = "<p>Aucune commande trouvée.</p>";
    return;
  }

  container.innerHTML = filteredOrders.map(order => `
    <article class="admin-order-card">
      <h4>Commande #${escapeHTML(order.id)}</h4>

      <p>Client : ${escapeHTML(order.customer_name)}</p>
      <p>E-mail : ${escapeHTML(order.customer_email || "Non renseigné")}</p>
      <p>Téléphone : ${escapeHTML(order.customer_phone)}</p>
      <p>Adresse : ${escapeHTML(order.customer_address)}</p>
      <p>Total : <strong>${money(order.total)}</strong></p>
      <p>Statut : ${escapeHTML(order.status)}</p>
      <p>Date : ${new Date(order.created_at).toLocaleString("fr-FR")}</p>

      <button
        type="button"
        onclick="showOrderDetails('${order.id}')"
      >Voir les détails</button>

      <select onchange="updateOrderStatus('${order.id}', this.value)">
        <option value="En attente" ${order.status === "En attente" ? "selected" : ""}>En attente</option>
        <option value="Confirmée" ${order.status === "Confirmée" ? "selected" : ""}>Confirmée</option>
        <option value="Expédiée" ${order.status === "Expédiée" ? "selected" : ""}>Expédiée</option>
        <option value="Livrée" ${order.status === "Livrée" ? "selected" : ""}>Livrée</option>
        <option value="Annulée" ${order.status === "Annulée" ? "selected" : ""}>Annulée</option>
      </select>
    </article>
  `).join("");

  $("#ordersMessage").textContent =
    `${filteredOrders.length} commande(s) affichée(s).`;
}

async function updateOrderStatus(orderId, status) {
  if (!isAdmin) return;

  const allowed = [
    "En attente",
    "Confirmée",
    "Expédiée",
    "Livrée",
    "Annulée"
  ];

  if (!allowed.includes(status)) return;

  const { error } = await supabaseClient
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    notify(error.message);
    return;
  }

  notify("Statut de commande mis à jour.");

  await loadAdminOrders();
}

async function showOrderDetails(orderId) {
  if (!isAdmin) return;

  const { data, error } = await supabaseClient
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);

  if (error) return notify(error.message);

  const content = $("#orderDetailsContent");

  content.innerHTML = (data || []).map(item => `
    <div class="order-detail-item">
      <strong>${escapeHTML(item.product_name)}</strong>
      <p>Quantité : ${item.quantity}</p>
      <p>Prix unitaire : ${money(item.unit_price)}</p>
      <p>Sous-total : ${money(item.subtotal)}</p>
    </div>
  `).join("");

  $("#orderDetailsOverlay").hidden = false;
}

$("#closeOrderDetailsButton")?.addEventListener("click", () => {
  $("#orderDetailsOverlay").hidden = true;
});

$("#refreshOrdersButton")?.addEventListener(
  "click",
  loadAdminOrders
);

$("#orderStatusFilter")?.addEventListener(
  "change",
  loadAdminOrders
);

/* =====================================================
   12. INITIALISATION
===================================================== */

async function initializeCommerceX() {
  if ($("#year")) {
    $("#year").textContent = new Date().getFullYear();
  }

  const { data } = await supabaseClient.auth.getSession();

  currentUser = data.session?.user || null;

  loadCart();
  await loadProducts();

  if (currentUser) {
    await initializeUser();
  }

  supabaseClient.auth.onAuthStateChange(
    async (_event, session) => {
      currentUser = session?.user || null;

      if (currentUser) {
        await initializeUser();
      } else {
        currentProfile = null;
        isAdmin = false;
        cart = [];
        updateAccountDisplay();
        loadCart();

        if ($("#adminLogin")) $("#adminLogin").hidden = false;
        if ($("#adminDashboard")) $("#adminDashboard").hidden = true;
      }
    }
  );
}

/* =====================================================
   13. EXPOSITION DES FONCTIONS HTML
===================================================== */

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeCartQuantity = changeCartQuantity;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.updateOrderStatus = updateOrderStatus;
window.showOrderDetails = showOrderDetails;

initializeCommerceX();
