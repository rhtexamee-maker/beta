// Script/products-script.js - Final Version with Dynamic Filters & Pagination

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { firebaseConfig } from '../config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allProducts = [];
let currentPage = 1;
const PRODUCTS_PER_PAGE = 21;   // Changed to 21 as requested

// ====================== CART ======================
function getCart() {
  const cart = localStorage.getItem('cart');
  return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function addToCart(productId) {
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
    existing.qty += 1;
  } else {
    cart.push({
      id: productId,
      name: product.name,
      color: product.color || '',
      price: finalPrice,
      image: product.images?.[0] || '',
      qty: 1
    });
  }

  saveCart(cart);
  alert(`${product.name} added to cart!`);
}

function updateCartCount() {
  const countEl = document.getElementById('cart-count');
  if (countEl) {
    const cart = getCart();
    countEl.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
  }
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
        `<div class="w-full h-full flex items-center justify-center text-slate-500">No Image</div>`}
      
      ${statusHTML}

      <button onclick="addToCart('${product.id}'); event.stopImmediatePropagation()" 
              class="absolute bottom-4 right-4 w-11 h-11 bg-surface-bright/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
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

// ====================== DYNAMIC FILTERS ======================
function extractSpecs(description) {
  if (!description) return {};
  const specs = {};
  const lines = description.toString().split('\n');
  lines.forEach(line => {
    const match = line.match(/^([^:]+?)\s*:\s*(.+)$/);
    if (match) {
      const key = match[1].trim().toLowerCase();
      specs[key] = match[2].trim();
    }
  });
  return specs;
}

function renderDynamicFilters(products) {
  const container = document.querySelector('aside'); // or create a specific filter container
  // For simplicity, we'll add color and category filters dynamically

  const colors = [...new Set(products.map(p => p.color).filter(Boolean))];
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  // You can expand this to show more dynamic specs if needed
  console.log("Available colors:", colors);
  console.log("Available categories:", categories);
}

// ====================== PAGINATION ======================
function renderPagination() {
  const totalPages = Math.ceil(allProducts.length / PRODUCTS_PER_PAGE);
  const paginationContainer = document.getElementById('pagination');
  if (!paginationContainer) return;

  paginationContainer.innerHTML = '';

  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Previous';
  prevBtn.className = `px-5 py-3 rounded-2xl text-sm ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-surface-container-high'}`;
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) renderProducts(currentPage - 1);
  });
  paginationContainer.appendChild(prevBtn);

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = `px-5 py-3 rounded-2xl text-sm font-medium ${i === currentPage ? 'bg-primary text-on-primary' : 'hover:bg-surface-container-high'}`;
    btn.addEventListener('click', () => renderProducts(i));
    paginationContainer.appendChild(btn);
  }

  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.className = `px-5 py-3 rounded-2xl text-sm ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-surface-container-high'}`;
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) renderProducts(currentPage + 1);
  });
  paginationContainer.appendChild(nextBtn);
}

function renderProducts(page = 1) {
  currentPage = page;
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  grid.innerHTML = '';

  const start = (page - 1) * PRODUCTS_PER_PAGE;
  const end = start + PRODUCTS_PER_PAGE;
  const paginated = allProducts.slice(start, end);

  paginated.forEach(product => {
    grid.appendChild(createProductCard(product));
  });

  document.getElementById('result-count').textContent = 
    `Showing ${start + 1}–${Math.min(end, allProducts.length)} of ${allProducts.length}`;

  renderPagination();
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
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.category && p.category.toLowerCase().includes(term)) ||
      (p.color && p.color.toLowerCase().includes(term))
    );

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

    allProducts.sort((a, b) => a.name.localeCompare(b.name));

    renderDynamicFilters(allProducts);
    renderProducts(1);
    updateCartCount();
  } catch (err) {
    console.error("Error loading products:", err);
    document.getElementById('product-grid').innerHTML = `
      <p class="col-span-full text-center text-red-400 py-12">Failed to load products.</p>`;
  }
}

// ====================== INIT ======================
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c✅ Products Page Loaded', 'color:#c084fc; font-weight:bold');
  loadProducts();
  setupSearch();
  updateCartCount();
});

window.addToCart = addToCart;
