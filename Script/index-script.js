import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
  getFirestore,
  collection,
  getDocs
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

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
  const total = getCart().reduce((sum, i) => sum + i.qty, 0);
  document.getElementById('cart-count').textContent = total;
}

function addToCart(id) {
  const product = productsMap.get(id);
  if (!product) return;

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

  const words = product.name.split(' ');

  document.getElementById('hero-title').innerHTML = `
    ${words[0]}
    <br>
    <span class="text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary-container">
      ${words.slice(1).join(' ')}
    </span>
  `;

  document.getElementById('hero-desc').textContent =
    product.description || '';

  document.getElementById('hero-image').src =
    product.images?.[0] || '';

  document.getElementById('hero-shop').onclick =
    () => location.href = `product.html?id=${product.id}`;

  document.getElementById('hero-build').onclick =
    () => location.href = `product.html?id=${product.id}`;
}

/* ================= CATEGORIES ================= */
function renderCategories() {
  const el = document.getElementById('categories');

  el.innerHTML = `
    <div class="md:col-span-2 md:row-span-2 bg-surface-container-low rounded-2xl p-10 relative cursor-pointer"
      onclick="location.href='products.html?category=Keyboards'">
      <h3 class="headline-font text-3xl font-bold mb-4">Keyboards</h3>
    </div>

    <div class="bg-surface-container rounded-2xl p-8 cursor-pointer"
      onclick="location.href='products.html?category=Switches'">
      <h3 class="headline-font text-xl font-bold">Switches</h3>
    </div>

    <div class="bg-surface-container rounded-2xl p-8 cursor-pointer"
      onclick="location.href='products.html?category=Keycaps'">
      <h3 class="headline-font text-xl font-bold">Keycaps</h3>
    </div>

    <div class="md:col-span-2 bg-surface-container rounded-2xl p-8 cursor-pointer"
      onclick="location.href='products.html?category=Accessories'">
      <h3 class="headline-font text-2xl font-bold">Accessories</h3>
    </div>
  `;
}

/* ================= PRODUCT CARD ================= */
function createProductCard(p) {
  const price = p.discount > 0 ? p.price - p.discount : p.price;

  const el = document.createElement('div');

  el.className = `
    bg-surface-container-low rounded-2xl p-6 group
    hover:bg-surface-container transition-all
    border border-outline-variant/10
  `;

  el.innerHTML = `
    <img src="${p.images?.[0] || ''}"
      class="w-full h-48 object-contain mb-6">

    <div class="flex justify-between text-xs uppercase">
      <span>${p.category}</span>
      <span class="text-primary font-bold">৳${price}</span>
    </div>

    <h4 class="headline-font text-xl font-bold mt-2">${p.name}</h4>

    <button onclick="addToCart('${p.id}')"
      class="w-full mt-4 bg-surface-variant/40 py-3 rounded-xl font-bold hover:bg-primary hover:text-on-primary">
      Quick Add
    </button>
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

  const latest = [...products].sort(
    (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
  )[0];

  renderHero(latest);
  renderCategories();

  const grid = document.getElementById('interest-products');

  products
    .sort(() => Math.random() - 0.5)
    .slice(0, 8)
    .forEach(p => grid.appendChild(createProductCard(p)));

  updateCartUI();
}

document.addEventListener('DOMContentLoaded', init);
window.addToCart = addToCart;
