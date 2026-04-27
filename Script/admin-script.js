// Script/admin-script.js
// Full working version with proper import from config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { firebaseConfig } from '../config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ====================== LOGIN ======================
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email')?.value.trim();
    const password = document.getElementById('admin-pass')?.value.trim();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error(error);
      alert("Login failed: " + error.message);
    }
  });
}

// Logout
window.logoutAdmin = () => {
  signOut(auth).then(() => {
    window.location.reload();
  }).catch(err => console.error(err));
};

// ====================== AUTH STATE ======================
onAuthStateChanged(auth, (user) => {
  const loginPanel = document.getElementById('login-panel');
  const adminPanel = document.getElementById('admin-panel');

  if (user) {
    if (loginPanel) loginPanel.classList.add('hidden');
    if (adminPanel) adminPanel.classList.remove('hidden');
    loadAdminData();
  } else {
    if (loginPanel) loginPanel.classList.remove('hidden');
    if (adminPanel) adminPanel.classList.add('hidden');
  }
});

// ====================== LOAD DATA ======================
async function loadAdminData() {
  await renderProducts();
  await renderOrders();
}

// ====================== PRODUCTS - WITH EDITABLE DETAILS MODAL ======================
async function renderProducts() {
  const tbody = document.getElementById('products-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  try {
    const snapshot = await getDocs(collection(db, 'products'));

    snapshot.forEach((docSnap) => {
      const p = { id: docSnap.id, ...docSnap.data() };

      const tr = document.createElement('tr');
      tr.className = "hover:bg-white/[0.02] cursor-pointer transition-colors group";
      tr.innerHTML = `
        <td class="px-8 py-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-surface-container-highest rounded-lg overflow-hidden border border-white/10">
              ${p.images && p.images[0] ? 
                `<img src="${p.images[0]}" class="w-full h-full object-cover" onerror="this.src='https://via.placeholder.com/48?text=No+Image'">` : 
                `<div class="w-full h-full flex items-center justify-center text-slate-500 text-xs">No Img</div>`}
            </div>
            <div>
              <p class="font-medium text-on-surface">${p.name || 'Untitled Product'}</p>
              <p class="text-xs text-slate-500">${p.color || ''}</p>
            </div>
          </div>
        </td>
        <td class="px-8 py-6 text-sm">${p.category || '-'}</td>
        <td class="px-8 py-6 text-right font-headline">৳${p.price || 0}</td>
        <td class="px-8 py-6 text-right">${p.stock || 0}</td>
        <td class="px-8 py-6 text-center">
          <button onclick="editProduct('${p.id}'); event.stopImmediatePropagation()" 
                  class="material-symbols-outlined text-slate-400 hover:text-primary text-xl transition-colors">edit</button>
        </td>
      `;

      // Click anywhere on row to edit
      tr.addEventListener('click', () => editProduct(p.id));
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading products:", err);
  }
}

// Full Editable Details Modal
window.editProduct = async (productId) => {
  try {
    const productRef = doc(db, 'products', productId);
    // Note: For full single doc fetch you can use getDoc, but getDocs works too for simplicity
    const snapshot = await getDocs(collection(db, 'products'));
    let product = null;
    snapshot.forEach(doc => {
      if (doc.id === productId) product = { id: doc.id, ...doc.data() };
    });

    if (!product) {
      alert("Product not found");
      return;
    }

    const modalHTML = `
      <div id="edit-modal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4">
        <div class="bg-surface-container-low rounded-3xl p-8 max-w-2xl w-full max-h-[92vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-8">
            <h2 class="font-headline text-2xl font-bold">Edit Product</h2>
            <button onclick="closeEditModal()" class="material-symbols-outlined text-2xl text-slate-400 hover:text-white">close</button>
          </div>

          <form id="edit-form" class="space-y-6">
            <input type="hidden" id="edit-id" value="${product.id}">

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm mb-2">Product Name</label>
                <input id="edit-name" value="${product.name || ''}" class="w-full px-4 py-3 bg-surface rounded-2xl">
              </div>
              <div>
                <label class="block text-sm mb-2">Price (tk)</label>
                <input id="edit-price" type="number" value="${product.price || 0}" class="w-full px-4 py-3 bg-surface rounded-2xl">
              </div>
              <div>
                <label class="block text-sm mb-2">Discount (tk)</label>
                <input id="edit-discount" type="number" value="${product.discount || 0}" class="w-full px-4 py-3 bg-surface rounded-2xl">
              </div>
              <div>
                <label class="block text-sm mb-2">Stock</label>
                <input id="edit-stock" type="number" value="${product.stock || 0}" class="w-full px-4 py-3 bg-surface rounded-2xl">
              </div>
              <div>
                <label class="block text-sm mb-2">Category</label>
                <input id="edit-category" value="${product.category || ''}" class="w-full px-4 py-3 bg-surface rounded-2xl">
              </div>
              <div>
                <label class="block text-sm mb-2">Color</label>
                <input id="edit-color" value="${product.color || ''}" class="w-full px-4 py-3 bg-surface rounded-2xl">
              </div>
            </div>

            <div>
              <label class="block text-sm mb-2">Image URLs (comma separated)</label>
              <input id="edit-images" value="${product.images ? product.images.join(', ') : ''}" class="w-full px-4 py-3 bg-surface rounded-2xl">
            </div>

            <div>
              <label class="block text-sm mb-2">Detailed Description</label>
              <textarea id="edit-detailed-desc" class="w-full px-4 py-3 bg-surface rounded-2xl h-32">${product.detailedDescription || ''}</textarea>
            </div>

            <div class="flex gap-4 pt-6">
              <button type="button" onclick="closeEditModal()" 
                      class="flex-1 py-4 bg-surface-container rounded-2xl font-medium">Cancel</button>
              <button type="submit" 
                      class="flex-1 py-4 bg-primary text-on-primary rounded-2xl font-bold">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);

    // Handle form submit
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
        detailedDescription: document.getElementById('edit-detailed-desc').value.trim()
      };

      try {
        await updateDoc(doc(db, 'products', product.id), updateData);
        alert("Product updated successfully!");
        closeEditModal();
        renderProducts();   // refresh table
      } catch (err) {
        alert("Update failed: " + err.message);
      }
    });

  } catch (err) {
    console.error(err);
    alert("Failed to load product details");
  }
};

window.closeEditModal = () => {
  const modal = document.getElementById('edit-modal');
  if (modal) modal.parentElement.remove();
};

// ====================== ADD PRODUCT ======================
const addForm = document.getElementById('add-product-form');
if (addForm) {
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newProduct = {
      name: document.getElementById('add-name')?.value.trim() || '',
      price: Number(document.getElementById('add-price')?.value) || 0,
      discount: Number(document.getElementById('add-discount')?.value) || 0,
      images: (document.getElementById('add-images')?.value || '').split(',').map(u => u.trim()).filter(Boolean),
      category: document.getElementById('add-category')?.value || '',
      stock: Number(document.getElementById('add-stock')?.value) || 0,
      availability: document.getElementById('add-availability')?.value || 'Ready',
      hotDeal: document.getElementById('add-hotdeal')?.checked || false,
      description: document.getElementById('add-desc')?.value.trim() || '',
      detailedDescription: document.getElementById('add-detailed-desc')?.value.trim() || ''
    };

    try {
      await addDoc(collection(db, 'products'), newProduct);
      alert("✅ Product added successfully!");
      e.target.reset();
      renderProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to add product: " + err.message);
    }
  });
}

// ====================== ORDERS ======================
async function renderOrders() {
  const container = document.getElementById('orders-body');
  if (!container) return;
  container.innerHTML = '';

  try {
    const q = query(collection(db, 'orders'), orderBy('timeISO', 'desc'));
    const snapshot = await getDocs(q);

    snapshot.forEach(docSnap => {
      const o = docSnap.data();
      const div = document.createElement('div');
      div.className = "p-5 bg-surface-container-lowest rounded-2xl flex justify-between items-center";
      div.innerHTML = `
        <div>
          <p class="font-medium">${o.customerName || 'Customer'}</p>
          <p class="text-xs text-slate-400">${o.timeISO ? new Date(o.timeISO).toLocaleString() : ''}</p>
        </div>
        <div class="text-right">
          <p class="font-bold text-lg">৳${o.total || 0}</p>
          <p class="text-xs ${o.status === 'Delivered' ? 'text-green-400' : 'text-amber-400'}">${o.status || 'Pending'}</p>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading orders:", err);
    container.innerHTML = `<p class="text-slate-400">Failed to load orders</p>`;
  }
}
