// Util

function jumpTo(x, y) {
  const leftX = x - window.visualViewport.width / 2;
  const topY = y - window.visualViewport.height / 2;
  window.scrollTo({
    left: leftX,
    top: topY,
    behavior: 'smooth'
  });
}

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
          const t = document.createElement('p');
          t.classList.add('text');
          t.style.left = parts[1] + 'px';
          t.style.top = parts[2] + 'px';
          t.style.width = parts[3] + 'px';
          t.style.transform = 'rotate(' + parts[4] + 'deg)';
          t.innerText = parts[5];
          document.body.appendChild(t);
          break;
        case 'h':
          const h = document.createElement('h1');
          h.classList.add('header');
          h.style.left = parts[1] + 'px';
          h.style.top = parts[2] + 'px';
          h.style.transform = 'rotate(' + parts[3] + 'deg)';
          h.innerText = parts[4];
          document.body.appendChild(h);
          break;
        case 'j':
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
          document.body.appendChild(c);
          break;
        case 'p':
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
          const i = document.createElement('img');
          i.classList.add('image');
          i.style.left = parts[1] + 'px';
          i.style.top = parts[2] + 'px';
          i.style.width = parts[3] + 'px';
          i.style.transform = 'rotate(' + parts[4] + 'deg)';
          i.src = 'images/' + parts[5];
          document.body.appendChild(i);
        default:
          console.log('Content type not recognized: ' + parts[0]);
          break;
      }
    });
  })
  .catch(error => {
    console.log('Error: ' + error);
  });

