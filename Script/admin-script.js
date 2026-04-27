// Script/admin-script.js

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

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

// Show panels
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById('login-panel').classList.add('hidden');
    document.getElementById('admin-panel').classList.remove('hidden');
    loadAdminData();
  }
});

async function loadAdminData() {
  renderProducts();
  renderOrders();
}

// ==================== PRODUCTS (Editable) ====================
async function renderProducts() {
  const tbody = document.getElementById('products-body');
  tbody.innerHTML = '';

  const snapshot = await getDocs(collection(db, 'products'));
  snapshot.forEach(docSnap => {
    const p = { id: docSnap.id, ...docSnap.data() };

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-8 py-6">
        <div contenteditable="true" class="product-name">${p.name}</div>
      </td>
      <td class="px-8 py-6">${p.category}</td>
      <td class="px-8 py-6 text-right">
        <div contenteditable="true" class="product-price">${p.price}</div>
      </td>
      <td class="px-8 py-6 text-right">
        <div contenteditable="true" class="product-discount">${p.discount || 0}</div>
      </td>
      <td class="px-8 py-6 text-right">
        <div contenteditable="true" class="product-stock">${p.stock}</div>
      </td>
      <td class="px-8 py-6">
        <button onclick="deleteProduct('${p.id}')" class="text-red-400 hover:text-red-500">Delete</button>
      </td>
    `;

    // Save on blur for editable fields
    tr.querySelectorAll('[contenteditable="true"]').forEach(el => {
      el.addEventListener('blur', async () => {
        const field = el.className.split('-')[1];
        const value = field === 'price' || field === 'discount' || field === 'stock' 
          ? Number(el.textContent) 
          : el.textContent;
        await updateDoc(doc(db, 'products', p.id), { [field]: value });
      });
    });

    tbody.appendChild(tr);
  });
}

window.deleteProduct = async (id) => {
  if (confirm("Delete this product permanently?")) {
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
    alert('Error: ' + err.message);
  }
});

// ==================== ORDERS ====================
async function renderOrders() {
  const container = document.getElementById('orders-body');
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
