// Product modal
var productModal = document.getElementById('productModal');
var productModalImgEl = productModal.querySelector('.product-modal-img');
var productModalImgWrap = productModal.querySelector('.product-modal-img-wrap');
var productModalPrevBtn = productModal.querySelector('.product-modal-prev');
var productModalNextBtn = productModal.querySelector('.product-modal-next');
var productModalDotsEl = productModal.querySelector('.product-modal-dots');
var productModalKepek = [];
var productModalIdx = 0;

productModal.querySelector('.product-modal-close').addEventListener('click', closeProductModal);
productModal.querySelector('.product-modal-backdrop').addEventListener('click', closeProductModal);

function renderProductModalKep() {
  productModalImgEl.src = productModalKepek[productModalIdx] || '';
  var tobbKep = productModalKepek.length > 1;
  productModalPrevBtn.hidden = !tobbKep;
  productModalNextBtn.hidden = !tobbKep;
  productModalDotsEl.innerHTML = tobbKep ? productModalKepek.map(function (_, i) {
    return '<button type="button" class="product-modal-dot' + (i === productModalIdx ? ' active' : '') + '" data-idx="' + i + '" aria-label="' + (i + 1) + '. kép"></button>';
  }).join('') : '';
}

function productModalUgras(delta) {
  if (!productModalKepek.length) return;
  productModalIdx = (productModalIdx + delta + productModalKepek.length) % productModalKepek.length;
  renderProductModalKep();
}

productModalPrevBtn.addEventListener('click', function () { productModalUgras(-1); });
productModalNextBtn.addEventListener('click', function () { productModalUgras(1); });

productModalDotsEl.addEventListener('click', function (e) {
  var dot = e.target.closest('.product-modal-dot');
  if (!dot) return;
  productModalIdx = parseInt(dot.dataset.idx, 10);
  renderProductModalKep();
});

var productModalTouchX = null;
productModalImgWrap.addEventListener('touchstart', function (e) {
  productModalTouchX = e.touches[0].clientX;
});
productModalImgWrap.addEventListener('touchend', function (e) {
  if (productModalTouchX === null) return;
  var deltaX = e.changedTouches[0].clientX - productModalTouchX;
  productModalTouchX = null;
  if (Math.abs(deltaX) > 40) productModalUgras(deltaX > 0 ? -1 : 1);
});

document.addEventListener('keydown', function (e) {
  if (!productModal.classList.contains('active')) return;
  if (e.key === 'ArrowLeft') productModalUgras(-1);
  if (e.key === 'ArrowRight') productModalUgras(1);
  if (e.key === 'Escape') closeProductModal();
});

function openProductModal(kepek, alt, nev, anyag, ar, extra) {
  extra = extra || {};
  productModalKepek = Array.isArray(kepek) ? kepek.filter(Boolean) : (kepek ? [kepek] : []);
  productModalIdx = 0;
  productModalImgEl.alt = alt;
  renderProductModalKep();
  productModal.querySelector('.product-modal-nev').textContent = nev;
  var anyagEl = productModal.querySelector('.product-modal-anyag');
  anyagEl.textContent = anyag || '';
  anyagEl.style.display = anyag ? '' : 'none';
  var arEl = productModal.querySelector('.product-modal-ar');
  arEl.textContent = ar || '';
  arEl.style.display = ar ? '' : 'none';

  var kategoriaEl = productModal.querySelector('.product-modal-kategoriak');
  var kategoriak = extra.kategoriak || [];
  kategoriaEl.innerHTML = kategoriak.map(function (k) {
    return '<span class="product-kategoria-badge">' + k + '</span>';
  }).join('');
  kategoriaEl.style.display = kategoriak.length ? '' : 'none';

  var meretSulyReszek = [];
  if (extra.meret) meretSulyReszek.push('Méret: ' + extra.meret);
  if (extra.suly !== undefined && extra.suly !== null && extra.suly !== '') meretSulyReszek.push('Súly: ' + extra.suly + ' g');
  var meretSulyEl = productModal.querySelector('.product-modal-meret-suly');
  meretSulyEl.textContent = meretSulyReszek.join(' · ');
  meretSulyEl.style.display = meretSulyReszek.length ? '' : 'none';

  var leirasEl = productModal.querySelector('.product-modal-leiras');
  leirasEl.textContent = extra.leiras || '';
  leirasEl.style.display = extra.leiras ? '' : 'none';

  var elfogyottEl = productModal.querySelector('.product-modal-elfogyott');
  var elfogyott = extra.keszlet === 0;
  elfogyottEl.textContent = elfogyott ? 'Elfogyott' : '';
  elfogyottEl.style.display = elfogyott ? '' : 'none';

  productModal.classList.add('active');
  productModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  productModal.classList.remove('active');
  productModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
