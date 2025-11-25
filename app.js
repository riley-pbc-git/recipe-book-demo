// ---- State ----
let allRecipes = [];
let currentCategory = null;
let currentRecipeIndex = 0;
let isTypedView = false;
let favorites = new Set();

const FAVORITES_KEY = "nana-recipes-favorites";
const THEME_KEY = "nana-recipes-theme";

// ---- DOM ----
const body = document.body;

const categoryView = document.getElementById("categoryView");
const recipeListView = document.getElementById("recipeListView");
const recipeDetailView = document.getElementById("recipeDetailView");

const backButton = document.getElementById("backButton");
const themeToggle = document.getElementById("themeToggle");

const recipeListTitle = document.getElementById("recipeListTitle");
const recipeListEl = document.getElementById("recipeList");

const togglePhotoTypedBtn = document.getElementById("togglePhotoTyped");
const favoriteButton = document.getElementById("favoriteButton");

const textSizeSlider = document.getElementById("textSizeSlider");

const recipeTitleEl = document.getElementById("recipeTitle");
const typedTitleEl = document.getElementById("typedTitle");
const typedIngredientsEl = document.getElementById("typedIngredients");
const typedStepsEl = document.getElementById("typedSteps");

const recipePhotoView = document.getElementById("recipePhotoView");
const recipeTypedView = document.getElementById("recipeTypedView");
const recipePhotoEl = document.getElementById("recipePhoto");

const prevRecipeBtn = document.getElementById("prevRecipe");
const nextRecipeBtn = document.getElementById("nextRecipe");

// ---- Load theme and favorites ----
function loadFavorites() {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      JSON.parse(stored).forEach((id) => favorites.add(id));
    }
  } catch (e) {
    console.warn("Could not load favorites", e);
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  } catch (e) {
    console.warn("Could not save favorites", e);
  }
}

function loadTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "dark") {
    body.classList.add("dark-theme");
    themeToggle.textContent = "☀️";
  } else {
    body.classList.remove("dark-theme");
    themeToggle.textContent = "🌙";
  }
}

function toggleTheme() {
  const isDark = body.classList.toggle("dark-theme");
  themeToggle.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
}

// ---- Fetch recipes ----
async function loadRecipes() {
  try {
    const res = await fetch("recipes.json");
    if (!res.ok) throw new Error("Failed to load recipes.json");
    const data = await res.json();
    allRecipes = data;
  } catch (e) {
    console.error("Could not load recipes.json", e);
    allRecipes = [];
  }
}

// ---- View helpers ----
function showCategoryView() {
  categoryView.classList.remove("hidden");
  recipeListView.classList.add("hidden");
  recipeDetailView.classList.add("hidden");
  backButton.classList.add("hidden");
}

function showRecipeListView() {
  categoryView.classList.add("hidden");
  recipeListView.classList.remove("hidden");
  recipeDetailView.classList.add("hidden");
  backButton.classList.remove("hidden");
}

function showRecipeDetailView() {
  categoryView.classList.add("hidden");
  recipeListView.classList.add("hidden");
  recipeDetailView.classList.remove("hidden");
  backButton.classList.remove("hidden");
}

// ---- Rendering ----
function getRecipesForCategory(category) {
  if (category === "Favorites") {
    return allRecipes.filter((r) => favorites.has(r.id));
  }
  return allRecipes.filter((r) => r.category === category);
}

function renderRecipeList(category) {
  currentCategory = category;
  const recipes = getRecipesForCategory(category);

  recipeListTitle.textContent = category;
  recipeListEl.innerHTML = "";

  if (recipes.length === 0) {
    const msg = document.createElement("p");
    msg.textContent =
      category === "Favorites"
        ? "No favorite recipes yet."
        : "No recipes in this category yet.";
    recipeListEl.appendChild(msg);
    return;
  }

  recipes.forEach((recipe, index) => {
    const card = document.createElement("button");
    card.className = "recipe-card";
    card.type = "button";

    const thumb = document.createElement("img");
    thumb.className = "recipe-thumb";
    thumb.src = recipe.photo;
    thumb.alt = `${recipe.title} card`;

    const main = document.createElement("div");
    main.className = "recipe-card-main";

    const title = document.createElement("div");
    title.className = "recipe-card-title";
    title.textContent = recipe.title;

    const meta = document.createElement("div");
    meta.className = "recipe-card-meta";
    if (favorites.has(recipe.id)) {
      meta.textContent = "★ Favorite";
    } else {
      meta.textContent = recipe.category;
    }

    main.appendChild(title);
    main.appendChild(meta);

    card.appendChild(thumb);
    card.appendChild(main);

    card.addEventListener("click", () => {
      // Map index back to global list index
      const globalIndex = allRecipes.findIndex((r) => r.id === recipe.id);
      currentRecipeIndex = globalIndex;
      openRecipeDetail(globalIndex);
    });

    recipeListEl.appendChild(card);
  });
}

