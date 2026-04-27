// Script/index-script.js
// Full cart system + homepage rendering for the new Tailwind design

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

import { firebaseConfig, BKASH_NUMBER, COD_NUMBER, DELIVERY_FEE } from '../config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const productsMap = new Map();

// ==================== CART SYSTEM ====================
function getCart() {
  const cart = localStorage.getItem('cart');
  return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
}

function addToCart(productId, qty = 1) {
  const product = productsMap.get(productId);
  if (!product || product.availability === 'Upcoming') {
    alert("This product is not available yet.");
    return;
  }

  const isOOS = Number(product.stock) <= 0 && product.availability !== 'Pre Order';
  if (isOOS) {
    alert('This product is out of stock!');
    return;
  }

  let cart = getCart();
  const existing = cart.find(item => item.id === productId);
  const finalPrice = Number(product.discount) > 0 
    ? (Number(product.price) - Number(product.discount)) 
    : Number(product.price);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: productId,
      name: product.name,
      color: product.color || '',
      price: finalPrice,
      image: product.images?.[0] || '',
      qty: qty
    });
  }
  saveCart(cart);
  alert(`${product.name} added to cart!`);
}

function updateCartUI() {
  const cart = getCart();
  const countEl = document.getElementById('cart-count');
  if (countEl) countEl.textContent = cart.reduce((sum, i) => sum + i.qty, 0);
}

// ==================== TAILWIND CARDS ====================
function createCategoryCard(c) {
  const card = document.createElement('div');
  card.className = `bg-surface-container rounded-2xl p-8 flex flex-col justify-between group overflow-hidden relative min-h-[250px] cursor-pointer hover:scale-[1.02] transition-transform`;
  card.innerHTML = `
    <div class="z-10">
      <h3 class="headline-font text-2xl font-bold text-on-surface">${c.name}</h3>
    </div>
    <img src="${c.bg}" class="absolute bottom-0 right-0 w-3/4 opacity-30 group-hover:opacity-70 transition-all duration-700" alt="${c.name}">
  `;
  card.addEventListener('click', () => {
    window.location.href = `products.html?category=${encodeURIComponent(c.name)}`;
  });
  return card;
}

function createProductCard(p) {
  const hasDiscount = Number(p.discount) > 0;
  const finalPrice = hasDiscount ? Number(p.price) - Number(p.discount) : Number(p.price);
  const isOOS = Number(p.stock) <= 0 && p.availability !== 'Pre Order';

  const card = document.createElement('div');
  card.className = `bg-surface-container-low rounded-2xl p-6 group hover:bg-surface-container transition-all border border-outline-variant/10 cursor-pointer`;

  card.innerHTML = `
    <div class="relative mb-6 overflow-hidden rounded-xl">
      <img src="${p.images?.[0] || ''}" alt="${p.name}" 
           class="w-full h-52 object-contain transition-transform group-hover:scale-105 duration-500"
           onerror="this.src='https://via.placeholder.com/400x300/1f2937/9ca3af?text=No+Image'">
      ${p.hotDeal ? `<span class="absolute top-3 left-3 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold">HOT DEAL</span>` : ''}
      ${isOOS ? `<span class="absolute top-3 right-3 bg-gray-700 text-white text-xs px-3 py-1 rounded-full">OUT OF STOCK</span>` : ''}
    </div>
    <div class="space-y-3">
      <div class="flex justify-between items-start">
        <span class="text-on-surface-variant text-xs uppercase tracking-tighter">${p.category}</span>
        <span class="text-primary font-bold">৳${finalPrice}</span>
      </div>
      <h4 class="headline-font text-xl font-bold text-on-surface line-clamp-2">${p.name}</h4>
      ${p.color ? `<p class="text-sm text-on-surface-variant">${p.color}</p>` : ''}
      <button onclick="addToCart('${p.id}'); event.stopImmediatePropagation()" 
              class="w-full mt-4 py-3.5 bg-surface-variant/50 hover:bg-primary hover:text-on-primary font-semibold rounded-xl transition-all">
        Add to Cart
      </button>
    </div>
  `;
  return card;
}

// ==================== INIT HOMEPAGE ====================
async function initHomepage() {
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    products.forEach(p => productsMap.set(p.id, p));

    // Render Categories
    const categoriesContainer = document.getElementById('categories');
    if (categoriesContainer) {
      categoriesContainer.innerHTML = '';
      const catList = [
        { name: 'Keyboards', bg: 'k&b.png' },
        { name: 'Keycaps', bg: 'k.png' },
        { name: 'Switches', bg: 's.png' },
        { name: 'Accessories and Collectables', bg: 'c&a.png' }
      ];
      catList.forEach(c => categoriesContainer.appendChild(createCategoryCard(c)));
    }

    // Render May Interest You
    const interestContainer = document.getElementById('interest-products');
    if (interestContainer) {
      interestContainer.innerHTML = '';
      const shuffled = products.sort(() => Math.random() - 0.5).slice(0, 8);
      shuffled.forEach(p => interestContainer.appendChild(createProductCard(p)));
    }

    updateCartUI();

    console.log('✅ Homepage with full cart system loaded successfully');
  } catch (err) {
    console.error('Failed to load homepage:', err);
  }
}

// Start
document.addEventListener('DOMContentLoaded', initHomepage);

// Expose addToCart globally so buttons can call it
window.addToCart = addToCart;