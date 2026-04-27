// Script/admin-script.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { firebaseConfig } from '../config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('admin-email').value.trim();
  const pass = document.getElementById('admin-pass').value.trim();
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
}

// Render Products with click-to-edit
async function renderProducts() {
  const tbody = document.getElementById('products-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const snapshot = await getDocs(collection(db, 'products'));
  snapshot.forEach((docSnap) => {
    const p = { id: docSnap.id, ...docSnap.data() };
    const tr = document.createElement('tr');
    tr.className = "hover:bg-white/[0.02] cursor-pointer";
    tr.innerHTML = `
      <td class="px-8 py-6">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-surface-container-highest rounded-lg overflow-hidden">
            ${p.images && p.images[0] ? `<img src="${p.images[0]}" class="w-full h-full object-cover">` : ''}
          </div>
          <div>
            <p class="font-medium">${p.name || 'Untitled'}</p>
          </div>
        </div>
      </td>
      <td class="px-8 py-6">${p.category || '-'}</td>
      <td class="px-8 py-6 text-right">৳${p.price || 0}</td>
      <td class="px-8 py-6 text-right">${p.stock || 0}</td>
      <td class="px-8 py-6 text-center">
        <button onclick="editProduct('${p.id}'); event.stopImmediatePropagation()" class="material-symbols-outlined text-slate-400 hover:text-primary">edit</button>
      </td>
    `;
    tr.addEventListener('click', () => editProduct(p.id));
    tbody.appendChild(tr);
  });
}

// Full Editable Modal
window.editProduct = async (id) => {
  // Fetch product
  const snapshot = await getDocs(collection(db, 'products'));
  let product = null;
  snapshot.forEach(docSnap => {
    if (docSnap.id === id) product = { id: docSnap.id, ...docSnap.data() };
  });

  if (!product) return alert("Product not found");

  const modal = document.createElement('div');
  modal.innerHTML = `
    <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
      <div class="bg-surface-container-low rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-auto">
        <h2 class="font-headline text-2xl font-bold mb-6">Edit Product</h2>
        <form id="edit-form" class="space-y-6">
          <input type="hidden" id="edit-id" value="${id}">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label>Name</label><input id="edit-name" value="${product.name || ''}" class="w-full px-4 py-3 bg-surface rounded-2xl"></div>
            <div><label>Price</label><input id="edit-price" type="number" value="${product.price || 0}" class="w-full px-4 py-3 bg-surface rounded-2xl"></div>
            <div><label>Discount</label><input id="edit-discount" type="number" value="${product.discount || 0}" class="w-full px-4 py-3 bg-surface rounded-2xl"></div>
            <div><label>Stock</label><input id="edit-stock" type="number" value="${product.stock || 0}" class="w-full px-4 py-3 bg-surface rounded-2xl"></div>
            <div><label>Category</label><input id="edit-category" value="${product.category || ''}" class="w-full px-4 py-3 bg-surface rounded-2xl"></div>
            <div><label>Color</label><input id="edit-color" value="${product.color || ''}" class="w-full px-4 py-3 bg-surface rounded-2xl"></div>
          </div>
          <div><label>Image URLs (comma separated)</label><input id="edit-images" value="${product.images ? product.images.join(', ') : ''}" class="w-full px-4 py-3 bg-surface rounded-2xl"></div>
          <div><label>Specification (HTML supported)</label><textarea id="edit-spec" class="w-full px-4 py-3 bg-surface rounded-2xl h-24">${product.specification || ''}</textarea></div>
          <div><label>Detailed Description (HTML supported)</label><textarea id="edit-detailed-desc" class="w-full px-4 py-3 bg-surface rounded-2xl h-32">${product.detailedDescription || ''}</textarea></div>
          <div class="flex gap-4">
            <button type="button" onclick="closeEditModal()" class="flex-1 py-4 bg-surface-container rounded-2xl">Cancel</button>
            <button type="submit" class="flex-1 py-4 bg-primary text-on-primary rounded-2xl font-bold">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const updateData = {
      name: document.getElementById('edit-name').value.trim(),
      price: Number(document.getElementById('edit-price').value),
      discount: Number(document.getElementById('edit-discount').value) || 0,
      stock: Number(document.getElementById('edit-stock').value) || 0,
      category: document.getElementById('edit-category').value.trim(),
      color: document.getElementById('edit-color').value.trim(),
      images: document.getElementById('edit-images').value.split(',').map(u => u.trim()).filter(Boolean),
      specification: document.getElementById('edit-spec').value.trim(),
      detailedDescription: document.getElementById('edit-detailed-desc').value.trim()
    };

    await updateDoc(doc(db, 'products', id), updateData);
    alert('Product updated!');
    closeEditModal();
    renderProducts();
  });
};

window.closeEditModal = () => {
  const modal = document.querySelector('#edit-modal') || document.querySelector('.fixed.inset-0');
  if (modal) modal.remove();
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
    stock: Number(document.getElementById('add-stock').value) || 0,
    specification: document.getElementById('add-spec').value.trim(),
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
