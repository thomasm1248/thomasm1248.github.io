'use strict';
t.module(() => {
  const e = {};

  e.useOn = document => {
    document.querySelectorAll('.build-indented-list')
      .forEach(x => {
        const ul = document.createElement('ul');
        ul.style.listStyle = 'none'; // remove bullets
        x.innerHTML
          .split('\n')
          .filter(l => l.length !== 0)
          .map(line => {
            const indentation = line.match('^ *')[0].length;
            const li = document.createElement('li');
            li.style.paddingLeft = `${indentation * 5}px`;
            li.innerText = line;
            return li;
          })
          .forEach(li =>
            ul.appendChild(li));
        x.replaceWith(ul);
      });
  };

  return e;
});
