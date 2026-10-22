document.documentElement.classList.add("js");

// Mobile nav toggle
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");
if (toggle && nav) {
  toggle.addEventListener("click", () => nav.classList.toggle("open"));
}

// Highlight the current page in the nav
const current = location.pathname.split("/").pop() || "index.html";
document.querySelectorAll(".nav a").forEach((a) => {
  if (a.getAttribute("href") === current) a.classList.add("active");
});

// Footer year
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

// Homepage banner slider
const banner = document.querySelector(".banner");
if (banner) {
  const slides = banner.querySelectorAll(".slide");
  const dotsWrap = banner.querySelector(".banner-dots");
  let index = 0;
  let timer;

  const dots = [...slides].map((_, i) => {
    const dot = document.createElement("button");
    dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
    dot.addEventListener("click", () => { show(i); restart(); });
    dotsWrap.appendChild(dot);
    return dot;
  });

  function show(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, n) => s.classList.toggle("active", n === index));
    dots.forEach((d, n) => d.classList.toggle("active", n === index));
  }

  function restart() {
    clearInterval(timer);
    timer = setInterval(() => show(index + 1), 5000);
  }

  banner.querySelector(".prev").addEventListener("click", () => { show(index - 1); restart(); });
  banner.querySelector(".next").addEventListener("click", () => { show(index + 1); restart(); });
  banner.addEventListener("mouseenter", () => clearInterval(timer));
  banner.addEventListener("mouseleave", restart);

  show(0);
  restart();
}

// Product category filter + text search (they combine)
const filterBtns = document.querySelectorAll(".filter-btn");
const searchInput = document.getElementById("product-search");
const resultCount = document.getElementById("result-count");
const noResults = document.getElementById("no-results");
let activeCat = "all";

function applyProductFilters() {
  const q = searchInput ? searchInput.value.trim().toLowerCase() : "";
  let shown = 0;
  document.querySelectorAll("[data-category]").forEach((card) => {
    const matchCat = activeCat === "all" || card.dataset.category === activeCat;
    const matchText = !q || card.textContent.toLowerCase().includes(q);
    const show = matchCat && matchText;
    card.style.display = show ? "" : "none";
    if (show) shown++;
  });
  if (resultCount) resultCount.textContent = `Showing ${shown} product${shown === 1 ? "" : "s"}`;
  if (noResults) noResults.hidden = shown > 0;
}

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeCat = btn.dataset.filter;
    applyProductFilters();
  });
});
if (searchInput) searchInput.addEventListener("input", applyProductFilters);
if (filterBtns.length) applyProductFilters();

// Apply category filter from ?cat=... (homepage category tiles link here)
const presetCat = new URLSearchParams(location.search).get("cat");
if (presetCat) {
  const catBtn = document.querySelector(`.filter-btn[data-filter="${presetCat}"]`);
  if (catBtn) catBtn.click();
}

// Fade sections in as they scroll into view; siblings in a grid come in one after another
const reveals = document.querySelectorAll(".reveal, .reveal-line");
reveals.forEach((el) => {
  const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
  const i = siblings.indexOf(el);
  if (siblings.length > 1 && i > 0) {
    el.style.transitionDelay = `${(i % 6) * 90}ms`;
    // drop the delay afterwards so hover effects stay snappy
    el.addEventListener("transitionend", () => { el.style.transitionDelay = ""; }, { once: true });
  }
});
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("visible"));
}

// Header shadow once the page is scrolled
const header = document.querySelector(".site-header");
if (header) {
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 10);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

// Rotate the highlighted word in the banner heading
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
document.querySelectorAll(".rotator[data-words]").forEach((el) => {
  const words = el.dataset.words.split("|");
  if (reduceMotion || words.length < 2) return;
  let w = 0;
  setInterval(() => {
    el.classList.add("out");
    setTimeout(() => {
      w = (w + 1) % words.length;
      el.textContent = words[w];
      el.classList.remove("out");
    }, 350);
  }, 2600);
});

// Pre-select product on the quote form from ?product=...
const productSelect = document.getElementById("product");
const preset = new URLSearchParams(location.search).get("product");
if (productSelect && preset) productSelect.value = preset;

// Quote form: GitHub Pages has no backend, so the request is sent as a pre-filled WhatsApp message
const WHATSAPP_NUMBER = "923017090822";
document.querySelectorAll("form[data-whatsapp]").forEach((form) => {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const select = form.querySelector("#product");
    const fields = [
      ["Name", data.get("name")],
      ["Company", data.get("company")],
      ["Email", data.get("email")],
      ["Phone", data.get("phone")],
      ["Product", select && select.value ? select.options[select.selectedIndex].text : ""],
      ["Quantity", data.get("quantity")],
      ["Dimensions", data.get("dimensions")],
      ["Details", data.get("message")],
    ];
    const lines = ["*New quote request (website)*"];
    fields.forEach(([label, value]) => {
      if (value && String(value).trim()) lines.push(`*${label}:* ${String(value).trim()}`);
    });
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener,noreferrer");
    const msg = form.querySelector(".form-msg");
    if (msg) msg.classList.add("show");
  });
});

// ---------- Cart (stored in this browser only; orders are sent on WhatsApp) ----------
const CART_KEY = "packcraft-cart";

