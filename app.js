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
const { error: deleteError } = await supabaseClient
        .from("products")
        .delete()
        .eq("id", product.id);

      if (deleteError) {
        toast("Erreur : suppression impossible.");
        return;
      }

      toast("Produit supprimé.");
      await loadAdminProducts();
      await loadProducts();
    });

    item.append(info, editButton, deleteButton);
    adminProductList.appendChild(item);
  });
}

// Annuler une modification
$("#cancelEditButton")?.addEventListener("click", () => {
  productForm.reset();
  $("#productId").value = "";
  $("#saveProductButton").textContent = "Ajouter le produit";
  $("#cancelEditButton").hidden = true;
});

// Ajouter ou modifier un produit
productForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentAdmin) {
    toast("Connecte-toi comme administrateur.");
    return;
  }

  const saveButton = $("#saveProductButton");
  saveButton.disabled = true;
  saveButton.textContent = "Enregistrement...";

  try {
    const productId = $("#productId").value;
    const imageFile = $("#productImage").files[0];

    const product = {
      name: $("#productName").value.trim(),
      price: Number($("#productPrice").value),
      category: $("#productCategory").value,
      stock: Number($("#productStock").value),
      description: $("#productDescription").value.trim()
    };

    if (
      !product.name ||
      !Number.isFinite(product.price) ||
      product.price < 0 ||
      !Number.isInteger(product.stock) ||
      product.stock < 0
    ) {
      throw new Error("Vérifie le nom, le prix et le stock.");
    }

    // Envoyer la photo dans Supabase Storage
    if (imageFile) {
      if (!imageFile.type.startsWith("image/")) {
        throw new Error("Choisis un fichier image.");
      }

      if (imageFile.size > 5 * 1024 * 1024) {
        throw new Error("La photo ne doit pas dépasser 5 Mo.");
      }

      const extension =
        imageFile.name.split(".").pop().toLowerCase();

      const filePath =
        Date.now() + "-" + crypto.randomUUID() + "." + extension;

      const { error: uploadError } = await supabaseClient
        .storage
        .from("product-images")
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: imageData } = supabaseClient
        .storage
        .from("product-images")
        .getPublicUrl(filePath);

      product.image_url = imageData.publicUrl;
    }

    // Modifier un produit existant
    if (productId) {
      const { error } = await supabaseClient
        .from("products")
        .update(product)
        .eq("id", productId);

      if (error) throw error;

      toast("Produit modifié avec succès.");
    } else {
      // Ajouter un nouveau produit
      const { error } = await supabaseClient
        .from("products")
        .insert(product);

      if (error) throw error;

      toast("Produit ajouté avec succès.");
    }

    productForm.reset();
    $("#productId").value = "";
    saveButton.textContent = "Ajouter le produit";
    $("#cancelEditButton").hidden = true;

    await loadAdminProducts();
    await loadProducts();

  } catch (error) {
    console.error(error);
    toast(error.message || "Une erreur est survenue.");
  } finally {
    saveButton.disabled = false;

    if (!$("#productId").value) {
      saveButton.textContent = "Ajouter le produit";
    } else {
      saveButton.textContent = "Enregistrer les modifications";
    }
  }
});

// Vérifier la session au chargement du site
async function initializeAdmin() {
  const { data } = await supabaseClient.auth.getSession();
  await checkAdmin(data.session);
}

initializeAdmin();

supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
    checkAdmin(session);
  }
});
