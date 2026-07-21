'use strict';
t.module(() => ({
  title: 'Home',
  onclick: navigateAsync =>
    navigateAsync('homepage'),
  draw: ctx => {
    const margin = 3;
    const roofHeight = 5;
    const thickness = 2;
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 20, 20);
    // Black house icon
    ctx.strokeStyle = 'black';
    ctx.lineWidth = thickness;
    ctx.moveTo(10, margin);
    ctx.lineTo(20-margin, margin+roofHeight);
    ctx.lineTo(20-margin, 20-margin);
    ctx.lineTo(margin, 20-margin);
    ctx.lineTo(margin, margin+roofHeight);
    ctx.lineTo(10, margin);
    ctx.stroke();
  },
}));
