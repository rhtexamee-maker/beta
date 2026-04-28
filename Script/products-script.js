// Script/products-script.js - Fixed & Improved Version

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { firebaseConfig } from '../config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allProducts = [];
let currentPage = 1;
const PRODUCTS_PER_PAGE = 20;

// ====================== CART ======================
function getCart() {
  const cart = localStorage.getItem('cart');
  return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function addToCart(productId, qty = 1) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const isOOS = Number(product.stock) <= 0 && product.availability !== 'Pre Order';
  if (isOOS) {
    alert('This product is out of stock!');
    return;
  }

  let cart = getCart();
  const existing = cart.find(item => item.id === productId);

  const finalPrice = Number(product.discount) > 0 
    ? Number(product.price) - Number(product.discount) 
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

function updateCartCount() {
  const countEl = document.getElementById('cart-count');
  if (!countEl) return;
  const cart = getCart();
  countEl.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
}

// ====================== PRODUCT CARD ======================
function createProductCard(product) {
  const hasDiscount = Number(product.discount) > 0;
  const price = Number(product.price) || 0;
  const finalPrice = hasDiscount ? price - Number(product.discount) : price;

  let statusHTML = '';
  if (product.availability === 'Upcoming') {
    statusHTML = `<span class="absolute top-4 right-4 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full">UPCOMING</span>`;
  } else if (product.availability === 'Pre Order') {
    statusHTML = `<span class="absolute top-4 right-4 bg-blue-500 text-white text-[10px] font-black px-3 py-1 rounded-full">PRE ORDER</span>`;
  } else if (Number(product.stock) <= 0) {
    statusHTML = `<span class="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full">OUT OF STOCK</span>`;
  } else {
    statusHTML = `<span class="absolute top-4 right-4 bg-green-500 text-white text-[10px] font-black px-3 py-1 rounded-full">IN STOCK</span>`;
  }

  const card = document.createElement('div');
  card.className = `product-card bg-surface-container-low rounded-2xl overflow-hidden group cursor-pointer relative`;

  card.innerHTML = `
    <div class="aspect-[4/3] relative overflow-hidden bg-surface-container-lowest">
      ${product.images && product.images[0] ? 
        `<img src="${product.images[0]}" alt="${product.name}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">` : 
        `<div class="w-full h-full flex items-center justify-center text-slate-500 text-sm">No Image</div>`}
      
      ${statusHTML}

      <button onclick="addToCart('${product.id}'); event.stopImmediatePropagation()" 
              class="absolute bottom-4 right-4 w-11 h-11 bg-surface-bright/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-xl">
        <span class="material-symbols-outlined">add_shopping_cart</span>
      </button>
    </div>

    <div class="p-6">
      <h3 class="font-medium text-lg leading-tight line-clamp-2 mb-1">${product.name}</h3>
      ${product.color ? `<p class="text-sm text-on-surface-variant mb-3">Color: ${product.color}</p>` : ''}
      
      <div class="flex justify-between items-end">
        <div>
          <span class="font-mono font-bold text-primary text-xl">৳${finalPrice}</span>
          ${hasDiscount ? `<span class="text-xs line-through text-slate-500 ml-2">৳${price}</span>` : ''}
        </div>
        <span class="text-xs bg-surface-container-high px-3 py-1 rounded-full">${product.category || 'General'}</span>
      </div>
    </div>
  `;

  card.addEventListener('click', (e) => {
    if (!e.target.closest('button')) {
      window.location.href = `product.html?id=${product.id}`;
    }
  });

  return card;
}

// ====================== RENDER WITH PAGINATION ======================
function renderProducts(page = 1) {
  currentPage = page;
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  grid.innerHTML = '';

  const start = (page - 1) * PRODUCTS_PER_PAGE;
  const end = start + PRODUCTS_PER_PAGE;
  const paginatedProducts = allProducts.slice(start, end);

  paginatedProducts.forEach(product => {
    grid.appendChild(createProductCard(product));
  });

  document.getElementById('result-count').textContent = 
    `Showing ${start + 1}–${Math.min(end, allProducts.length)} of ${allProducts.length} products`;

  renderPagination();
}

function renderPagination() {
  const totalPages = Math.ceil(allProducts.length / PRODUCTS_PER_PAGE);
  // You can enhance this with actual pagination buttons if needed
  console.log(`Page ${currentPage} of ${totalPages}`);
}

// ====================== SEARCH ======================
function setupSearch() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    const term = searchInput.value.toLowerCase().trim();

    if (!term) {
      renderProducts(1);
      return;
    }

    const filtered = allProducts.filter(p => 
      p.name.toLowerCase().includes(term) ||
      (p.category && p.category.toLowerCase().includes(term)) ||
      (p.color && p.color.toLowerCase().includes(term))
    );

    // Render filtered results without pagination for simplicity (or implement later)
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';

    if (filtered.length === 0) {
      grid.innerHTML = `<p class="col-span-full text-center py-12 text-slate-400">No products found for "${term}"</p>`;
      return;
    }

    filtered.forEach(p => grid.appendChild(createProductCard(p)));
  });
}

// ====================== LOAD PRODUCTS ======================
async function loadProducts() {
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    allProducts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by name
    allProducts.sort((a, b) => a.name.localeCompare(b.name));

    renderProducts(1);
    updateCartCount();
  } catch (err) {
    console.error("Failed to load products:", err);
    document.getElementById('product-grid').innerHTML = `
      <p class="col-span-full text-center text-red-400 py-12">Failed to load products. Please try again.</p>`;
  }
}

// ====================== INIT ======================
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c✅ Products Page Initialized', 'color:#a78bfa; font-weight:bold');

  loadProducts();
  setupSearch();
  updateCartCount();

  // Mobile cart
  const mobileCart = document.getElementById('mobile-cart-link');
  if (mobileCart) {
    mobileCart.addEventListener('click', () => {
      alert("Cart slider coming soon...");
    });
  }
});

window.addToCart = addToCart;
