import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore, collection, doc, addDoc, getDoc, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

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

// --- Email küldés (Firestore "Trigger Email" extension: dokumentum a "mail"
// collection-be, a kiterjesztés SMTP-n keresztül kiküldi a "mail_templates"
// collection megfelelő sablonjával) ---
const ADMIN_EMAIL = "izi.ekszer.elmeny@gmail.com";

async function regisztracioEmailKuldese(e, reg) {
  const datumSzoveg = new Date(e.datum).toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric", weekday: "long" }) + (e.idopont ? `, ${e.idopont}` : "");
  const arSzoveg = e.ar != null ? `${e.ar.toLocaleString("hu-HU")} Ft/fő` : "";
  const osszegSzoveg = e.ar != null ? `${(e.ar * reg.fo).toLocaleString("hu-HU")} Ft (${reg.fo} fő)` : "";

  await addDoc(collection(db, "mail"), {
    to: reg.email,
    template: {
      name: "esemeny-visszaigazolas",
      data: {
        to_name: reg.nev,
        esemeny_cim: e.cim,
        esemeny_datum: datumSzoveg,
        esemeny_helyszin: e.helyszin,
        esemeny_ar: arSzoveg,
        reg_fo: reg.fo,
        reg_osszeg: osszegSzoveg
      }
    }
  });

  await addDoc(collection(db, "mail"), {
    to: ADMIN_EMAIL,
    template: {
      name: "esemeny-admin-ertesites",
      data: {
        esemeny_cim: e.cim,
        esemeny_datum: datumSzoveg,
        nev: reg.nev,
        email: reg.email,
        telefon: reg.telefon,
        fo: reg.fo
      }
    }
  });
}

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
    document.getElementById("esemeny-datum").textContent = `${honapNagybetu} ${d.getDate()}. ${napNeve}${e.idopont ? `, ${e.idopont}` : ""} – ${e.helyszin}`;
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
      // if (e.letszamKorlat != null) {
      //   const infoEl = document.getElementById("esemeny-letszam-info");
      //   infoEl.textContent = `${resztvevoSzam} / ${e.letszamKorlat} fő regisztrált eddig.`;
      //   infoEl.hidden = false;
      // }
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
    const fo = Math.min(10, Math.max(1, parseInt(document.getElementById("esemeny-fo").value) || 1));

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
        if (fresh.letszamKorlat != null && current + fo > fresh.letszamKorlat) {
          throw new Error("FULL");
        }
        tx.set(regRef, {
          esemenyId: e.id,
          esemenyCim: e.cim,
          nev,
          email,
          telefon,
          fo,
          datum: serverTimestamp()
        });
        tx.update(eventRef, { resztvevoSzam: current + fo });
      });
      form.reset();
      form.hidden = true;
      successEl.hidden = false;
      regisztracioEmailKuldese(e, { nev, email, telefon, fo }).catch(err => console.error("[esemeny] email küldési hiba:", err));
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
