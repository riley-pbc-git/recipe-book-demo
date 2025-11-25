// ---- State ----
let allRecipes = [];
let currentCategory = null;
let currentRecipeIndex = 0;
let isTypedView = false;
let ingredientMultiplier = 1;
let favorites = new Set();
let activeTab = "recipes";
let clockIntervalId = null;
let activeClockDesign = "retro-flip";
let standbyMode = "clock";
let standbyTime = "10";
let lastHourDigits = null;
let lastMinuteDigits = null;

const FAVORITES_KEY = "nana-recipes-favorites";
const THEME_KEY = "nana-recipes-theme";

// ---- DOM ----
const body = document.body;

const categoryView = document.getElementById("categoryView");
const categoryResults = document.getElementById("categoryResults");
const recipeDetailView = document.getElementById("recipeDetailView");

const backButton = document.getElementById("backButton");
const themeToggle = document.getElementById("themeToggle");

const tabButtons = document.querySelectorAll(".tab-button");
const tabPanels = {
  recipes: document.getElementById("recipesTab"),
  clock: document.getElementById("clockTab"),
  collage: document.getElementById("collageTab"),
  standby: document.getElementById("standbyTab"),
};

const clockDisplay = document.getElementById("clockDisplay");
const clockTimeEl = document.getElementById("clockTime");
const clockDateEl = document.getElementById("clockDate");
const flipHourTop = document.getElementById("flipHourTop");
const flipHourBottom = document.getElementById("flipHourBottom");
const flipMinuteTop = document.getElementById("flipMinuteTop");
const flipMinuteBottom = document.getElementById("flipMinuteBottom");
const flipHourAnimTop = document.getElementById("flipHourAnimTop");
const flipHourAnimBottom = document.getElementById("flipHourAnimBottom");
const flipMinuteAnimTop = document.getElementById("flipMinuteAnimTop");
const flipMinuteAnimBottom = document.getElementById("flipMinuteAnimBottom");
const hourPanel = document.querySelector(".flip-panel--hours");
const minutePanel = document.querySelector(".flip-panel--minutes");
const midHourHand = document.getElementById("midHourHand");
const midMinuteHand = document.getElementById("midMinuteHand");
const midSecondHand = document.getElementById("midSecondHand");
const decoHourHand = document.getElementById("decoHourHand");
const decoMinuteHand = document.getElementById("decoMinuteHand");
const decoSecondHand = document.getElementById("decoSecondHand");
const clockDesignLabel = document.getElementById("clockDesignLabel");

const standbySummaryEl = document.getElementById("standbySummary");
const standbyModeRadios = document.querySelectorAll("input[name='standby-mode']");
const clockDesignRadios = document.querySelectorAll("input[name='clock-design']");
const standbyTimeRadios = document.querySelectorAll("input[name='standby-time']");

const recipeListTitle = document.getElementById("recipeListTitle");
const recipeListEl = document.getElementById("recipeList");

const togglePhotoTypedBtn = document.getElementById("togglePhotoTyped");
const favoriteButton = document.getElementById("favoriteButton");

const textSizeSlider = document.getElementById("textSizeSlider");
const ingredientMultiplierSelect = document.getElementById("ingredientMultiplier");

const recipeTitleEl = document.getElementById("recipeTitle");
const typedTitleEl = document.getElementById("typedTitle");
const typedSubtitleEl = document.getElementById("typedSubtitle");
const typedIngredientsEl = document.getElementById("typedIngredients");
const typedNotesEl = document.getElementById("typedNotes");
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
  recipeDetailView.classList.add("hidden");
  backButton.classList.add("hidden");
}

function showRecipeDetailView() {
  categoryView.classList.add("hidden");
  recipeDetailView.classList.remove("hidden");
  backButton.classList.remove("hidden");
}

