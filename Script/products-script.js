// Script/products-script.js
// Dedicated script for the new revamped products.html

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { firebaseConfig } from '../config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global products cache
let allProducts = [];

// Cart functions (shared with other pages)
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
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  countEl.textContent = totalItems;
}

// Create Product Card (New Tailwind Design)
function createProductCard(product) {
  const hasDiscount = Number(product.discount) > 0;
  const price = Number(product.price) || 0;
  const finalPrice = hasDiscount ? price - Number(product.discount) : price;

  const isUpcoming = product.availability === 'Upcoming';
  const isOOS = !isUpcoming && Number(product.stock) <= 0 && product.availability !== 'Pre Order';

  const card = document.createElement('div');
  card.className = `product-card bg-surface-container-low rounded-2xl overflow-hidden group cursor-pointer`;

  card.innerHTML = `
    <div class="aspect-[4/3] relative overflow-hidden bg-surface-container-lowest">
      ${product.images && product.images[0] ? 
        `<img src="${product.images[0]}" alt="${product.name}" 
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">` : 
        `<div class="w-full h-full flex items-center justify-center text-slate-500">No Image</div>`}
      
      <div class="absolute top-4 left-4 flex flex-wrap gap-2">
        ${product.hotDeal ? `<span class="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full">HOT DEAL</span>` : ''}
        ${isUpcoming ? `<span class="bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full">UPCOMING</span>` : ''}
        ${isOOS ? `<span class="bg-slate-600 text-white text-[10px] font-black px-3 py-1 rounded-full">OUT OF STOCK</span>` : ''}
      </div>

      <button onclick="addToCart('${product.id}'); event.stopImmediatePropagation()" 
              class="absolute bottom-4 right-4 w-11 h-11 bg-surface-bright/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
        <span class="material-symbols-outlined">add_shopping_cart</span>
      </button>
    </div>

    <div class="p-6">
      <div class="flex justify-between items-start mb-2">
        <h3 class="font-medium text-lg leading-tight line-clamp-2">${product.name}</h3>
        <span class="font-mono font-bold text-primary">
          ৳${finalPrice}
        </span>
      </div>
      
      <p class="text-sm text-on-surface-variant mb-4 line-clamp-2">
        ${product.color ? `Color: ${product.color}` : ''}
      </p>

      <div class="flex gap-2">
        ${product.category ? `<span class="text-[10px] bg-surface-container-high px-3 py-1 rounded-full">${product.category}</span>` : ''}
        ${product.stock > 0 ? `<span class="text-[10px] bg-green-500/10 text-green-400 px-3 py-1 rounded-full">In Stock</span>` : ''}
      </div>
    </div>
  `;

  // Click card to view details (you can expand this later)
  card.addEventListener('click', (e) => {
    if (!e.target.closest('button')) {
      window.location.href = `product.html?id=${product.id}`;
    }
  });

  return card;
}

// Render all products
async function renderProducts(filteredProducts = null) {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  grid.innerHTML = '';

  const productsToShow = filteredProducts || allProducts;

  if (productsToShow.length === 0) {
    grid.innerHTML = `<p class="col-span-full text-center text-slate-400 py-12">No products found.</p>`;
    return;
  }

  productsToShow.forEach(product => {
    grid.appendChild(createProductCard(product));
  });

  document.getElementById('result-count').textContent = `Showing ${productsToShow.length} products`;
}

// Search functionality
function setupSearch() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();

    if (!term) {
      renderProducts();
      return;
    }

    const filtered = allProducts.filter(product => 
      product.name.toLowerCase().includes(term) ||
      (product.category && product.category.toLowerCase().includes(term)) ||
      (product.color && product.color.toLowerCase().includes(term))
    );

    renderProducts(filtered);
  });
}

// Load products from Firestore
async function loadProducts() {
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    allProducts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by name by default
    allProducts.sort((a, b) => a.name.localeCompare(b.name));

    renderProducts();
    updateCartCount();
  } catch (err) {
    console.error("Error loading products:", err);
    document.getElementById('product-grid').innerHTML = `
      <p class="col-span-full text-center text-red-400 py-12">
        Failed to load products. Please try again later.
      </p>`;
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c🚀 Products Page Loaded', 'color:#c084fc; font-weight:bold');

  loadProducts();
  setupSearch();
  updateCartCount();

  // Mobile cart link
  const mobileCartLink = document.getElementById('mobile-cart-link');
  if (mobileCartLink) {
    mobileCartLink.addEventListener('click', () => {
      alert('Cart functionality - Open cart slider (to be implemented)');
      // You can expand this to open cart slider later
    });
  }
});

// Make addToCart available globally for inline onclick
window.addToCart = addToCart;
