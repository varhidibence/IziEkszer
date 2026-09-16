import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore, collection, doc, getDoc, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

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

function textToHtml(text) {
  return text
    .split(/\n\n+/)
    .map(para => `<p>${para.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

async function init() {
  const id = new URLSearchParams(location.search).get("id");
  const loadingEl = document.getElementById("esemeny-loading");
  const notFoundEl = document.getElementById("esemeny-not-found");
  const contentEl = document.getElementById("esemeny-content");

  if (!id) {
    loadingEl.hidden = true;
    notFoundEl.hidden = false;
    return;
  }

  try {
    const snap = await getDoc(doc(db, "esemenyek", id));
    if (!snap.exists()) {
      loadingEl.hidden = true;
      notFoundEl.hidden = false;
      return;
    }

    const e = { id: snap.id, ...snap.data() };
    const d = new Date(e.datum);
    const honap = d.toLocaleDateString("hu-HU", { month: "long" });
    const honapNagybetu = honap.charAt(0).toUpperCase() + honap.slice(1);
    const napNeve = d.toLocaleDateString("hu-HU", { weekday: "long" });

    document.title = e.cim + " – IziÉkszer";
    document.getElementById("esemeny-cim").textContent = e.cim;
    document.getElementById("esemeny-datum").textContent = `${honapNagybetu} ${d.getDate()}. ${napNeve} – ${e.helyszin}`;
    document.getElementById("esemeny-leiras").innerHTML = e.leiras ? textToHtml(e.leiras) : "";

    const mapEl = document.getElementById("esemeny-map");
    const terkepCim = e.terkepCim || e.helyszin;
    if (mapEl && terkepCim) {
      mapEl.src = `https://www.google.com/maps?q=${encodeURIComponent(terkepCim)}&output=embed`;
    }

    const ma = new Date();
    ma.setHours(0, 0, 0, 0);
    const mult = d < ma;
    const resztvevoSzam = e.resztvevoSzam || 0;
    const betelt = e.letszamKorlat != null && resztvevoSzam >= e.letszamKorlat;

    if (mult) {
      document.getElementById("esemeny-lezarult").hidden = false;
    } else if (e.regisztracioSzukseges && betelt) {
      document.getElementById("esemeny-betelt").hidden = false;
    } else if (e.regisztracioSzukseges) {
      if (e.letszamKorlat != null) {
        const infoEl = document.getElementById("esemeny-letszam-info");
        infoEl.textContent = `${resztvevoSzam} / ${e.letszamKorlat} fő regisztrált eddig.`;
        infoEl.hidden = false;
      }
      setupForm(e);
      document.getElementById("esemeny-reg-wrap").hidden = false;
    }

    loadingEl.hidden = true;
    contentEl.hidden = false;
  } catch (err) {
    console.error("[esemeny] hiba:", err);
    loadingEl.hidden = true;
    notFoundEl.hidden = false;
  }
}

function setupForm(e) {
  const form = document.getElementById("esemenyRegForm");
  const btn = document.getElementById("esemeny-reg-btn");
  const successEl = document.getElementById("esemeny-reg-success");
  const errorEl = document.getElementById("esemeny-reg-error");
  const beteltEl = document.getElementById("esemeny-betelt");
  const regWrapEl = document.getElementById("esemeny-reg-wrap");

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const nev = document.getElementById("esemeny-nev").value.trim();
    const email = document.getElementById("esemeny-email").value.trim();
    const telefon = document.getElementById("esemeny-telefon").value.trim();

    btn.disabled = true;
    successEl.hidden = true;
    errorEl.hidden = true;

    const eventRef = doc(db, "esemenyek", e.id);
    const regRef = doc(collection(db, "esemeny_regisztraciok"));

    try {
      await runTransaction(db, async (tx) => {
        const freshSnap = await tx.get(eventRef);
        if (!freshSnap.exists()) throw new Error("NOTFOUND");
        const fresh = freshSnap.data();
        const current = fresh.resztvevoSzam || 0;
        if (fresh.letszamKorlat != null && current >= fresh.letszamKorlat) {
          throw new Error("FULL");
        }
        tx.set(regRef, {
          esemenyId: e.id,
          esemenyCim: e.cim,
          nev,
          email,
          telefon,
          datum: serverTimestamp()
        });
        tx.update(eventRef, { resztvevoSzam: current + 1 });
      });
      form.reset();
      form.hidden = true;
      successEl.hidden = false;
    } catch (err) {
      if (err.message === "FULL") {
        form.hidden = true;
        regWrapEl.hidden = true;
        beteltEl.hidden = false;
      } else {
        console.error("[esemeny] regisztrációs hiba:", err);
        errorEl.textContent = "Hiba történt, kérjük próbáld újra.";
        errorEl.hidden = false;
      }
    } finally {
      btn.disabled = false;
    }
  });
}

init();
