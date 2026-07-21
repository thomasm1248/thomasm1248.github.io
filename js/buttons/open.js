'use strict';
t.module(() => ({
  title: 'Open existing page',
  onclick: navigateAsync => {
    const response = prompt('Enter page name:');
    if(!response) return;
    return navigateAsync(response);
  },
  draw: ctx => {
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 20, 20);
    // Black +
    const margin = 3;
    const thickness = 4;
    ctx.lineWidth = thickness;
    ctx.strokeStyle = 'black';
    //ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(10, margin);
    ctx.lineTo(10, 20-margin);
    ctx.moveTo(margin, 10);
    ctx.lineTo(20-margin,10);
    ctx.stroke();
  },
}));
