import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, doc, orderBy, query } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

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
  const vanReszletek = !isPast && !!e.regisztracioSzukseges;
  const kulsoLink = !!e.url && !vanReszletek;
  const cardInner = `
    <div class="card event-card${isPast ? ' korabbi' : ''}${kulsoLink ? ' event-card--link' : ''}">
      <div class="card-body">
        <h5 class="card-title"><i class="bi bi-calendar-event me-2" style="color: var(--color-gold)"></i>${e.cim}${kulsoLink ? ' <i class="bi bi-box-arrow-up-right event-card-ext" title="Megnyitás"></i>' : ''}</h5>
        <p class="text-muted">${honapNagybetu} ${nap}. ${napNeve} – ${e.helyszin}</p>
        ${vanReszletek ? `<a href="esemeny.html?id=${e.id}" class="btn btn-gold btn-sm mt-2">Részletek és regisztráció</a>` : ''}
      </div>
    </div>`;
  return `
    <div class="col-md-6 col-lg-4">
      ${kulsoLink ? `<a href="${e.url}" target="_blank" rel="noopener noreferrer" class="event-card-anchor">${cardInner}</a>` : cardInner}
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

function textToHtml(text) {
  return text
    .split(/\n\n+/)
    .map(para => `<p>${para.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

async function loadPromo() {
  try {
    const snap = await getDoc(doc(db, "settings", "esemeny_promo"));
    console.log("[promo] exists:", snap.exists(), snap.data());
    if (!snap.exists()) return;
    const data = snap.data();
    if (!data.title && !data.body && !data.slogan) return;
    const box = document.getElementById("esemeny-promo-box");
    const titleEl = document.getElementById("esemeny-promo-title");
    const bodyEl = document.getElementById("esemeny-promo-body");
    const sloganEl = document.getElementById("esemeny-promo-slogan");
    const kepEl = document.getElementById("esemeny-promo-kep");
    const kepWrap = document.getElementById("esemeny-promo-kep-wrap");
    if (titleEl) titleEl.textContent = data.title || "";
    if (bodyEl) bodyEl.innerHTML = data.body ? textToHtml(data.body) : "";
    if (sloganEl) sloganEl.textContent = data.slogan || "";
    if (kepEl && kepWrap && data.kepUrl) {
      kepEl.src = data.kepUrl;
      kepWrap.style.display = "";
    }
    if (box) box.style.display = "";
    console.log("[promo] megjelenítve");
  } catch (e) {
    console.error("[promo] hiba:", e);
  }
}

function resolveKepSrc(kep, legacyPicPath) {
  if (!kep) return "";
  return kep.startsWith("http") ? kep : legacyPicPath + kep;
}

function kepLista(t, legacyPicPath) {
  const nyers = (t.kepek && t.kepek.length) ? t.kepek : (t.kep ? [t.kep] : []);
  return nyers.map(k => resolveKepSrc(k, legacyPicPath));
}

window.__termekAdatok = { termekek: [], charm: [] };

window.mutassTermek = function (lista, idx) {
  const t = window.__termekAdatok[lista][idx];
  if (!t) return;
  const picPath = lista === "termekek" ? "pics/ekszerek/" : "pics/charmbar/";
  const isEkszer = lista === "termekek";
  const arStr = t.ar !== undefined ? t.ar.toLocaleString("hu-HU") + " Ft" : "";
  openProductModal(
    kepLista(t, picPath), t.nev, t.nev, t.anyag || "", arStr,
    { kategoriak: t.kategoriak, meret: t.meret, suly: isEkszer ? t.suly : undefined, leiras: isEkszer ? t.leiras : undefined, keszlet: isEkszer ? t.keszlet : undefined }
  );
};

function termekKartya(t, picPath, idx, lista, isEkszer) {
  const arStr = t.ar !== undefined ? t.ar.toLocaleString("hu-HU") + " Ft" : "";
  const elfogyott = isEkszer && t.keszlet === 0;
  const kategoriaBadgek = (t.kategoriak || []).map(k => `<span class="product-kategoria-badge">${k}</span>`).join("");
  const borito = kepLista(t, picPath)[0];
  return `
    <div class="col-6 col-md-4 col-lg-3">
      <div class="card product-card" style="cursor:pointer" onclick="mutassTermek('${lista}', ${idx})">
        <div style="position:relative">
          ${borito ? `<img src="${borito}" class="card-img-top" alt="${t.nev}">` : ''}
          ${elfogyott ? `<span class="product-badge-elfogyott">Elfogyott</span>` : ''}
        </div>
        <div class="card-body text-center">
          ${kategoriaBadgek ? `<div class="product-kategoriak">${kategoriaBadgek}</div>` : ''}
          <h6 class="card-title">${t.nev}</h6>
          ${t.anyag ? `<p class="text-muted small mb-1">${t.anyag}</p>` : ''}
          ${t.ar !== undefined ? `<p class="price">${arStr}</p>` : ''}
        </div>
      </div>
    </div>`;
}

async function loadTermekek() {
  const container = document.getElementById("termekek-container");
  const teaserImg = document.getElementById("ekszer-teaser-kep");
  if (!container && !teaserImg) return;
  const snap = await getDocs(collection(db, "termekek"));
  const termekek = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  termekek.sort((a, b) => (a.sorrend || 0) - (b.sorrend || 0));
  window.__termekAdatok.termekek = termekek;
  if (container) {
    container.innerHTML = termekek.length
      ? termekek.map((t, i) => termekKartya(t, "pics/ekszerek/", i, "termekek", true)).join("")
      : `<p class="text-muted">Hamarosan...</p>`;
  }
  if (teaserImg && termekek.length) {
    const borito = kepLista(termekek[0], "pics/ekszerek/")[0];
    if (borito) teaserImg.src = borito;
  }
}

async function loadCharmTermekek() {
  const container = document.getElementById("charm-container");
  const teaserImg = document.getElementById("charm-teaser-kep");
  if (!container && !teaserImg) return;
  const snap = await getDocs(collection(db, "charm_termekek"));
  const termekek = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  termekek.sort((a, b) => (a.sorrend || 0) - (b.sorrend || 0));
  window.__termekAdatok.charm = termekek;
  if (container) {
    container.innerHTML = termekek.length
      ? termekek.map((t, i) => termekKartya(t, "pics/charmbar/", i, "charm", false)).join("")
      : `<p class="text-muted">Hamarosan...</p>`;
  }
  if (teaserImg && termekek.length) {
    const borito = kepLista(termekek[0], "pics/charmbar/")[0];
    if (borito) teaserImg.src = borito;
  }
}

loadEsemenyek();
loadArak();
loadPromo();
loadTermekek();
loadCharmTermekek();
