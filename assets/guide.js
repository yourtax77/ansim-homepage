// 국제상속 안내 페이지 공통: 사무소 정보 채우기
(function () {
  var O = window.OFFICE || {};
  var digits = function (s) { return String(s || '').replace(/[^0-9]/g, ''); };
  document.querySelectorAll('[data-office]').forEach(function (el) { el.textContent = O[el.dataset.office] || ''; });
  document.querySelectorAll('[data-tel]').forEach(function (el) { el.href = 'tel:' + digits(O.phone); });
})();
