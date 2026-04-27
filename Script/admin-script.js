// Script/admin-script.js - Full Admin Functionality

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

import { firebaseConfig } from '../config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Logout function
window.logoutAdmin = function() {
  signOut(auth).then(() => {
    window.location.href = 'index.html';
  }).catch(err => {
    alert('Logout error: ' + err.message);
  });
};

// Render Products Table
async function renderProducts() {
  const tbody = document.getElementById('products-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  const snapshot = await getDocs(collection(db, 'products'));
  snapshot.forEach(docSnap => {
    const p = { id: docSnap.id, ...docSnap.data() };

    const tr = document.createElement('tr');
    tr.className = "hover:bg-white/[0.02] transition-colors group";
    tr.innerHTML = `
      <td class="px-8 py-6">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-lg bg-surface-container-highest overflow-hidden">
            <img src="${p.images?.[0] || ''}" class="w-full h-full object-cover" onerror="this.style.display='none'">
          </div>
          <div>
            <p class="text-sm font-bold text-on-surface">${p.name}</p>
            <p class="text-[10px] text-slate-500">${p.color || ''}</p>
          </div>
        </div>
      </td>
      <td class="px-8 py-6 text-xs text-slate-400">${p.category}</td>
      <td class="px-8 py-6">
        <span class="px-3 py-1 text-xs font-bold rounded-full ${p.stock > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}">
          ${p.stock > 0 ? 'In Stock' : 'Out of Stock'}
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
  if (!confirm('Delete this product?')) return;
  await deleteDoc(doc(db, 'products', id));
  renderProducts();
};

// Simple Add Product Form (you can expand this)
window.showAddProductForm = function() {
  const name = prompt("Product Name:");
  if (!name) return;

  const price = prompt("Price (in Tk):");
  if (!price) return;

  addDoc(collection(db, 'products'), {
    name: name,
    price: Number(price),
    discount: 0,
    images: [],
    category: "Keycaps",
    stock: 10,
    availability: "Ready",
    hotDeal: false
  }).then(() => {
    alert("Product added!");
    renderProducts();
  });
};

// Main Init
document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = 'admin.html'; // or index.html
      return;
    }
    renderProducts();
  });
});
