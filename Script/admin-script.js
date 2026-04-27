// Script/admin-script.js

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore, collection, getDocs, addDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

import { firebaseConfig } from '../config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginPanel = document.getElementById('login-panel');
const adminPanel = document.getElementById('admin-panel');

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('admin-email').value;
  const pass = document.getElementById('admin-pass').value;

  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    alert('Login failed: ' + err.message);
  }
});

// Logout
window.logoutAdmin = () => signOut(auth).then(() => location.reload());

// Show panels based on auth
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginPanel.classList.add('hidden');
    adminPanel.classList.remove('hidden');
    loadAdminData();
  } else {
    loginPanel.classList.remove('hidden');
    adminPanel.classList.add('hidden');
  }
});

// Load data
async function loadAdminData() {
  renderProducts();
  renderOrders();
}

// Render Products
async function renderProducts() {
  const tbody = document.getElementById('products-body');
  tbody.innerHTML = '';

  const snapshot = await getDocs(collection(db, 'products'));
  snapshot.forEach(docSnap => {
    const p = { id: docSnap.id, ...docSnap.data() };
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-8 py-6 font-medium">${p.name}</td>
      <td class="px-8 py-6">${p.category}</td>
      <td class="px-8 py-6">৳${p.price}</td>
      <td class="px-8 py-6">${p.stock}</td>
      <td class="px-8 py-6">
        <button onclick="deleteProduct('${p.id}')" class="text-red-400 hover:text-red-500">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.deleteProduct = async (id) => {
  if (confirm("Delete this product?")) {
    await deleteDoc(doc(db, 'products', id));
    renderProducts();
  }
};

// Add Product
document.getElementById('add-product-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    name: document.getElementById('add-name').value.trim(),
    price: Number(document.getElementById('add-price').value),
    discount: Number(document.getElementById('add-discount').value) || 0,
    images: document.getElementById('add-images').value.split(',').map(u => u.trim()).filter(Boolean),
    category: document.getElementById('add-category').value,
    color: document.getElementById('add-color').value.trim(),
    stock: Number(document.getElementById('add-stock').value) || 0,
    availability: document.getElementById('add-availability').value,
    hotDeal: document.getElementById('add-hotdeal').checked,
    description: document.getElementById('add-desc').value.trim(),
    detailedDescription: document.getElementById('add-detailed-desc').value.trim()
  };

  try {
    await addDoc(collection(db, 'products'), data);
    alert('Product added successfully!');
    e.target.reset();
    renderProducts();
  } catch (err) {
    alert('Error adding product: ' + err.message);
  }
});

// Render Orders (simple version)
async function renderOrders() {
  const container = document.getElementById('orders-body');
  container.innerHTML = '<p class="text-slate-400">Loading orders...</p>';

  try {
    const q = query(collection(db, 'orders'), orderBy('timeISO', 'desc'));
    const snapshot = await getDocs(q);
    container.innerHTML = '';

    snapshot.forEach(docSnap => {
      const o = docSnap.data();
      const div = document.createElement('div');
      div.className = "p-4 bg-surface-container rounded-xl flex justify-between items-center";
      div.innerHTML = `
        <div>
          <p class="font-medium">${o.customerName || 'Customer'}</p>
          <p class="text-sm text-slate-400">${o.timeISO ? new Date(o.timeISO).toLocaleString() : ''}</p>
        </div>
        <div class="text-right">
          <p class="font-bold">৳${o.total || 0}</p>
          <p class="text-xs ${o.status === 'Delivered' ? 'text-green-400' : 'text-yellow-400'}">${o.status || 'Pending'}</p>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    container.innerHTML = '<p class="text-red-400">Failed to load orders</p>';
  }
}
