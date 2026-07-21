'use strict';
t.module(async () => {
  const os = await t.requireAsync('js/os');

  return {
    title: 'Docs',
    onclick: () =>
      os.navigate('docs'),
    draw: ctx => {
      const mx = 4;
      const my = 2;
      const bevel = 4;
      const thickness = 2;
      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 20, 20);
      // Document icon
      ctx.strokeStyle = 'black'
      ctx.lineWidth = thickness;
      ctx.beginPath();
      ctx.moveTo(mx+bevel, my);
      ctx.lineTo(20-mx, my);
      ctx.lineTo(20-mx, 20-my);
      ctx.lineTo(mx, 20-my);
      ctx.lineTo(mx, my+bevel);
      ctx.lineTo(mx+bevel, my);
      ctx.moveTo(mx+bevel, my);
      ctx.lineTo(mx+bevel, my+bevel);
      ctx.lineTo(mx, my+bevel);
      ctx.stroke();
    },
  };
});
