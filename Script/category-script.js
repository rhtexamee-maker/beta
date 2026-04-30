// Script/category-script.js
// Dedicated script for the Category page (Keyboard Collection)

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { firebaseConfig } from '../config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allProducts = [];

// ====================== LOAD PRODUCTS ======================
async function loadProducts(category = null) {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = `
    <div class="col-span-full text-center py-20">
      <span class="material-symbols-outlined text-5xl text-primary animate-pulse">sync</span>
      <p class="mt-4 text-on-surface-variant">Loading inventory from lattice...</p>
    </div>`;

  try {
    let q = collection(db, 'products');
    
    // If category is specified (e.g. ?category=keyboards)
    if (category) {
      q = query(collection(db, 'products'), where('category', '==', category));
    }

    const snapshot = await getDocs(q);
    allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    renderProducts(allProducts);

  } catch (err) {
    console.error(err);
    grid.innerHTML = `
      <div class="col-span-full text-center py-20 text-red-400">
        Failed to load products. Please try again.
      </div>`;
  }
}

// ====================== RENDER PRODUCTS ======================
function renderProducts(products) {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = '';

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-20">
        <p class="text-on-surface-variant">No products found in this category.</p>
      </div>`;
    return;
  }

  products.forEach(product => {
    const finalPrice = Number(product.price) - Number(product.discount || 0);
    const isPreOrder = product.availability === 'Pre Order';
    const isOutOfStock = Number(product.stock) <= 0 && !isPreOrder;

    const card = document.createElement('div');
    card.className = `group relative glass-card p-6 rounded-2xl border border-outline-variant/15 hover:border-primary/40 transition-all duration-500 overflow-hidden`;

    card.innerHTML = `
      <!-- Stock Badge -->
      <div class="absolute top-5 right-5 z-10">
        ${isPreOrder ? 
          `<span class="px-4 py-1 text-[10px] font-bold tracking-widest bg-blue-500/90 text-white rounded-full">PRE ORDER</span>` : 
          isOutOfStock ? 
          `<span class="px-4 py-1 text-[10px] font-bold tracking-widest bg-red-500/90 text-white rounded-full">OUT OF STOCK</span>` :
          `<span class="px-4 py-1 text-[10px] font-bold tracking-widest bg-green-500/90 text-white rounded-full">IN STOCK</span>`
        }
      </div>

      <!-- Image -->
      <div class="aspect-square mb-8 relative overflow-hidden rounded-xl">
        <img src="${product.images && product.images[0] ? product.images[0] : ''}" 
             class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
             alt="${product.name}"
             onerror="this.src='https://via.placeholder.com/400x400/1f2937/64748b?text=No+Image'">
      </div>

      <!-- Content -->
      <div class="space-y-5">
        <div>
          <div class="text-[10px] tracking-widest text-outline uppercase mb-1">${product.category || 'Keyboard'}</div>
          <h3 class="font-headline text-2xl font-bold text-white tracking-tight line-clamp-2">${product.name}</h3>
        </div>

        <div class="flex items-end justify-between">
          <div>
            <div class="font-headline text-3xl font-light text-primary">
              ৳${finalPrice.toLocaleString('en-IN')}
            </div>
            ${Number(product.discount) > 0 ? 
              `<div class="text-xs text-slate-400 line-through">৳${Number(product.price).toLocaleString('en-IN')}</div>` : ''}
          </div>

          <button onclick="viewProduct('${product.id}')" 
                  class="flex items-center gap-2 group/btn px-5 py-3 rounded-2xl border border-white/10 hover:border-primary hover:bg-primary/10 transition-all">
            <span class="text-xs font-bold tracking-widest uppercase text-white group-hover/btn:text-primary">VIEW PROTOCOL</span>
            <span class="material-symbols-outlined text-sm text-primary group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

// ====================== VIEW PRODUCT ======================
window.viewProduct = (productId) => {
  window.location.href = `product.html?id=${productId}`;
};

// ====================== BASIC FILTER (Price) ======================
function applyFilters() {
  const minPrice = parseFloat(document.getElementById('price-min')?.value) || 0;
  const maxPrice = parseFloat(document.getElementById('price-max')?.value) || Infinity;

  const filtered = allProducts.filter(product => {
    const price = Number(product.price) - Number(product.discount || 0);
    return price >= minPrice && price <= maxPrice;
  });

  renderProducts(filtered);
}

// ====================== INIT ======================
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c✅ Category Page Loaded', 'color:#c084fc; font-weight:bold');

  // Get category from URL query parameter (e.g., category.html?category=Keyboards)
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get('category');

  loadProducts(category);

  // Allow pressing Enter in price inputs to apply filter
  const priceInputs = document.querySelectorAll('#price-min, #price-max');
  priceInputs.forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') applyFilters();
    });
  });
});
