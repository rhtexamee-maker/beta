// Script/admin-script.js

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore, collection, getDocs, addDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

import { firebaseConfig } from '../config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Login Form Handler
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
window.logoutAdmin = () => {
  signOut(auth).then(() => window.location.reload());
};

// Show/Hide Panels
function togglePanels(user) {
  const loginPanel = document.getElementById('login-panel');
  const adminPanel = document.getElementById('admin-panel');

  if (user) {
    loginPanel.style.display = 'none';
    adminPanel.style.display = 'block';
    loadAdminData();
  } else {
    loginPanel.style.display = 'block';
    adminPanel.style.display = 'none';
  }
}

// Load Data
async function loadAdminData() {
  await renderProductsTable();
}

// Render Products
async function renderProductsTable() {
  const tbody = document.getElementById('products-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  const snapshot = await getDocs(collection(db, 'products'));
  snapshot.forEach((docSnap) => {
    const p = { id: docSnap.id, ...docSnap.data() };
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>${p.availability}</td>
      <td>৳${p.price}</td>
      <td>${p.stock}</td>
      <td><button onclick="deleteProduct('${p.id}')" class="text-red-400">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });
}

window.deleteProduct = async (id) => {
  if (confirm("Delete this product?")) {
    await deleteDoc(doc(db, 'products', id));
    renderProductsTable();
  }
};

// Add Product Form
document.getElementById('add-product-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    name: document.getElementById('add-name').value,
    price: Number(document.getElementById('add-price').value),
    discount: Number(document.getElementById('add-discount').value) || 0,
    images: document.getElementById('add-images').value.split(',').map(u => u.trim()),
    category: document.getElementById('add-category').value,
    color: document.getElementById('add-color').value,
    stock: Number(document.getElementById('add-stock').value),
    availability: document.getElementById('add-availability').value,
    hotDeal: document.getElementById('add-hotdeal').checked,
    description: document.getElementById('add-desc').value,
    detailedDescription: document.getElementById('add-detailed-desc').value
  };

  try {
    await addDoc(collection(db, 'products'), data);
    alert('Product added successfully!');
    e.target.reset();
    renderProductsTable();
  } catch (err) {
    alert('Error: ' + err.message);
  }
});

// Auth State
onAuthStateChanged(auth, togglePanels);
