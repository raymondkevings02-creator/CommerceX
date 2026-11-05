// ==========================================
// COMMERCEX - CONNEXION SUPABASE
// ==========================================

const SUPABASE_URL = "https://tamfdjidwwvjeknrpsnu.supabase.co";
const SUPABASE_KEY = "sb_publishable_FhoVI4WalyjgpHjpoGTqow_MJ9LaKce";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const $ = (selector) => document.querySelector(selector);

// Année du pied de page
$("#year").textContent = new Date().getFullYear();

// Notifications
const toast = (message) => {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");

  window.clearTimeout(toast.timer);

  toast.timer = window.setTimeout(() => {
    element.classList.remove("show");
  }, 2600);
};

// Menu mobile
$("#menuToggle").addEventListener("click", () => {
  $(".desktop-nav").classList.toggle("open");
});

$(".desktop-nav").querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    $(".desktop-nav").classList.remove("open");
  });
});

// Recherche temporaire
$("#searchToggle").addEventListener("click", () => {
  toast("La recherche sera bientôt disponible.");
});

// Panier temporaire
$("#cartButton").addEventListener("click", () => {
  toast("Le panier sera activé prochainement.");
});

// ==========================================
// AFFICHAGE DES PRODUITS
// ==========================================

async function loadProducts() {
  const container = document.querySelector("#productGrid");
  const emptyProducts = document.querySelector("#emptyProducts");

  if (!container) return;

  const { data: products, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur produits :", error);
    toast("Impossible de charger les produits.");
    return;
  }

  container.innerHTML = "";

  if (!products || products.length === 0) {
    if (emptyProducts) emptyProducts.hidden = false;
    return;
  }

  if (emptyProducts) emptyProducts.hidden = true;

  products.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";

    const image = document.createElement("img");
    image.className = "product-image";
    image.alt = product.name;
    image.src = product.image_url || "";
    image.loading = "lazy";

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
    price.textContent = Number(product.price).toLocaleString("fr-FR") + " HTG";

    const stock = document.createElement("small");
    stock.textContent = product.stock > 0
      ? "Disponible : " + product.stock
      : "Rupture de stock";

    details.append(category, name, description, price, stock);
    card.append(image, details);
    container.appendChild(card);
  });
}

// Bouton de notification
$("#notifyButton")?.addEventListener("click", () => {
  toast("Merci de votre intérêt pour CommerceX !");
});

// Charger le catalogue
loadProducts();