function openRecipeDetail(index) {
  const recipe = allRecipes[index];
  if (!recipe) return;

  recipeTitleEl.textContent = recipe.title;
  typedTitleEl.textContent = recipe.title;

  // Photo
  recipePhotoEl.src = recipe.photo;

  // Typed ingredients
  typedIngredientsEl.innerHTML = "";
  recipe.typed.ingredients.forEach((ing) => {
    const li = document.createElement("li");
    li.textContent = ing;
    typedIngredientsEl.appendChild(li);
  });

  // Typed steps
  typedStepsEl.innerHTML = "";
  recipe.typed.steps.forEach((step) => {
    const li = document.createElement("li");
    li.textContent = step;
    typedStepsEl.appendChild(li);
  });

  // Favorite state
  if (favorites.has(recipe.id)) {
    favoriteButton.classList.add("favorited");
    favoriteButton.textContent = "★";
  } else {
    favoriteButton.classList.remove("favorited");
    favoriteButton.textContent = "☆";
  }

  // Default to photo view
  isTypedView = false;
  updateViewModeButton();
  updateRecipeViewMode();

  showRecipeDetailView();
}

function updateViewModeButton() {
  togglePhotoTypedBtn.textContent = isTypedView ? "Photo View" : "Typed View";
}

function updateRecipeViewMode() {
  if (isTypedView) {
    recipePhotoView.classList.add("hidden");
    recipeTypedView.classList.remove("hidden");
  } else {
    recipePhotoView.classList.remove("hidden");
    recipeTypedView.classList.add("hidden");
  }
}

// ---- Navigation ----
function goToPrevRecipe() {
  if (!allRecipes.length) return;
  currentRecipeIndex =
    (currentRecipeIndex - 1 + allRecipes.length) % allRecipes.length;
  openRecipeDetail(currentRecipeIndex);
}

function goToNextRecipe() {
  if (!allRecipes.length) return;
  currentRecipeIndex = (currentRecipeIndex + 1) % allRecipes.length;
  openRecipeDetail(currentRecipeIndex);
}

// ---- Event listeners ----
document.addEventListener("DOMContentLoaded", async () => {
  loadFavorites();
  loadTheme();
  await loadRecipes();

  // Category tiles
  document.querySelectorAll(".category-tile").forEach((btn) => {
    btn.addEventListener("click", () => {
      const category = btn.dataset.category;
      renderRecipeList(category);
      showRecipeListView();
    });
  });

  // Back
  backButton.classList.add("hidden");
  backButton.addEventListener("click", () => {
    if (!recipeDetailView.classList.contains("hidden")) {
      // from detail -> list
      showRecipeListView();
    } else if (!recipeListView.classList.contains("hidden")) {
      // from list -> categories
      showCategoryView();
    }
  });

  // Theme toggle
  themeToggle.addEventListener("click", toggleTheme);

  // Toggle typed/photo
  togglePhotoTypedBtn.addEventListener("click", () => {
    isTypedView = !isTypedView;
    updateViewModeButton();
    updateRecipeViewMode();
  });

  // Text size slider -> CSS custom property
  textSizeSlider.addEventListener("input", (e) => {
    const value = Number(e.target.value) / 100;
    document.documentElement.style.setProperty("--font-scale", value.toString());
  });

  // Favorite toggle
  favoriteButton.addEventListener("click", () => {
    const recipe = allRecipes[currentRecipeIndex];
    if (!recipe) return;

    if (favorites.has(recipe.id)) {
      favorites.delete(recipe.id);
    } else {
      favorites.add(recipe.id);
    }
    saveFavorites();
    openRecipeDetail(currentRecipeIndex); // re-render icons
  });

  // Prev / Next
  prevRecipeBtn.addEventListener("click", goToPrevRecipe);
  nextRecipeBtn.addEventListener("click", goToNextRecipe);

  // Start at category view
  showCategoryView();
});