function readCart() {
  try {
    const items = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    // only keep well-formed entries, in case storage was edited by hand
    return Array.isArray(items)
      ? items.filter((it) => it && typeof it.slug === "string" && typeof it.name === "string" && Number.isInteger(it.qty) && it.qty > 0)
      : [];
  } catch (err) {
    return [];
  }
}

function writeCart(items) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (err) { /* storage unavailable */ }
  updateCartCount();
}

function updateCartCount(bump) {
  const count = readCart().length;
  document.querySelectorAll(".cart-count").forEach((el) => {
    el.textContent = count;
    el.hidden = count === 0;
    if (bump) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
  });
}

function parseQty(input) {
  const n = Number(input.value);
  return Number.isInteger(n) && n > 0 && n <= 1000000 ? n : 0;
}

let toastTimer;
function showToast(text) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    const span = document.createElement("span");
    const link = document.createElement("a");
    link.href = "cart.html";
    link.textContent = "View cart →";
    toast.append(span, link);
    document.body.appendChild(toast);
  }
  toast.querySelector("span").textContent = text;
  requestAnimationFrame(() => toast.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

// "Add to Cart" buttons on product cards
document.querySelectorAll(".add-to-cart").forEach((btn) => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".product-card");
    const input = card.querySelector(".qty-input");
    const qty = parseQty(input);
    if (!qty) {
      input.classList.remove("invalid"); void input.offsetWidth; input.classList.add("invalid");
      input.focus();
      return;
    }
    input.classList.remove("invalid");
    const slug = btn.dataset.slug;
    const name = card.querySelector("h3").textContent.trim();
    const image = card.querySelector(".thumb img").getAttribute("src");
    const items = readCart();
    const existing = items.find((it) => it.slug === slug);
    if (existing) existing.qty += qty; else items.push({ slug, name, image, qty });
    writeCart(items);
    updateCartCount(true);
    input.value = "";
    showToast(`Added ${qty} × ${name}`);
  });
});

// Cart page
const cartList = document.getElementById("cart-list");
if (cartList) {
  const layout = document.getElementById("cart-layout");
  const empty = document.getElementById("cart-empty");
  const done = document.getElementById("order-done");

  const renderCart = () => {
    const items = readCart();
    cartList.textContent = "";
    items.forEach((it, index) => {
      const li = document.createElement("li");
      li.className = "cart-item";

      const img = document.createElement("img");
      img.src = typeof it.image === "string" && it.image.startsWith("images/") ? it.image : "favicon.svg";
      img.alt = "";

      const info = document.createElement("div");
      const h3 = document.createElement("h3");
      h3.textContent = it.name;
      const small = document.createElement("small");
      small.textContent = "Price confirmed on WhatsApp";
      info.append(h3, small);

      const qty = document.createElement("input");
      qty.type = "number"; qty.min = "1"; qty.className = "qty-input";
      qty.value = it.qty;
      qty.setAttribute("aria-label", `Quantity for ${it.name}`);
      qty.addEventListener("change", () => {
        const n = parseQty(qty);
        const current = readCart();
        if (!current[index]) return;
        if (n) { current[index].qty = n; writeCart(current); qty.classList.remove("invalid"); }
        else { qty.value = current[index].qty; }
      });

      const remove = document.createElement("button");
      remove.type = "button"; remove.className = "remove-btn";
      remove.setAttribute("aria-label", `Remove ${it.name}`);
      remove.innerHTML = '<svg class="i"><use href="#i-trash"/></svg>';
      remove.addEventListener("click", () => {
        const current = readCart();
        current.splice(index, 1);
        writeCart(current);
        renderCart();
      });

      li.append(img, info, qty, remove);
      cartList.appendChild(li);
    });
    const hasItems = items.length > 0;
    layout.hidden = !hasItems;
    empty.hidden = hasItems || !done.hidden;
  };
  renderCart();

  const form = document.getElementById("checkout-form");
  const error = document.getElementById("checkout-error");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const items = readCart();
    const data = new FormData(form);
    const val = (k) => String(data.get(k) || "").trim();
    const missing = [];
    if (!val("name")) missing.push("name");
    if (!val("phone")) missing.push("phone");
    if (!val("city")) missing.push("city");
    if (!val("payment")) missing.push("payment method");
    if (!items.length) missing.push("at least one product");
    if (missing.length) {
      error.textContent = `Please add your ${missing.join(", ")}.`;
      error.hidden = false;
      return;
    }
    error.hidden = true;

    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const orderId = `PC-${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${Math.floor(Math.random() * 90 + 10)}`;

    const lines = [`*New order ${orderId}* (website)`, "", "*Items:*"];
    items.forEach((it, i) => lines.push(`${i + 1}. ${it.name} × ${it.qty}`));
    lines.push("");
    [["Name", "name"], ["Phone", "phone"], ["City", "city"], ["Business", "business"], ["Address", "address"], ["Payment", "payment"], ["Notes", "notes"]]
      .forEach(([label, key]) => { if (val(key)) lines.push(`*${label}:* ${val(key)}`); });
    lines.push("", "Please confirm the price and payment details.");

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener,noreferrer");

    document.getElementById("order-id").textContent = orderId;
    document.getElementById("order-resend").href = url;
    writeCart([]);
    form.reset();
    layout.hidden = true;
    empty.hidden = true;
    done.hidden = false;
    done.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

updateCartCount();
