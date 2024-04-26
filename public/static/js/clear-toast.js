let tst = document.querySelector('.toast');
if (tst && !tst.classList.contains('invisible')) {
  setTimeout(function () {
    tst.style.visibility = 'hidden';
  }, 2000);
}
