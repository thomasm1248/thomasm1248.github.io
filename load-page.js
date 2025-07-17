const pageName = window.location.search.substring(6);
fetch('pages/' + pageName)
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to load content: ' + response.status);
    }
    return response.text();
  })
  .then(content => {
    document.body.innerHTML += content;
  })
  .catch(error => {
    console.log('Error: ' + error);
  });
