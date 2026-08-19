// Nav layout: 'top' or 'sidebar'
// Change this variable to switch navbar position
var NAV_LAYOUT = 'sidebar';

(function () {
  if (NAV_LAYOUT === 'sidebar') {
    document.body.classList.add('nav-sidebar-mode');
  }
})();

// Mobile menu open/close
function openMobileMenu() {
  document.getElementById('mobileMenu').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
  document.getElementById('mobileMenu').classList.remove('active');
  document.body.style.overflow = '';
}

// Navbar shadow on scroll
window.addEventListener('scroll', function () {
  var navbar = document.querySelector('.navbar-desktop');
  if (window.scrollY > 50) {
    navbar.style.boxShadow = '0 2px 15px rgba(201, 169, 110, 0.15)';
  } else {
    navbar.style.boxShadow = 'none';
  }
});

// Close mobile menu on Escape key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    closeMobileMenu();
    closeEarringModal();
  }
});

// Earring lightbox
var earringModal = document.getElementById('earringModal');
var earringModalImg = earringModal.querySelector('.earring-modal-img');
var earringModalNum = earringModal.querySelector('.earring-modal-num');

function openEarringModal(imgSrc, imgAlt, label) {
  earringModalImg.src = imgSrc;
  earringModalImg.alt = imgAlt;
  earringModalNum.textContent = label;
  earringModal.classList.add('active');
  earringModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

document.querySelectorAll('.fb-earring-item').forEach(function (item) {
  item.addEventListener('click', function () {
    var img = item.querySelector('img');
    var num = item.querySelector('.fb-earring-num');
    openEarringModal(img.src, img.alt, num ? num.textContent : '');
  });
});

document.querySelectorAll('.fb-shape-item').forEach(function (item) {
  item.addEventListener('click', function () {
    var img = item.querySelector('img');
    var label = item.querySelector('span');
    openEarringModal(img.src, img.alt, label ? label.textContent : '');
  });
});

document.querySelectorAll('.fb-uj-item').forEach(function (item) {
  item.addEventListener('click', function () {
    var img = item.querySelector('img');
    var label = item.querySelector('span');
    openEarringModal(img.src, img.alt, label ? label.textContent : '');
  });
});

earringModal.querySelector('.earring-modal-close').addEventListener('click', closeEarringModal);
earringModal.querySelector('.earring-modal-backdrop').addEventListener('click', closeEarringModal);

function closeEarringModal() {
  earringModal.classList.remove('active');
  earringModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// Események szétválasztása közelgő / korábbi alapján
const esemenyek = [
  { cim: "Esztergomi Szent István Napok", helyszin: "Esztergom",             datum: "2026-08-23" },
  { cim: "Tinnyei Falunap",              helyszin: "Tinnye",                 datum: "2026-08-20" },
  { cim: "Fülbelövés Nap",               helyszin: "Tát és környéke",        datum: "2026-08-06" },
  { cim: "Fülbelövés Nap",               helyszin: "Pilisjászfalu és környéke", datum: "2026-08-04" },
  { cim: "Fülbelövés Nap",               helyszin: "Esztergom",              datum: "2026-07-30" },
  { cim: "Fülbelövés Nap",               helyszin: "Dorog",                  datum: "2026-07-23" },
];

function esemenyKartya(e, isPast) {
  const d = new Date(e.datum);
  const honap = d.toLocaleDateString("hu-HU", { month: "short" });
  const nap = d.getDate();
  return `
    <div class="col-md-6 col-lg-4">
      <div class="card event-card${isPast ? ' korabbi' : ''}">
        <div class="card-body">
          <h5 class="card-title"><i class="bi bi-calendar-event me-2" style="color: var(--color-gold)"></i>${e.cim}</h5>
          <p class="text-muted">${nap}. ${honap} – ${e.helyszin}</p>
        </div>
      </div>
    </div>`;
}

(function () {
  const ma = new Date();
  ma.setHours(0, 0, 0, 0);

  const kozelgo = esemenyek.filter(e => new Date(e.datum) >= ma);
  const korabbi = esemenyek.filter(e => new Date(e.datum) < ma);

  let html = "";
  if (kozelgo.length) {
    html += `<h5 class="mt-3 mb-3 text-muted">Közelgő</h5><div class="row g-4">${kozelgo.map(e => esemenyKartya(e, false)).join("")}</div>`;
  }
  if (korabbi.length) {
    html += `<h5 class="mt-4 mb-3 text-muted">Korábbi</h5><div class="row g-4">${korabbi.map(e => esemenyKartya(e, true)).join("")}</div>`;
  }

  document.getElementById("esemenyek-container").innerHTML = html;
})();
