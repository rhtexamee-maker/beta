import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { firebaseConfig } from "../config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const statusOrder = ["Pending", "Processing", "Dispatched", "Delivered"];

document.getElementById("status-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const phone = document.getElementById("phone-input").value.trim();
  const container = document.getElementById("order-result");

  container.innerHTML = `<p class="text-primary">Loading...</p>`;

  try {
    const q = query(
      collection(db, "orders"),
      where("phone", "==", phone),
      orderBy("timeISO", "desc")
    );

    const snapshot = await getDocs(q);
    container.innerHTML = "";

    if (snapshot.empty) {
      container.innerHTML = `<p>No orders found</p>`;
      return;
    }

    snapshot.forEach(docSnap => {
      const order = { id: docSnap.id, ...docSnap.data() };

      const currentIndex = statusOrder.indexOf(order.status || "Pending");

      const progressWidth = (currentIndex / (statusOrder.length - 1)) * 100;

      const item = order.items?.[0] || {};

      const card = document.createElement("div");

      card.className = "bg-surface-container-low/30 border border-white/5 p-8";

      card.innerHTML = `
        <div class="flex justify-between mb-6 border-b border-white/5 pb-4">
          <div>
            <div class="text-xs text-outline">ENTRY_ID</div>
            <div class="font-bold">#${order.id.slice(-8)}</div>
          </div>
          <div class="text-primary">${order.status}</div>
        </div>

        <div class="flex gap-4 mb-6">
          <img src="${item.image || 'https://via.placeholder.com/100'}" class="w-20 h-20 object-cover">
          <div>
            <h3 class="font-bold">${item.productName || 'Product'}</h3>
            <p>${item.color || ''}</p>
          </div>
        </div>

        <div class="relative mb-6">
          <div class="h-1 bg-gray-700"></div>
          <div class="h-1 bg-primary absolute top-0" style="width:${progressWidth}%"></div>
        </div>

        <div class="flex justify-between text-sm">
          <span>৳${order.paid || 0}</span>
          <span>৳${order.total || 0}</span>
        </div>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = `<p>Error loading orders</p>`;
  }
});
