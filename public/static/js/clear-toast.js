function clearToast(isError, wait) {
  //console.log('Inside clearToast JS');
  setTimeout(function () {
    htmx.remove(htmx.find('.alert'));
		if (!isError) document.location.href = '/';
  }, wait ?? 3000);
}
