'use strict';
t.module(() => {

  function navigate(page) {
    const link = document.createElement('a');
    link.href = `${t.root}pages/${page}.html`;
    link.click();
  }

  return {
    navigate,
  };
});
