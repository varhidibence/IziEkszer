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
  }
});
