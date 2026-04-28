// Script/status-script.js
// Dedicated script for the new Logistics Terminal (status.html)

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { firebaseConfig } from '../config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const statusOrder = ['Pending', 'Processing', 'Dispatched', 'Delivered', 'Cancelled'];

const statusColors = {
  Pending: '#eab308',
  Processing: '#3b82f6',
  Dispatched: '#eab308',
  Delivered: '#22c55e',
  Cancelled: '#ef4444'
};

// ====================== MAIN STATUS LOOKUP ======================
document.getElementById('status-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const phoneInput = document.getElementById('phone-input');
  const phone = phoneInput.value.trim();

  if (!phone) {
    alert("Please enter your phone number");
    return;
  }

  const resultContainer = document.getElementById('order-result');
  resultContainer.innerHTML = `
    <div class="text-center py-12">
      <span class="material-symbols-outlined text-4xl text-primary animate-pulse">hourglass_top</span>
      <p class="mt-4 text-on-surface-variant">Querying logistics database...</p>
    </div>`;

  try {
    const q = query(
      collection(db, 'orders'), 
      where('phone', '==', phone),
      orderBy('timeISO', 'desc')
    );

    const snapshot = await getDocs(q);

    resultContainer.innerHTML = '';

    if (snapshot.empty) {
      resultContainer.innerHTML = `
        <div class="bg-surface-container-low rounded-3xl p-12 text-center">
          <span class="material-symbols-outlined text-6xl text-slate-400 mb-6 block">search_off</span>
          <h3 class="text-xl font-medium mb-2">No orders found</h3>
          <p class="text-on-surface-variant">We couldn't find any orders associated with <strong>${phone}</strong></p>
        </div>`;
      return;
    }

    const ordersHTML = [];

    snapshot.forEach(docSnap => {
      const order = { id: docSnap.id, ...docSnap.data() };
      const isCancelled = order.status === 'Cancelled';
      const currentStatusIndex = statusOrder.indexOf(order.status || 'Pending');

      let itemsHTML = '';

      if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        order.items.forEach(item => {
          itemsHTML += `
            <div class="flex justify-between py-3 border-b border-white/5 last:border-0">
              <div>
                <p class="font-medium">${item.productName}</p>
                <p class="text-xs text-on-surface-variant">${item.color || ''} × ${item.quantity}</p>
              </div>
              <p class="font-mono text-sm">৳${(item.unitPrice * item.quantity).toFixed(0)}</p>
            </div>`;
        });
      } else {
        // Legacy single product order
        itemsHTML = `
          <div class="flex justify-between py-3 border-b border-white/5">
            <div>
              <p class="font-medium">${order.productName || 'Product'}</p>
              <p class="text-xs text-on-surface-variant">${order.color || ''} × ${order.quantity || 1}</p>
            </div>
            <p class="font-mono text-sm">৳${order.total || 0}</p>
          </div>`;
      }

      const statusTimeline = statusOrder.map((status, index) => {
        const isCompleted = index < currentStatusIndex && !isCancelled;
        const isCurrent = index === currentStatusIndex && !isCancelled;
        const isCancelledStatus = status === 'Cancelled' && isCancelled;

        let circleClass = 'bg-surface-container-high text-on-surface-variant';
        let textClass = 'text-on-surface-variant';

        if (isCancelledStatus) {
          circleClass = 'bg-red-500 text-white';
          textClass = 'text-red-400';
        } else if (isCompleted || isCurrent) {
          circleClass = 'bg-green-500 text-white';
          textClass = 'text-green-400';
        }

        return `
          <div class="flex items-center gap-4">
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${circleClass}">
              ${isCancelledStatus ? '✕' : (isCompleted || isCurrent ? '✓' : '')}
            </div>
            <span class="${textClass} font-medium">${status}</span>
          </div>`;
      }).join('');

      const cardHTML = `
        <div class="bg-surface-container-low rounded-3xl p-8 border border-white/5">
          <div class="flex justify-between items-start mb-8">
            <div>
              <div class="text-xs uppercase tracking-widest text-on-surface-variant">Order ID</div>
              <div class="font-mono font-bold text-lg text-primary">#${order.id.slice(-8).toUpperCase()}</div>
            </div>
            <div class="text-right">
              <div class="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest
                ${isCancelled ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}">
                ${order.status || 'Pending'}
              </div>
              <div class="text-xs text-on-surface-variant mt-2">
                ${new Date(order.timeISO).toLocaleDateString('en-GB')}
              </div>
            </div>
          </div>

          <!-- Items -->
          <div class="mb-10">
            ${itemsHTML}
          </div>

          <!-- Financial Summary -->
          <div class="grid grid-cols-3 gap-4 mb-10">
            <div>
              <div class="text-xs text-on-surface-variant">PAID</div>
              <div class="font-mono font-bold text-lg">৳${order.paid || 0}</div>
            </div>
            <div>
              <div class="text-xs text-on-surface-variant">DUE</div>
              <div class="font-mono font-bold text-lg ${order.due > 0 ? 'text-red-400' : ''}">৳${order.due || 0}</div>
            </div>
            <div>
              <div class="text-xs text-on-surface-variant">TOTAL</div>
              <div class="font-mono font-bold text-lg">৳${order.total || 0}</div>
            </div>
          </div>

          <!-- Status Timeline -->
          <div class="pt-6 border-t border-white/10">
            <div class="text-xs uppercase tracking-widest text-on-surface-variant mb-6">Shipment Progress</div>
            <div class="space-y-6">
              ${statusTimeline}
            </div>
          </div>
        </div>`;

      ordersHTML.push(cardHTML);
    });

    resultContainer.innerHTML = ordersHTML.join('<div class="h-8"></div>');

  } catch (err) {
    console.error(err);
    resultContainer.innerHTML = `
      <div class="bg-red-500/10 border border-red-500/30 rounded-3xl p-12 text-center">
        <p class="text-red-400">Error retrieving orders. Please try again.</p>
      </div>`;
  }
});
