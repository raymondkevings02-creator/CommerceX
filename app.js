// CommerceX — interactions de base du prototype.
// La connexion à Supabase et l'administration seront ajoutées aux prochaines étapes.
const $ = (selector) => document.querySelector(selector);

$("#year").textContent = new Date().getFullYear();

const toast = (message) => {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => element.classList.remove("show"), 2600);
};

$("#menuToggle").addEventListener("click", () => {
  $(".desktop-nav").classList.toggle("open");
});

$(".desktop-nav").querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => $(".desktop-nav").classList.remove("open"));
});

$("#cartButton").addEventListener("click", () => {
  toast("Votre panier sera disponible lors de l'étape 3.");
});

$("#searchToggle").addEventListener("click", () => {
  toast("La recherche sera activée avec le catalogue.");
});

$("#notifyButton").addEventListener("click", () => {
  toast("Le catalogue CommerceX arrive bientôt !");
});
