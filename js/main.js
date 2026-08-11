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

document.querySelectorAll('.fb-earring-item').forEach(function (item) {
  item.addEventListener('click', function () {
    var img = item.querySelector('img');
    var num = item.querySelector('.fb-earring-num');
    earringModalImg.src = img.src;
    earringModalImg.alt = img.alt;
    earringModalNum.textContent = num ? num.textContent : '';
    earringModal.classList.add('active');
    earringModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  });
});

earringModal.querySelector('.earring-modal-close').addEventListener('click', closeEarringModal);
earringModal.querySelector('.earring-modal-backdrop').addEventListener('click', closeEarringModal);

function closeEarringModal() {
  earringModal.classList.remove('active');
  earringModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