function setActiveTab(tab) {
  activeTab = tab;

  tabButtons.forEach((btn) => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  Object.entries(tabPanels).forEach(([key, panel]) => {
    if (!panel) return;
    panel.classList.toggle("hidden", key !== tab);
  });

  if (tab === "recipes") {
    showCategoryView();
  } else {
    backButton.classList.add("hidden");
  }

  if (tab === "clock") {
    startClock();
  }
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
  categoryResults.classList.remove("hidden");

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

function parseQuantity(amount) {
  const match = amount.trim().match(/^([\d\.\s\/]+)(.*)$/);
  if (!match) return null;

  const quantityPart = match[1].trim();
  if (!quantityPart) return null;

  const tokens = quantityPart.split(/\s+/).filter(Boolean);
  let total = 0;
  let parsedAny = false;

  for (const token of tokens) {
    const fractionMatch = token.match(/^(\d+)\/(\d+)$/);
    if (fractionMatch) {
      const numerator = Number(fractionMatch[1]);
      const denominator = Number(fractionMatch[2]);
      if (denominator === 0) return null;
      total += numerator / denominator;
      parsedAny = true;
      continue;
    }

    const value = Number(token);
    if (Number.isNaN(value)) return null;
    total += value;
    parsedAny = true;
  }

  if (!parsedAny) return null;

  return { quantity: total, unit: match[2].trim() };
}

function formatQuantity(value) {
  const rounded = Math.round(value * 100) / 100;
  return rounded
    .toFixed(2)
    .replace(/\.0+$/, "")
    .replace(/\.([1-9]*)0+$/, ".$1");
}

function getScaledAmount(amount) {
  const parsed = parseQuantity(amount);
  if (!parsed) return amount;

  const scaled = parsed.quantity * ingredientMultiplier;
  const formatted = formatQuantity(scaled);
  return parsed.unit ? `${formatted} ${parsed.unit}` : formatted;
}

function renderTypedIngredients(recipe) {
  typedIngredientsEl.innerHTML = "";
  recipe.typed.ingredients.forEach((ing) => {
    const row = document.createElement("div");
    row.className = "handwritten-ingredient";

    const item = document.createElement("span");
    item.className = "handwritten-item";
    item.textContent = ing.item;

    const amount = document.createElement("span");
    amount.className = "handwritten-amount";
    amount.textContent = getScaledAmount(ing.amount);

    row.appendChild(item);
    row.appendChild(amount);

    typedIngredientsEl.appendChild(row);

    if (ing.note) {
      const note = document.createElement("div");
      note.className = "handwritten-note";
      note.textContent = `(${ing.note})`;
      typedIngredientsEl.appendChild(note);
    }
  });
}

function openRecipeDetail(index) {
  const recipe = allRecipes[index];
  if (!recipe) return;

  recipeTitleEl.textContent = recipe.title;
  typedTitleEl.textContent = recipe.title;
  typedSubtitleEl.textContent = recipe.typed.subtitle || "";

  // Photo
  recipePhotoEl.src = recipe.photo;

  // Typed ingredients
  ingredientMultiplier = 1;
  ingredientMultiplierSelect.value = "1";
  renderTypedIngredients(recipe);

  // Typed notes
  typedNotesEl.innerHTML = "";
  (recipe.typed.notes || []).forEach((note) => {
    const line = document.createElement("div");
    line.className = "handwritten-note";
    line.textContent = `(${note})`;
    typedNotesEl.appendChild(line);
  });

  // Typed steps
  typedStepsEl.innerHTML = "";
  recipe.typed.steps.forEach((step) => {
    const line = document.createElement("div");
    line.className = "handwritten-step";
    line.textContent = step;
    typedStepsEl.appendChild(line);
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

// ---- Clock helpers ----
function animateFlipPanel(
  panel,
  topEl,
  bottomEl,
  animTopEl,
  animBottomEl,
  newValue,
  lastValue
) {
  if (!panel || !topEl || !bottomEl || !animTopEl || !animBottomEl) {
    return newValue;
  }

  const previousValue = panel.dataset.value || newValue;

  if (lastValue === null || previousValue === newValue) {
    panel.dataset.value = newValue;
    topEl.textContent = newValue;
    bottomEl.textContent = newValue;
    animTopEl.textContent = newValue;
    animBottomEl.textContent = newValue;
    return newValue;
  }

  animTopEl.textContent = previousValue;
  animBottomEl.textContent = newValue;
  topEl.textContent = previousValue;
  bottomEl.textContent = previousValue;

  panel.classList.remove("is-flipping");
  // force reflow to restart animation
  void panel.offsetWidth;
  panel.classList.add("is-flipping");

  panel.addEventListener(
    "animationend",
    () => {
      panel.classList.remove("is-flipping");
      topEl.textContent = newValue;
      bottomEl.textContent = newValue;
      animTopEl.textContent = newValue;
      animBottomEl.textContent = newValue;
    },
    { once: true }
  );

  panel.dataset.value = newValue;
  return newValue;
}

function updateClock() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds();
  const hours12 = hours % 12 || 12;
  const suffix = hours >= 12 ? "PM" : "AM";

  const hourDigits = hours12.toString().padStart(2, "0");
  const minuteDigits = minutes;

  clockTimeEl.textContent = `${hourDigits}:${minuteDigits} ${suffix}`;
  clockDateEl.textContent = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(now);

  lastHourDigits = animateFlipPanel(
    hourPanel,
    flipHourTop,
    flipHourBottom,
    flipHourAnimTop,
    flipHourAnimBottom,
    hourDigits,
    lastHourDigits
  );

  lastMinuteDigits = animateFlipPanel(
    minutePanel,
    flipMinuteTop,
    flipMinuteBottom,
    flipMinuteAnimTop,
    flipMinuteAnimBottom,
    minuteDigits,
    lastMinuteDigits
  );

  const hourAngle = (hours % 12) * 30 + (now.getMinutes() / 60) * 30;
  const minuteAngle = now.getMinutes() * 6 + seconds * 0.1;
  const secondAngle = seconds * 6;

  if (midHourHand) {
    midHourHand.style.transform = `translate(-50%, -100%) rotate(${hourAngle}deg)`;
  }
  if (midMinuteHand) {
    midMinuteHand.style.transform = `translate(-50%, -100%) rotate(${minuteAngle}deg)`;
  }
  if (midSecondHand) {
    midSecondHand.style.transform = `translate(-50%, -100%) rotate(${secondAngle}deg)`;
  }

  if (decoHourHand) {
    decoHourHand.style.transform = `translate(-50%, -100%) rotate(${hourAngle}deg)`;
  }
  if (decoMinuteHand) {
    decoMinuteHand.style.transform = `translate(-50%, -100%) rotate(${minuteAngle}deg)`;
  }
  if (decoSecondHand) {
    decoSecondHand.style.transform = `translate(-50%, -100%) rotate(${secondAngle}deg)`;
  }
}

function startClock() {
  lastHourDigits = null;
  lastMinuteDigits = null;
  updateClock();
  if (clockIntervalId) {
    clearInterval(clockIntervalId);
  }
  clockIntervalId = setInterval(updateClock, 1000);
}

function applyClockDesign(design) {
  if (!clockDisplay) return;
  clockDisplay.classList.remove(
    "clock--retro-flip",
    "clock--mid-century",
    "clock--art-deco"
  );
  clockDisplay.classList.add(`clock--${design}`);
  if (clockDesignLabel) {
    clockDesignLabel.textContent = describeDesign(design);
  }
}

function describeDesign(design) {
  switch (design) {
    case "mid-century":
      return "Mid-Century";
    case "art-deco":
      return "Art Deco";
    default:
      return "Retro Flip";
  }
}

function describeTime(time) {
  switch (time) {
    case "5":
      return "5 minutes";
    case "30":
      return "30 minutes";
    case "60":
      return "1 hour";
    default:
      return "10 minutes";
  }
}

function updateStandbySummary() {
  if (!standbySummaryEl) return;
  const modeLabel = standbyMode === "clock" ? "Clock" : "Collage";
  const designLabel = describeDesign(activeClockDesign);
  const timeLabel = describeTime(standbyTime);
  standbySummaryEl.textContent = `Standby: ${modeLabel} · Clock: ${designLabel} · Delay: ${timeLabel}`;
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

  // Tabs
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      setActiveTab(tab);
    });
  });

  // Clock + Standby controls
  clockDesignRadios.forEach((input) => {
    input.addEventListener("change", (e) => {
      activeClockDesign = e.target.value;
      applyClockDesign(activeClockDesign);
      updateStandbySummary();
    });
  });

  standbyModeRadios.forEach((input) => {
    input.addEventListener("change", (e) => {
      standbyMode = e.target.value;
      updateStandbySummary();
    });
  });

  standbyTimeRadios.forEach((input) => {
    input.addEventListener("change", (e) => {
      standbyTime = e.target.value;
      updateStandbySummary();
    });
  });

  applyClockDesign(activeClockDesign);
  updateStandbySummary();
  startClock();

  // Category tiles
  document.querySelectorAll(".category-tile").forEach((btn) => {
    btn.addEventListener("click", () => {
      const category = btn.dataset.category;
      renderRecipeList(category);
      categoryResults.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // Back
  backButton.classList.add("hidden");
  backButton.addEventListener("click", () => {
    if (!recipeDetailView.classList.contains("hidden")) {
      showCategoryView();
      categoryView.scrollIntoView({ behavior: "smooth", block: "start" });
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

  // Ingredient multiplier
  ingredientMultiplierSelect.addEventListener("change", (e) => {
    const value = parseFloat(e.target.value);
    ingredientMultiplier = Number.isFinite(value) ? value : 1;
    ingredientMultiplierSelect.value = ingredientMultiplier.toString();

    const recipe = allRecipes[currentRecipeIndex];
    if (recipe) {
      renderTypedIngredients(recipe);
    }
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
  setActiveTab("recipes");
});
