// Script/admin-script.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { firebaseConfig } from '../config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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

window.logoutAdmin = () => signOut(auth).then(() => location.reload());

// Auth State
onAuthStateChanged(auth, (user) => {
  const loginPanel = document.getElementById('login-panel');
  const adminPanel = document.getElementById('admin-panel');
  if (user) {
    loginPanel?.classList.add('hidden');
    adminPanel?.classList.remove('hidden');
    loadAdminData();
  } else {
    loginPanel?.classList.remove('hidden');
    adminPanel?.classList.add('hidden');
  }
});

async function loadAdminData() {
  await renderProducts();
  await renderOrders();
}

// Render Products (inline editable)
async function renderProducts() {
  const tbody = document.getElementById('products-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const snapshot = await getDocs(collection(db, 'products'));
  snapshot.forEach(docSnap => {
    const p = { id: docSnap.id, ...docSnap.data() };
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-8 py-6"><div contenteditable="true" data-field="name" class="editable">${p.name || ''}</div></td>
      <td class="px-8 py-6">${p.category || ''}</td>
      <td class="px-8 py-6 text-right"><div contenteditable="true" data-field="price" class="editable">${p.price || 0}</div></td>
      <td class="px-8 py-6 text-right"><div contenteditable="true" data-field="discount" class="editable">${p.discount || 0}</div></td>
      <td class="px-8 py-6 text-right"><div contenteditable="true" data-field="stock" class="editable">${p.stock || 0}</div></td>
      <td class="px-8 py-6"><button onclick="deleteProduct('${p.id}')" class="text-red-400 hover:text-red-500">Delete</button></td>
    `;

    tr.querySelectorAll('.editable').forEach(el => {
      el.addEventListener('blur', async () => {
        const field = el.dataset.field;
        let value = el.textContent.trim();
        if (['price','discount','stock'].includes(field)) value = Number(value) || 0;
        await updateDoc(doc(db, 'products', p.id), { [field]: value });
      });
    });
    tbody.appendChild(tr);
  });
}

window.deleteProduct = async (id) => {
  if (confirm("Delete product?")) {
    await deleteDoc(doc(db, 'products', id));
    renderProducts();
  }
};

// Add Product (only on dashboard)
document.getElementById('add-product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    name: document.getElementById('add-name').value.trim(),
    price: Number(document.getElementById('add-price').value),
    discount: Number(document.getElementById('add-discount').value) || 0,
    images: document.getElementById('add-images').value.split(',').map(u => u.trim()).filter(Boolean),
    category: document.getElementById('add-category').value,
    stock: Number(document.getElementById('add-stock').value) || 0,
    // add other fields as needed
  };

  try {
    await addDoc(collection(db, 'products'), data);
    alert('Product added!');
    e.target.reset();
    renderProducts();
  } catch (err) {
    alert('Error: ' + err.message);
  }
});

// Render Orders
async function renderOrders() {
  const container = document.getElementById('orders-body');
  if (!container) return;
  container.innerHTML = '';

  const q = query(collection(db, 'orders'), orderBy('timeISO', 'desc'));
  const snapshot = await getDocs(q);

  snapshot.forEach(docSnap => {
    const o = docSnap.data();
    const div = document.createElement('div');
    div.className = "p-4 bg-surface-container-lowest rounded-xl flex justify-between";
    div.innerHTML = `
      <div>
        <p class="font-medium">${o.customerName || 'Customer'}</p>
        <p class="text-xs text-slate-400">${new Date(o.timeISO).toLocaleString()}</p>
      </div>
      <div class="text-right">
        <p class="font-bold">৳${o.total || 0}</p>
        <p class="text-xs ${o.status === 'Delivered' ? 'text-green-400' : 'text-yellow-400'}">${o.status || 'Pending'}</p>
      </div>
    `;
    container.appendChild(div);
  });
}
