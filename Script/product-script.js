// Script/product-script.js
// Dedicated script for the individual product page (revamped design)

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { firebaseConfig } from '../config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentProduct = null;
let allProducts = [];

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
  const product = allProducts.find(p => p.id === productId) || currentProduct;
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
  if (countEl) {
    const cart = getCart();
    countEl.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
  }
}

// ====================== LOAD PRODUCT ======================
async function loadProduct() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    alert("Product ID is missing in URL");
    return;
  }

  try {
    // Load all products for related section
    const snapshot = await getDocs(collection(db, 'products'));
    allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Find current product
    currentProduct = allProducts.find(p => p.id === productId);

    if (!currentProduct) {
      alert("Product not found");
      return;
    }

    renderProductDetails();
    renderRelatedProducts();
    updateCartCount();

  } catch (err) {
    console.error("Error loading product:", err);
    alert("Failed to load product details");
  }
}

// ====================== RENDER PRODUCT DETAILS ======================
function renderProductDetails() {
  if (!currentProduct) return;

  // Title and Meta
  document.getElementById('page-title').textContent = currentProduct.name || "Product";
  document.getElementById('meta-description').content = currentProduct.detailedDescription || currentProduct.description || "";

  // Main Image
  const mainImage = document.getElementById('main-image');
  if (currentProduct.images && currentProduct.images[0]) {
    mainImage.src = currentProduct.images[0];
  }

  // Name
  document.getElementById('product-name').textContent = currentProduct.name || "";

  // Price
  const hasDiscount = Number(currentProduct.discount) > 0;
  const price = Number(currentProduct.price) || 0;
  const finalPrice = hasDiscount ? price - Number(currentProduct.discount) : price;

  const priceEl = document.getElementById('product-price');
  priceEl.innerHTML = hasDiscount 
    ? `<span class="line-through text-slate-500 text-2xl">৳${price}</span> ৳${finalPrice}` 
    : `৳${finalPrice}`;

  // Badges
  const badgesContainer = document.getElementById('product-badges');
  badgesContainer.innerHTML = '';

  if (currentProduct.hotDeal) {
    const badge = document.createElement('span');
    badge.className = "bg-red-500 text-white text-xs font-bold px-4 py-1 rounded-full";
    badge.textContent = "HOT DEAL";
    badgesContainer.appendChild(badge);
  }

  if (currentProduct.availability === 'Upcoming') {
    const badge = document.createElement('span');
    badge.className = "bg-amber-500 text-white text-xs font-bold px-4 py-1 rounded-full";
    badge.textContent = "UPCOMING";
    badgesContainer.appendChild(badge);
  } else if (currentProduct.availability === 'Pre Order') {
    const badge = document.createElement('span');
    badge.className = "bg-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full";
    badge.textContent = "PRE ORDER";
    badgesContainer.appendChild(badge);
  } else if (Number(currentProduct.stock) > 0) {
    const badge = document.createElement('span');
    badge.className = "bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-full";
    badge.textContent = "IN STOCK";
    badgesContainer.appendChild(badge);
  }

  // Short Description
  document.getElementById('product-short-desc').textContent = currentProduct.color 
    ? `Color: ${currentProduct.color}` 
    : currentProduct.description || "";

  // Detailed Description (supports HTML)
  const descEl = document.getElementById('product-detailed-desc');
  descEl.innerHTML = currentProduct.detailedDescription 
    ? currentProduct.detailedDescription.replace(/\n/g, '<br>') 
    : currentProduct.description || "No description available.";

  // Thumbnail Gallery
  const thumbContainer = document.getElementById('thumbnail-gallery');
  thumbContainer.innerHTML = '';

  if (currentProduct.images && currentProduct.images.length > 0) {
    currentProduct.images.forEach((imgSrc, index) => {
      const thumb = document.createElement('div');
      thumb.className = `aspect-square bg-surface-container-high rounded-xl overflow-hidden cursor-pointer border-2 ${index === 0 ? 'border-primary' : 'border-transparent'}`;
      thumb.innerHTML = `<img src="${imgSrc}" class="w-full h-full object-cover" alt="Thumbnail ${index+1}">`;
      thumb.addEventListener('click', () => {
        mainImage.src = imgSrc;
        // Update active border
        document.querySelectorAll('#thumbnail-gallery > div').forEach(t => t.classList.remove('border-primary'));
        thumb.classList.add('border-primary');
      });
      thumbContainer.appendChild(thumb);
    });
  }
}

// ====================== RELATED PRODUCTS ======================
function renderRelatedProducts() {
  const container = document.getElementById('related-products');
  if (!container) return;

  container.innerHTML = '';

  // Get 4 random products (excluding current)
  const related = allProducts
    .filter(p => p.id !== currentProduct.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);

  related.forEach(product => {
    const card = document.createElement('div');
    card.className = "group cursor-pointer";
    card.innerHTML = `
      <div class="bg-surface-container-low rounded-xl overflow-hidden aspect-square mb-4 border border-outline-variant/10">
        ${product.images && product.images[0] ? 
          `<img src="${product.images[0]}" class="w-full h-full object-cover transition-transform group-hover:scale-105" alt="${product.name}">` : ''}
      </div>
      <h4 class="font-medium text-on-surface">${product.name}</h4>
      <p class="text-sm text-primary font-mono">৳${Number(product.price) - Number(product.discount || 0)}</p>
    `;
    card.addEventListener('click', () => {
      window.location.href = `product.html?id=${product.id}`;
    });
    container.appendChild(card);
  });
}

// ====================== ADD TO CART FROM DETAIL PAGE ======================
window.addToCartFromDetail = () => {
  if (currentProduct) {
    addToCart(currentProduct.id);
  }
};

// ====================== INIT ======================
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c✅ Product Detail Page Loaded', 'color:#c084fc; font-weight:bold');
  
  loadProduct();
  updateCartCount();

  // Mobile cart link
  const mobileCart = document.getElementById('mobile-cart-link');
  if (mobileCart) {
    mobileCart.addEventListener('click', () => {
      alert("Cart functionality - will be expanded later");
    });
  }
});

window.addToCart = addToCart;
