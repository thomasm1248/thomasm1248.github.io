// Util

function jumpTo(x, y) {
  history.pushState(null, null, location.href);
  const vv = window.visualViewport
  window.scrollTo({
    left: x - vv.width / 2 - vv.offsetLeft,
    top: y - vv.height / 2 - vv.offsetTop,
    behavior: 'smooth'
  });
}
jumpTo.doc = `number x -> number y -> undefined -- Smoothly scrolls\
 the viewport so that the center of the viewport is at (x, y).`;

// Render

fetch('content.txt')
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to load content: ' + response.status);
    }
    return response.text();
  })
  .then(data => {
    data.split('\r\n\r\n').forEach(chunk => {
      const parts = chunk.split('\r\n');
      switch(parts[0]) {
        case 't':
          t.assert(parts.length >= 6, `'t' has ${parts.length} lines instead of 6`);
          const tx = document.createElement('p');
          tx.classList.add('text');
          tx.style.left = parts[1] + 'px';
          tx.style.top = parts[2] + 'px';
          tx.style.width = parts[3] + 'px';
          tx.style.transform = 'rotate(' + parts[4] + 'deg)';
          tx.innerText = parts[5];
          document.body.appendChild(tx);
          break;
        case 'h':
          t.assert(parts.length >= 5, `'h' has ${parts.length} lines instead of 5`);
          const h = document.createElement('h1');
          h.classList.add('header');
          h.style.left = parts[1] + 'px';
          h.style.top = parts[2] + 'px';
          h.style.transform = 'rotate(' + parts[3] + 'deg)';
          h.innerText = parts[4];
          document.body.appendChild(h);
          break;
        case 'j':
          t.assert(parts.length >= 7, `'j' has ${parts.length} lines instead of 7`);
          const j = document.createElement('p');
          j.classList.add('jump');
          j.style.left = parts[1] + 'px';
          j.style.top = parts[2] + 'px';
          j.style.transform = 'rotate(' + parts[3] + 'deg)';
          j.innerText = parts[4];
          const x = parts[5] * 1;
          const y = parts[6] * 1;
          j.onclick = function() { jumpTo(x, y); };
          document.body.appendChild(j);
          break;
        case 'c':
          t.assert(parts.length >= 8, `'c' has ${parts.length} lines instead of 8`);
          const c = document.createElement('a');
          c.classList.add('card');
          c.style.left = parts[1] + 'px';
          c.style.top = parts[2] + 'px';
          c.style.width = parts[3] + 'px';
          c.style.transform = 'rotate(' + parts[4] + 'deg)';
          const img = document.createElement('img');
          img.src = 'images/' + parts[5];
          c.appendChild(img);
          const caption = document.createElement('p');
          caption.innerText = parts[6];
          c.appendChild(caption);
          c.href = parts[7];
          c.target = '_blank';
          document.body.appendChild(c);
          break;
        case 'p':
          t.assert(parts.length >= 7, `'p' has ${parts.length} lines instead of 7`);
          const p = document.createElement('a');
          p.classList.add('page');
          p.style.left = parts[1] + 'px';
          p.style.top = parts[2] + 'px';
          p.style.width = parts[3] + 'px';
          p.style.transform = 'rotate(' + parts[4] + 'deg)';
          p.innerText = parts[5];
          p.href = 'page.html?page=' + parts[6];
          document.body.appendChild(p);
          break;
        case 'i':
          t.assert(parts.length >= 6, `'i' has ${parts.length} lines instead of 6`);
          const i = document.createElement('img');
          i.classList.add('image');
          i.style.left = parts[1] + 'px';
          i.style.top = parts[2] + 'px';
          i.style.width = parts[3] + 'px';
          i.style.transform = 'rotate(' + parts[4] + 'deg)';
          i.src = 'images/' + parts[5];
          document.body.appendChild(i);
          break;
        case 'b':
          t.assert(parts.length >= 5, `'b' has ${parts.length} lines instead of 5`);
          const b = document.createElement('a');
          b.classList.add('button');
          b.style.left = parts[1] + 'px';
          b.style.top = parts[2] + 'px';
          const bImg = document.createElement('img');
          bImg.src = parts[3];
          b.appendChild(bImg);
          b.href = parts[4];
          b.target = '_blank';
          document.body.appendChild(b);
          break;
        case 'H':
          t.assert(
            parts.length >= 3,
            `'H' has ${parts.length} lines when it needed at least 3`);
          const d = document.createElement('div');
          d.classList.add('freeform');
          d.style.left = parts[1] + 'px';
          d.style.top = parts[2] + 'px';
          d.innerHTML = parts.slice(3).join('\n');
          document.body.appendChild(d);
          break;
        default:
          t.log('Content type not recognized: ' + parts[0]);
          break;
      }
    });
  })
  .catch(error => {
    t.log('Error: ' + error);
  });
