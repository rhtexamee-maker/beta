// Script/admin-script.js
// Dedicated script for the new admin.html - Full functionality

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, orderBy, query, runTransaction } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

import { firebaseConfig, BKASH_NUMBER, COD_NUMBER } from '../config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==================== ADMIN LOGIN / LOGOUT ====================
window.logoutAdmin = function() {
  signOut(auth).then(() => {
    window.location.reload();
  }).catch(err => alert('Logout error: ' + err.message));
};

// Show login form if not logged in
function checkAuth() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is logged in
      document.getElementById('login-panel').style.display = 'none';
      document.getElementById('admin-panel').style.display = 'block';
      loadAdminData();
    } else {
      // Show login
      document.getElementById('login-panel').style.display = 'block';
      document.getElementById('admin-panel').style.display = 'none';
    }
  });
}

// Login handler
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('admin-email').value;
      const pass = document.getElementById('admin-pass').value;

      try {
        await signInWithEmailAndPassword(auth, email, pass);
      } catch (err) {
        alert('Login failed: ' + err.message);
      }
    });
  }

  checkAuth();
});

// ==================== LOAD ADMIN DATA ====================
async function loadAdminData() {
  await renderProductsTable();
  await renderOrdersTable();
}

// ==================== PRODUCTS TABLE ====================
async function renderProductsTable() {
  const tbody = document.getElementById('products-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  const snapshot = await getDocs(collection(db, 'products'));
  const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  products.forEach(p => {
    const tr = document.createElement('tr');
    tr.className = "hover:bg-white/[0.02] transition-colors group";

    tr.innerHTML = `
      <td class="px-8 py-6">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg bg-surface-container-highest overflow-hidden border border-white/10">
            <img src="${p.images?.[0] || ''}" class="w-full h-full object-cover" onerror="this.style.display='none'">
          </div>
          <div>
            <p class="font-bold text-on-surface">${p.name}</p>
            <p class="text-xs text-slate-500">${p.color || ''}</p>
          </div>
        </div>
      </td>
      <td class="px-8 py-6 text-xs text-slate-400">${p.category}</td>
      <td class="px-8 py-6">
        <span class="px-3 py-1 text-xs font-bold rounded-full ${Number(p.stock) > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}">
          ${Number(p.stock) > 0 ? 'In Stock' : 'Out of Stock'}
        </span>
      </td>
      <td class="px-8 py-6 text-right font-medium">৳${p.price}</td>
      <td class="px-8 py-6 text-right font-mono">${p.stock}</td>
      <td class="px-8 py-6 text-center">
        <button onclick="deleteProduct('${p.id}')" class="material-symbols-outlined text-red-400 hover:text-red-500">delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.deleteProduct = async function(id) {
  if (!confirm("Delete this product permanently?")) return;
  try {
    await deleteDoc(doc(db, 'products', id));
    renderProductsTable();
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
};

// Basic Add Product (you can improve later)
window.showAddProductForm = function() {
  const name = prompt("Product Name:");
  if (!name) return;
  const price = prompt("Price (Tk):");
  if (!price) return;

  addDoc(collection(db, 'products'), {
    name: name,
    price: Number(price),
    discount: 0,
    images: [],
    category: "Keycaps",
    color: "",
    stock: 10,
    availability: "Ready",
    hotDeal: false,
    description: "",
    detailedDescription: ""
  }).then(() => {
    alert("Product added successfully!");
    renderProductsTable();
  }).catch(err => alert("Error: " + err.message));
};

// ==================== ORDERS TABLE ====================
async function renderOrdersTable() {
  const container = document.getElementById('orders-body');
  if (!container) return;

  container.innerHTML = '<p class="text-slate-400">Loading orders...</p>';

  try {
    const q = query(collection(db, 'orders'), orderBy('timeISO', 'desc'));
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    container.innerHTML = '';

    orders.forEach(o => {
      const div = document.createElement('div');
      div.className = "flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl border-l-4 border-primary";
      div.innerHTML = `
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-mono text-xs text-slate-400">
            #${o.id.slice(-4)}
          </div>
          <div>
            <p class="font-bold text-on-surface">${o.customerName || 'Unknown'}</p>
            <p class="text-xs text-slate-500">${o.items ? o.items.length : 1} items • ৳${o.total || 0}</p>
          </div>
        </div>
        <div>
          <span class="px-3 py-1 text-xs font-bold rounded-full ${o.status === 'Delivered' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}">
            ${o.status || 'Pending'}
          </span>
        </div>
      `;
      container.appendChild(div);
    });

  } catch (err) {
    container.innerHTML = '<p class="text-red-400">Failed to load orders</p>';
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Stats can be updated later if needed
  console.log("Admin script loaded - waiting for authentication");
});
