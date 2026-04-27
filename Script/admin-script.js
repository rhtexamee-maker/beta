// Script/admin-script.js - Non-module version for reliability

// Initialize Firebase (global variables)
const firebaseConfig = { /* Paste your firebaseConfig here from config.js */ };

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Login Form
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('admin-email').value;
  const pass = document.getElementById('admin-pass').value;

  try {
    await auth.signInWithEmailAndPassword(email, pass);
  } catch (err) {
    alert('Login failed: ' + err.message);
  }
});

window.logoutAdmin = () => {
  auth.signOut().then(() => location.reload());
};

// Auth State Listener
auth.onAuthStateChanged((user) => {
  if (user) {
    document.getElementById('login-panel').classList.add('hidden');
    document.getElementById('admin-panel').classList.remove('hidden');
    loadAdminData();
  } else {
    document.getElementById('login-panel').classList.remove('hidden');
    document.getElementById('admin-panel').classList.add('hidden');
  }
});

async function loadAdminData() {
  renderProducts();
  renderOrders();
}

// Render Products with Editable Fields
async function renderProducts() {
  const tbody = document.getElementById('products-body');
  tbody.innerHTML = '';

  const snapshot = await db.collection('products').get();
  snapshot.forEach(docSnap => {
    const p = { id: docSnap.id, ...docSnap.data() };

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-8 py-6"><div contenteditable="true" class="product-name">${p.name || ''}</div></td>
      <td class="px-8 py-6">${p.category || ''}</td>
      <td class="px-8 py-6 text-right"><div contenteditable="true" class="product-price">${p.price || 0}</div></td>
      <td class="px-8 py-6 text-right"><div contenteditable="true" class="product-discount">${p.discount || 0}</div></td>
      <td class="px-8 py-6 text-right"><div contenteditable="true" class="product-stock">${p.stock || 0}</div></td>
      <td class="px-8 py-6">
        <button onclick="deleteProduct('${p.id}')" class="text-red-400 hover:text-red-500">Delete</button>
      </td>
    `;

    // Save on blur
    tr.querySelectorAll('[contenteditable="true"]').forEach(el => {
      el.addEventListener('blur', async () => {
        const field = el.className.split('-')[1];
        let value = el.textContent.trim();
        if (field === 'price' || field === 'discount' || field === 'stock') value = Number(value);
        await db.collection('products').doc(p.id).update({ [field]: value });
      });
    });

    tbody.appendChild(tr);
  });
}

window.deleteProduct = async (id) => {
  if (confirm("Delete this product?")) {
    await db.collection('products').doc(id).delete();
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
    await db.collection('products').add(data);
    alert('Product added successfully!');
    e.target.reset();
    renderProducts();
  } catch (err) {
    alert('Error: ' + err.message);
  }
});

// Render Orders
async function renderOrders() {
  const container = document.getElementById('orders-body');
  container.innerHTML = '';

  const snapshot = await db.collection('orders').orderBy('timeISO', 'desc').get();
  snapshot.forEach(docSnap => {
    const o = docSnap.data();
    const div = document.createElement('div');
    div.className = "p-4 bg-surface-container-lowest rounded-xl flex justify-between items-center";
    div.innerHTML = `
      <div>
        <p class="font-medium">${o.customerName || 'Customer'}</p>
        <p class="text-xs text-slate-400">${o.timeISO ? new Date(o.timeISO).toLocaleString() : ''}</p>
      </div>
      <div class="text-right">
        <p class="font-bold">৳${o.total || 0}</p>
        <p class="text-xs ${o.status === 'Delivered' ? 'text-green-400' : 'text-yellow-400'}">${o.status || 'Pending'}</p>
      </div>
    `;
    container.appendChild(div);
  });
}
