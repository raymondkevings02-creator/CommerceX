// COMMERCEX - SUPABASE
// ==========================================

const SUPABASE_URL = "https://tamfdjidwwvjeknrpsnu.supabase.co";
const SUPABASE_KEY = "sb_publishable_FhoVI4WalyjgpHjpoGTqow_MJ9LaKce";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const $ = (selector) => document.querySelector(selector);

$("#year").textContent = new Date().getFullYear();

const toast = (message) => {
  const element = $("#toast");
  if (!element) return;

  element.textContent = message;
  element.classList.add("show");

  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => {
    element.classList.remove("show");
  }, 2600);
};

// ==========================================
// NAVIGATION
// ==========================================

$("#menuToggle").addEventListener("click", () => {
  $(".desktop-nav").classList.toggle("open");
});

$(".desktop-nav").querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    $(".desktop-nav").classList.remove("open");
  });
});

$("#searchToggle").addEventListener("click", () => {
  toast("La recherche sera bientôt disponible.");
});

$("#cartButton").addEventListener("click", () => {
  toast("Le panier sera activé prochainement.");
});

$("#notifyButton")?.addEventListener("click", () => {
  toast("Merci de votre intérêt pour CommerceX !");
});

// ==========================================
// AFFICHAGE DES PRODUITS
// ==========================================

async function loadProducts() {
  const container = $("#productGrid");
  const emptyProducts = $("#emptyProducts");

  const { data: products, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    toast("Impossible de charger les produits.");
    return;
  }

  if (container) {
    container.replaceChildren();
  }

  if (emptyProducts) {
    emptyProducts.hidden = products.length > 0;
  }

  products.forEach((product) => {
    if (container) {
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
      category.textContent = product.category;

      const name = document.createElement("h3");
      name.textContent = product.name;

      const description = document.createElement("p");
      description.textContent = product.description || "";

      const price = document.createElement("strong");
      price.className = "product-price";
      price.textContent =
        Number(product.price).toLocaleString("fr-FR") + " HTG";

      const stock = document.createElement("small");
      stock.textContent = product.stock > 0
        ? "Disponible : " + product.stock
        : "Rupture de stock";

      details.append(category, name, description, price, stock);
      card.appendChild(details);
      container.appendChild(card);
    }
  });

  renderAdminProducts(products);
}

// ==========================================
// CONNEXION ADMINISTRATEUR
// ==========================================

let editingImageUrl = "";

async function checkAdmin(user) {
  const { data, error } = await supabaseClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
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
}

$("#loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = $("#adminEmail").value.trim();
  const password = $("#adminPassword").value;

  $("#loginMessage").textContent = "Connexion en cours...";

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    $("#loginMessage").textContent =
      "Connexion impossible. Vérifie ton e-mail et ton mot de passe.";
    return;
  }

  const authorized = await checkAdmin(data.user);

  if (authorized) {
    toast("Bienvenue dans l'administration CommerceX !");
  }
});

// Restaurer une session existante
async function restoreAdminSession() {
  const { data } = await supabaseClient.auth.getSession();

  if (data.session) {
    await checkAdmin(data.session.user);
  }
}

// ==========================================
// DÉCONNEXION
// ==========================================

$("#logoutButton").addEventListener("click", async () => {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    toast("Erreur pendant la déconnexion.");
    return;
  }

  $("#adminLogin").hidden = false;
  $("#adminDashboard").hidden = true;
  $("#loginPassword").value = "";
  $("#loginMessage").textContent = "";

  toast("Déconnexion réussie.");
});

// ==========================================
// AJOUT ET MODIFICATION DES PRODUITS
// ==========================================

$("#productForm").addEventListener("submit", async (event) => {
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

    // Envoyer la photo dans Supabase Storage
    if (file) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
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
        .from("product-images")
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
    console.error(error);
    toast("Erreur : " + error.message);
  } finally {
    button.disabled = false;
    button.textContent = $("#productId").value
      ? "Enregistrer les modifications"
      : "Ajouter le produit";
  }
});

// ==========================================
// LISTE DES PRODUITS ADMIN
// ==========================================

function renderAdminProducts(products) {
  const list = $("#adminProductList");
  if (!list) return;

  list.replaceChildren();

  if (!products.length) {
    const message = document.createElement("p");
    message.textContent = "Aucun produit enregistré pour le moment.";
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
    editButton.addEventListener("click", () => editProduct(product));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "outline-button";
    deleteButton.textContent = "Supprimer";
    deleteButton.addEventListener("click", () => deleteProduct(product));

    actions.append(editButton, deleteButton);
    item.append(info, actions);
    list.appendChild(item);
  });
}

// ==========================================
// MODIFIER UN PRODUIT
// ==========================================

function editProduct(product) {
  $("#productId").value = product.id;
  $("#productName").value = product.name;
  $("#productPrice").value = product.price;
  $("#productCategory").value = product.category;
  $("#productStock").value = product.stock;
  $("#productDescription").value = product.description || "";

  editingImageUrl = product.image_url || "";

  $("#saveProductButton").textContent = "Enregistrer les modifications";
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

$("#cancelEditButton").addEventListener("click", () => {
  resetProductForm();
});

// ==========================================
// SUPPRIMER UN PRODUIT
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
// DÉMARRAGE
// ==========================================

restoreAdminSession();
loadProducts();
