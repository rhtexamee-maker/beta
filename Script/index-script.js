import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { firebaseConfig } from '../config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const productsMap = new Map();

/* ================= CART ================= */
function getCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI() {
  const countEl = document.getElementById('cart-count');
  if (!countEl) return;

  const total = getCart().reduce((sum, i) => sum + i.qty, 0);
  countEl.textContent = total;
}

function addToCart(id) {
  const product = productsMap.get(id);
  if (!product) return;

  if (product.availability === 'Upcoming') {
    alert('Not available yet');
    return;
  }

  const isOOS = Number(product.stock) <= 0 && product.availability !== 'Pre Order';
  if (isOOS) {
    alert('Out of stock');
    return;
  }

  const cart = getCart();
  const existing = cart.find(i => i.id === id);

  const price = product.discount > 0
    ? product.price - product.discount
    : product.price;

  if (existing) existing.qty++;
  else {
    cart.push({
      id,
      name: product.name,
      price,
      image: product.images?.[0] || '',
      qty: 1
    });
  }

  saveCart(cart);
}

/* ================= HERO ================= */
function renderHero(product) {
  if (!product) return;

  document.getElementById('hero-title').innerHTML =
    `${product.name.split(' ')[0]} <br>
     <span class="text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary-container">
       ${product.name.split(' ').slice(1).join(' ')}
     </span>`;

  document.getElementById('hero-desc').textContent =
    product.description || "Premium mechanical gear engineered for perfection.";

  document.getElementById('hero-image').src =
    product.images?.[0] || '';

  document.getElementById('hero-badge').textContent =
    product.hotDeal ? "HOT DROP" : "New Arrival";

  document.getElementById('hero-shop').onclick = () => {
    window.location.href = `products.html?id=${product.id}`;
  };

  document.getElementById('hero-build').onclick = () => {
    window.location.href = `product.html?id=${product.id}`;
  };
}

/* ================= CATEGORY ================= */
function createCategoryCard(c) {
  const el = document.createElement('div');

  el.className = `
    bg-surface-container rounded-2xl p-8 flex flex-col justify-between
    group overflow-hidden relative min-h-[250px]
    cursor-pointer transition-all hover:scale-[1.02]
  `;

  el.innerHTML = `
    <div class="z-10">
      <h3 class="headline-font text-xl font-bold">${c.name}</h3>
    </div>

    <img src="${c.bg}"
      class="absolute bottom-0 right-0 w-2/3 opacity-30
      group-hover:opacity-60 transition-all duration-500">
  `;

  el.onclick = () =>
    window.location.href = `products.html?category=${encodeURIComponent(c.name)}`;

  return el;
}

/* ================= PRODUCT CARD ================= */
function createProductCard(p) {
  const price = p.discount > 0 ? p.price - p.discount : p.price;
  const isOOS = p.stock <= 0 && p.availability !== 'Pre Order';

  const el = document.createElement('div');

  el.className = `
    bg-surface-container-low rounded-2xl p-6 group
    hover:bg-surface-container transition-all
    border border-outline-variant/10
  `;

  el.innerHTML = `
    <div class="relative overflow-visible mb-8">

      <div class="absolute -inset-4 bg-primary/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <img src="${p.images?.[0] || ''}"
        class="w-full h-48 object-contain transform group-hover:-translate-y-4 group-hover:scale-110 transition-transform duration-500">

    </div>

    <div class="space-y-3">
      <div class="flex justify-between items-start">
        <span class="text-on-surface-variant text-xs uppercase tracking-tighter">${p.category}</span>
        <span class="text-primary font-bold">৳${price}</span>
      </div>

      <h4 class="headline-font text-xl font-bold">${p.name}</h4>

      <button onclick="addToCart('${p.id}')"
        class="w-full bg-surface-variant/40 py-3 rounded-xl font-bold text-sm mt-4 hover:bg-primary hover:text-on-primary transition-colors">
        Quick Add
      </button>
    </div>
  `;

  return el;
}

/* ================= INIT ================= */
async function init() {
  const snap = await getDocs(collection(db, 'products'));

  const products = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  products.forEach(p => productsMap.set(p.id, p));

  /* ===== HERO: latest product ===== */
  const latest = [...products]
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))[0];

  renderHero(latest);

  /* ===== CATEGORIES ===== */
  const categories = [
    { name: 'Keyboards', bg: 'k&b.png' },
    { name: 'Switches', bg: 's.png' },
    { name: 'Keycaps', bg: 'k.png' },
    { name: 'Accessories', bg: 'c&a.png' }
  ];

  const catEl = document.getElementById('categories');
  categories.forEach(c => catEl.appendChild(createCategoryCard(c)));

  /* ===== PRODUCTS ===== */
  const grid = document.getElementById('interest-products');

  products
    .sort(() => Math.random() - 0.5)
    .slice(0, 8)
    .forEach(p => grid.appendChild(createProductCard(p)));

  updateCartUI();
}

document.addEventListener('DOMContentLoaded', init);
window.addToCart = addToCart;
