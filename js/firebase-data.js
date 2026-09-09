import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore, collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBpANZuxKAqjOmoFFimX6A25fDbUZ_ikvQ",
  authDomain: "iziekszer.firebaseapp.com",
  projectId: "iziekszer",
  storageBucket: "iziekszer.firebasestorage.app",
  messagingSenderId: "48329057382",
  appId: "1:48329057382:web:5dad043d8f860df3f7f9a7",
  measurementId: "G-QRVBJGEHRN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function esemenyKartya(e, isPast) {
  const d = new Date(e.datum);
  const honap = d.toLocaleDateString("hu-HU", { month: "long" });
  const honapNagybetu = honap.charAt(0).toUpperCase() + honap.slice(1);
  const nap = d.getDate();
  const napNeve = d.toLocaleDateString("hu-HU", { weekday: "long" });
  const cardInner = `
    <div class="card event-card${isPast ? ' korabbi' : ''}${e.url ? ' event-card--link' : ''}">
      <div class="card-body">
        <h5 class="card-title"><i class="bi bi-calendar-event me-2" style="color: var(--color-gold)"></i>${e.cim}${e.url ? ' <i class="bi bi-box-arrow-up-right event-card-ext" title="Megnyitás"></i>' : ''}</h5>
        <p class="text-muted">${honapNagybetu} ${nap}. ${napNeve} – ${e.helyszin}</p>
      </div>
    </div>`;
  return `
    <div class="col-md-6 col-lg-4">
      ${e.url ? `<a href="${e.url}" target="_blank" rel="noopener noreferrer" class="event-card-anchor">${cardInner}</a>` : cardInner}
    </div>`;
}

async function loadEsemenyek() {
  const container = document.getElementById("esemenyek-container");
  if (!container) return;

  const ma = new Date();
  ma.setHours(0, 0, 0, 0);

  const q = query(collection(db, "esemenyek"), orderBy("datum", "desc"));
  const snap = await getDocs(q);
  const esemenyek = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  const kozelgo = esemenyek.filter(e => new Date(e.datum) >= ma).reverse();
  const korabbi = esemenyek.filter(e => new Date(e.datum) < ma).slice(0, 3);

  let html = "";
  if (kozelgo.length) {
    html += `<h5 class="mt-3 mb-3 text-muted">Közelgő</h5><div class="row g-4">${kozelgo.map(e => esemenyKartya(e, false)).join("")}</div>`;
  }
  if (korabbi.length) {
    html += `<h5 class="mt-4 mb-3 text-muted">Korábbi</h5><div class="row g-4">${korabbi.map(e => esemenyKartya(e, true)).join("")}</div>`;
  }

  container.innerHTML = html;
}

async function loadArak() {
  const snap = await getDocs(collection(db, "arak"));
  snap.forEach(d => {
    const el = document.querySelector(`[data-ar-id="${d.id}"]`);
    if (el && d.data().ar !== undefined) {
      el.textContent = d.data().ar.toLocaleString("hu-HU") + " Ft";
    }
  });
}

loadEsemenyek();
loadArak();
