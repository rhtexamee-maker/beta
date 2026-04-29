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

const statusFlow = ["Pending", "Processing", "Dispatched", "Delivered"];

const form = document.getElementById("status-form");
const input = document.getElementById("phone-input");
const grid = document.getElementById("results-grid");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const phone = input.value.trim();
  if (!phone) return;

  grid.innerHTML = loadingUI();

  try {
    const q = query(
      collection(db, "orders"),
      where("phone", "==", phone),
      orderBy("timeISO", "desc")
    );

    const snap = await getDocs(q);

    grid.innerHTML = "";

    if (snap.empty) {
      grid.innerHTML = emptyUI(phone);
      return;
    }

    snap.forEach(doc => {
      const order = { id: doc.id, ...doc.data() };
      grid.appendChild(buildCard(order));
    });

  } catch (err) {
    console.error(err);
    grid.innerHTML = errorUI();
  }
});

/* ===========================
   CARD BUILDER (MAIN)
=========================== */
function buildCard(order) {
  const card = document.createElement("div");

  const currentIndex = statusFlow.indexOf(order.status || "Pending");
  const isDelivered = order.status === "Delivered";
  const isDispatched = order.status === "Dispatched";

  const theme = isDelivered ? "primary" : "secondary";

  card.className = `
    bg-surface-container-low/30 border border-white/5 p-8 flex flex-col
    relative group overflow-hidden transition-all
    ${isDelivered ? "hover:border-primary/20" : "hover:border-secondary/20"}
  `;

  card.innerHTML = `
  <!-- HEADER -->
  <div class="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
    <div>
      <div class="text-[10px] text-outline uppercase tracking-widest font-bold mb-1">ENTRY_ID</div>
      <div class="text-lg font-bold text-on-surface">#${order.id.slice(-8).toUpperCase()}</div>
      <div class="text-[11px] text-outline uppercase mt-1">
        ${formatDate(order.timeISO)}
      </div>
    </div>

    <div class="inline-flex items-center gap-2 px-4 py-2 border text-[10px] font-bold uppercase tracking-widest
      ${isDelivered
        ? "border-primary/20 bg-primary/5 text-primary"
        : "border-secondary/20 bg-secondary/5 text-secondary"}">

      <span class="w-2 h-2 rounded-full ${isDelivered ? "bg-primary animate-pulse" : "bg-secondary"}"></span>
      ${order.status || "Pending"}
    </div>
  </div>

  <!-- PRODUCT -->
  <div class="flex gap-6 mb-8">
    <div class="w-24 h-24 bg-surface-container-highest relative overflow-hidden border border-white/5">
      <img src="${order.image || fallbackImage()}"
           class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"/>
      <div class="absolute inset-0 opacity-40"
        style="background-image: linear-gradient(rgba(236,215,255,0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(236,215,255,0.1) 1px, transparent 1px);
               background-size: 8px 8px;">
      </div>
    </div>

    <div class="flex flex-col justify-center">
      <h3 class="text-xl font-bold">${order.productName || "Product"}</h3>
      <p class="text-[10px] text-outline uppercase tracking-widest">
        ${order.color || ""} • Qty ${order.quantity || 1}
      </p>
    </div>
  </div>

  <!-- PROGRESS -->
  ${progressBar(currentIndex, theme)}

  <!-- FINANCIAL -->
  <div class="bg-surface-container-lowest border border-white/5 p-5 flex justify-between items-center">
    <div class="flex gap-10">
      <div>
        <div class="text-[9px] text-outline uppercase mb-1">PAID</div>
        <div class="text-lg font-bold">৳${order.paid || 0}</div>
      </div>

      <div>
        <div class="text-[9px] text-outline uppercase mb-1">DUE</div>
        <div class="text-lg font-bold">৳${order.due || 0}</div>
      </div>
    </div>

    <div class="text-right">
      <div class="text-[9px] uppercase mb-1 ${theme === "primary" ? "text-primary" : "text-secondary"}">
        TOTAL
      </div>
      <div class="text-2xl font-bold ${theme === "primary" ? "text-primary" : "text-secondary"}">
        ৳${order.total || 0}
      </div>
    </div>
  </div>
  `;

  return card;
}

/* ===========================
   PROGRESS BAR (CINEMATIC)
=========================== */
function progressBar(currentIndex, theme) {
  const progressWidth = ((currentIndex + 1) / statusFlow.length) * 100;

  return `
  <div class="mb-10 relative">
    <div class="absolute h-0.5 w-full bg-surface-container-high top-3"></div>

    <div class="absolute h-0.5 top-3"
      style="width:${progressWidth}%;
             background:${theme === "primary" ? "#ecd7ff" : "#c4c5db"}">
    </div>

    <div class="flex justify-between relative z-10">
      ${statusFlow.map((status, i) => {
        const active = i <= currentIndex;

        return `
        <div class="flex flex-col items-center gap-2">
          <div class="w-6 h-6 flex items-center justify-center
            ${active
              ? `bg-${theme} ${theme === "primary" ? "text-black" : "text-black"}`
              : "bg-surface-container-low border border-outline"}
          ">
            ${active ? "✓" : ""}
          </div>

          <span class="text-[9px] uppercase ${
            active
              ? (theme === "primary" ? "text-primary" : "text-secondary")
              : "text-outline"
          }">
            ${status}
          </span>
        </div>`;
      }).join("")}
    </div>
  </div>
  `;
}

/* ===========================
   HELPERS
=========================== */

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function fallbackImage() {
  return "https://via.placeholder.com/100x100?text=ITEM";
}

function loadingUI() {
  return `
  <div class="col-span-2 text-center py-20">
    <span class="material-symbols-outlined text-6xl text-primary animate-pulse">radar</span>
    <p class="mt-6 text-lg">SYNCHRONIZING...</p>
  </div>`;
}

function emptyUI(phone) {
  return `
  <div class="col-span-2 text-center py-20">
    <p>No records found for ${phone}</p>
  </div>`;
}

function errorUI() {
  return `
  <div class="col-span-2 text-center py-20 text-red-400">
    Error loading orders
  </div>`;
}
