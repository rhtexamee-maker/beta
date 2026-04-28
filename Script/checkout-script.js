// Script/checkout-script.js
// Dedicated script for the new checkout page

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, runTransaction } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { firebaseConfig, BKASH_NUMBER, COD_NUMBER, DELIVERY_FEE } from '../config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let cartItems = [];
let deliveryFee = 0;

// ====================== UTILS ======================
function getCart() {
  const cart = localStorage.getItem('cart');
  return cart ? JSON.parse(cart) : [];
}

function calculateDeliveryFee(address) {
  if (!address) return DELIVERY_FEE || 110;
  const lower = address.toLowerCase();
  if (lower.includes("savar")) return 70;
  if (lower.includes("dhaka")) return 110;
  return 150;
}

function updateOrderSummary() {
  const subtotalEl = document.getElementById('subtotal');
  const deliveryEl = document.getElementById('delivery-fee');
  const totalEl = document.getElementById('grand-total');
  const itemsContainer = document.getElementById('order-items');

  if (!itemsContainer) return;

  itemsContainer.innerHTML = '';

  let subtotal = 0;

  cartItems.forEach(item => {
    const itemTotal = item.price * item.qty;
    subtotal += itemTotal;

    const div = document.createElement('div');
    div.className = "flex gap-4 items-center";
    div.innerHTML = `
      <div class="w-16 h-16 bg-surface-container-highest rounded-xl overflow-hidden flex-shrink-0">
        <img src="${item.image || ''}" class="w-full h-full object-cover" onerror="this.style.display='none'">
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-medium text-sm line-clamp-1">${item.name}</p>
        <p class="text-xs text-on-surface-variant">${item.color || ''} × ${item.qty}</p>
      </div>
      <div class="text-right font-mono text-sm">
        ৳${itemTotal}
      </div>
    `;
    itemsContainer.appendChild(div);
  });

  const address = document.getElementById('co-address')?.value || '';
  deliveryFee = calculateDeliveryFee(address);

  const total = subtotal + deliveryFee;

  if (subtotalEl) subtotalEl.textContent = `৳${subtotal}`;
  if (deliveryEl) deliveryEl.textContent = `৳${deliveryFee}`;
  if (totalEl) totalEl.textContent = `৳${total}`;
}

// ====================== PAYMENT SELECTION ======================
window.selectPayment = (method) => {
  const bkashBtn = document.getElementById('bkash-btn');
  const codBtn = document.getElementById('cod-btn');
  const paymentDetails = document.getElementById('payment-details');
  const paymentLabel = document.getElementById('payment-label');
  const paymentNumber = document.getElementById('co-payment-number');

  if (method === 'bkash') {
    bkashBtn.classList.add('border-primary', 'bg-primary/10');
    codBtn.classList.remove('border-primary', 'bg-primary/10');
    paymentLabel.textContent = "bKash Number";
    paymentNumber.value = BKASH_NUMBER || "01960902526";
  } else if (method === 'cod') {
    codBtn.classList.add('border-primary', 'bg-primary/10');
    bkashBtn.classList.remove('border-primary', 'bg-primary/10');
    paymentLabel.textContent = "Cash on Delivery";
    paymentNumber.value = COD_NUMBER || "01960902526";
  }

  paymentDetails.classList.remove('hidden');
};

// ====================== PLACE ORDER ======================
window.placeOrder = async () => {
  const name = document.getElementById('co-name')?.value.trim();
  const phone = document.getElementById('co-phone')?.value.trim();
  const address = document.getElementById('co-address')?.value.trim();
  const paymentMethod = document.querySelector('.payment-option.border-primary') ? 
                       (document.getElementById('bkash-btn').classList.contains('border-primary') ? 'Bkash' : 'Cash on Delivery') : '';

  if (!name || !phone || !address || !paymentMethod) {
    alert("Please fill all required fields");
    return;
  }

  const btn = document.querySelector('button[onclick="placeOrder()"]');
  if (btn) btn.disabled = true;

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const total = subtotal + deliveryFee;

  const orderData = {
    timeISO: new Date().toISOString(),
    customerName: name,
    phone: phone,
    address: address,
    paymentMethod: paymentMethod,
    deliveryFee: deliveryFee,
    subtotal: subtotal,
    total: total,
    status: 'Pending',
    items: cartItems.map(item => ({
      productId: item.id,
      productName: item.name,
      color: item.color || '',
      unitPrice: item.price,
      quantity: item.qty
    }))
  };

  try {
    // Use transaction to reduce stock
    await runTransaction(db, async (transaction) => {
      for (const item of cartItems) {
        const productRef = doc(db, 'products', item.id);
        const productSnap = await transaction.get(productRef);

        if (productSnap.exists()) {
          const data = productSnap.data();
          const currentStock = Number(data.stock);

          if (currentStock !== -1 && data.availability !== 'Pre Order' && currentStock < item.qty) {
            throw new Error(`Not enough stock for ${item.name}`);
          }

          if (currentStock !== -1 && data.availability !== 'Pre Order') {
            transaction.update(productRef, { stock: currentStock - item.qty });
          }
        }
      }

      // Create order
      const newOrderRef = doc(collection(db, 'orders'));
      transaction.set(newOrderRef, orderData);
    });

    alert("✅ Order placed successfully!");
    
    // Clear cart
    localStorage.removeItem('cart');
    
    // Redirect to order status or thank you page
    window.location.href = "status.html";

  } catch (err) {
    console.error(err);
    alert("Failed to place order: " + err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
};

// ====================== INIT ======================
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c✅ Checkout Page Loaded', 'color:#c084fc; font-weight:bold');

  // Load cart
  cartItems = getCart();

  if (cartItems.length === 0) {
    alert("Your cart is empty. Redirecting to shop...");
    window.location.href = "products.html";
    return;
  }

  updateOrderSummary();

  // Auto update delivery fee when address changes
  const addressField = document.getElementById('co-address');
  if (addressField) {
    addressField.addEventListener('input', () => {
      updateOrderSummary();
    });
  }

  // Default payment method
  selectPayment('bkash');
});
