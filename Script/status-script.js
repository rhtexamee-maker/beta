// Script/status-script.js
// Updated for the new Logistics Terminal design

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { firebaseConfig } from '../config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const statusOrder = ['Pending', 'Processing', 'Dispatched', 'Delivered', 'Cancelled'];

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
    <div class="text-center py-20">
      <span class="material-symbols-outlined text-6xl text-primary animate-pulse">radar</span>
      <p class="mt-6 text-on-surface-variant text-lg">SYNCHRONIZING WITH LATTICE...</p>
      <p class="text-xs text-outline mt-2">QUERYING SHIPMENT METADATA</p>
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
        <div class="bg-surface-container-low/50 border border-white/10 rounded-3xl p-16 text-center">
          <span class="material-symbols-outlined text-7xl text-slate-500 mb-6 block">search_off</span>
          <h3 class="text-2xl font-headline mb-3">NO RECORDS FOUND</h3>
          <p class="text-on-surface-variant">No orders found for phone number <span class="font-mono">${phone}</span></p>
        </div>`;
      return;
    }

    snapshot.forEach(docSnap => {
      const order = { id: docSnap.id, ...docSnap.data() };
      const isCancelled = order.status === 'Cancelled';
      const currentIndex = statusOrder.indexOf(order.status || 'Pending');

      // Build items list
      let itemsHTML = '';
      if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        order.items.forEach(item => {
          itemsHTML += `
            <div class="flex justify-between items-center py-4 border-b border-white/5 last:border-none">
              <div class="flex-1">
                <p class="font-medium">${item.productName || 'Product'}</p>
                <p class="text-xs text-on-surface-variant">${item.color || ''} • Qty: ${item.quantity || 1}</p>
              </div>
              <p class="font-mono text-sm">৳${(item.unitPrice || 0) * (item.quantity || 1)}</p>
            </div>`;
        });
      } else {
        // Legacy support
        itemsHTML = `
          <div class="flex justify-between items-center py-4 border-b border-white/5">
            <div>
              <p class="font-medium">${order.productName || 'Product'}</p>
              <p class="text-xs text-on-surface-variant">${order.color || ''} • Qty: ${order.quantity || 1}</p>
            </div>
            <p class="font-mono text-sm">৳${order.total || 0}</p>
          </div>`;
      }

      // Status Timeline
      let timelineHTML = '';
      statusOrder.forEach((status, i) => {
        const isCompleted = i < currentIndex && !isCancelled;
        const isCurrent = i === currentIndex && !isCancelled;
        const isCancelledStatus = status === 'Cancelled' && isCancelled;

        let dotClass = 'bg-surface-container-high';
        let textClass = 'text-on-surface-variant';

        if (isCancelledStatus) {
          dotClass = 'bg-red-500';
          textClass = 'text-red-400';
        } else if (isCompleted || isCurrent) {
          dotClass = 'bg-green-500';
          textClass = isCurrent ? 'text-green-400 font-medium' : 'text-green-400';
        }

        timelineHTML += `
          <div class="flex items-center gap-4">
            <div class="w-5 h-5 rounded-full ${dotClass} flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
              ${isCancelledStatus ? '✕' : (isCompleted || isCurrent ? '✓' : '')}
            </div>
            <span class="${textClass}">${status}</span>
          </div>`;
      });

      const card = document.createElement('div');
      card.className = `bg-surface-container-low/70 border border-white/10 rounded-3xl p-8 scanner-glow`;

      card.innerHTML = `
        <div class="flex justify-between items-start mb-8">
          <div>
            <div class="text-xs uppercase tracking-widest text-outline mb-1">ENTRY_ID</div>
            <div class="font-mono text-xl font-bold text-primary">#${order.id.slice(-8).toUpperCase()}</div>
            <div class="text-xs text-on-surface-variant mt-1">${new Date(order.timeISO).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
          </div>
          
          <div class="text-right">
            <span class="inline-block px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest
              ${isCancelled ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-green-500/10 text-green-400 border border-green-500/30'}">
              ${order.status || 'Pending'}
            </span>
          </div>
        </div>

        <!-- Order Items -->
        <div class="mb-10">
          ${itemsHTML}
        </div>

        <!-- Financials -->
        <div class="grid grid-cols-3 gap-6 mb-10 border-t border-white/10 pt-8">
          <div>
            <div class="text-xs text-outline uppercase tracking-widest">PAID</div>
            <div class="text-2xl font-headline font-bold">৳${order.paid || 0}</div>
          </div>
          <div>
            <div class="text-xs text-outline uppercase tracking-widest">DUE</div>
            <div class="text-2xl font-headline font-bold ${order.due > 0 ? 'text-red-400' : ''}">৳${order.due || 0}</div>
          </div>
          <div>
            <div class="text-xs text-outline uppercase tracking-widest">TOTAL</div>
            <div class="text-2xl font-headline font-bold text-primary">৳${order.total || 0}</div>
          </div>
        </div>

        <!-- Progress Timeline -->
        <div>
          <div class="text-xs uppercase tracking-widest text-outline mb-6">SHIPMENT PROGRESS</div>
          <div class="space-y-6">
            ${timelineHTML}
          </div>
        </div>
      `;

      resultContainer.appendChild(card);
      resultContainer.appendChild(document.createElement('div')).className = 'h-8';
    });

  } catch (error) {
    console.error(error);
    resultContainer.innerHTML = `
      <div class="bg-red-500/10 border border-red-500/30 rounded-3xl p-16 text-center">
        <p class="text-red-400 font-medium">Failed to fetch orders. Please try again later.</p>
      </div>`;
  }
});
