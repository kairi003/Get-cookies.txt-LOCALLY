{
  const nowrapOption = document.querySelector('#nowrapOption');
  const tableElement = document.querySelector('#netscapeTable');

  const selectedFormat =
    (localStorage.getItem('tableNowrap') || 'true') === 'true';
  nowrapOption.checked = selectedFormat;
  tableElement.classList.toggle('nowrap', selectedFormat);

  nowrapOption.addEventListener('change', (e) => {
    tableElement.classList.toggle('nowrap');
    localStorage.setItem('tableNowrap', e.target.checked);
  });
}
