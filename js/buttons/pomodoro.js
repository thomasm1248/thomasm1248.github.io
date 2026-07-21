'use strict';
t.module(async () => {
  return {
    title: 'Pomodoro Timer',
    onclick: navigateAsync =>
      navigateAsync('pomodoro'),
    draw: ctx => {
      const m = 2;
      const thickness = 2;
      const minuteHandLength = 5;
      const hourHandLength = 3;
      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 20, 20);
      // Clock icon
      ctx.strokeStyle = 'black'
      ctx.lineWidth = thickness;
      ctx.beginPath();
      ctx.arc(10, 10, 10-m, 0, Math.PI*2);
      ctx.moveTo(10, 10-minuteHandLength);
      ctx.lineTo(10, 10);
      ctx.lineTo(10+hourHandLength, 10);
      ctx.stroke();
    },
  };
});
