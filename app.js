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
