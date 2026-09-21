import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBpANZuxKAqjOmoFFimX6A25fDbUZ_ikvQ",
  authDomain: "iziekszer.firebaseapp.com",
  projectId: "iziekszer",
  storageBucket: "iziekszer.firebasestorage.app",
  messagingSenderId: "48329057382",
  appId: "1:48329057382:web:5dad043d8f860df3f7f9a7",
  measurementId: "G-QRVBJGEHRN"
};

// A firebase-data.js is inicializálja az app-ot ugyanezzel a configgal ezen az
// oldalon – itt a meglévő instance-t használjuk, hogy ne dobjon duplicate-app hibát.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const ADMIN_EMAIL = "izi.ekszer.elmeny@gmail.com";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const btn = document.getElementById("contact-form-btn");
  const successEl = document.getElementById("contact-form-success");
  const errorEl = document.getElementById("contact-form-error");

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const subject = document.getElementById("subject").value;
    const message = document.getElementById("message").value.trim();

    btn.disabled = true;
    successEl.hidden = true;
    errorEl.hidden = true;

    try {
      await addDoc(collection(db, "mail"), {
        to: ADMIN_EMAIL,
        template: {
          name: "kapcsolat-admin-ertesites",
          data: { name, email, subject, message }
        }
      });
      form.reset();
      successEl.hidden = false;
    } catch (err) {
      console.error("[kapcsolat] email küldési hiba:", err);
      errorEl.textContent = "Hiba történt az üzenet küldése közben, kérjük próbáld újra, vagy írj emailt közvetlenül.";
      errorEl.hidden = false;
    } finally {
      btn.disabled = false;
    }
  });
});
