t.module('vectorMath2d', () => {
  const e = {};

  e.make = (x, y) =>
    ({ x, y });

  e.add = (a, b) =>
    ({
      x: a.x + b.x,
      y: a.y + b.y,
    });

  e.subtract = (a, b) =>
    ({
      x: a.x - b.x,
      y: a.y - b.y,
    });

  e.dot = (a, b) =>
    a.x * b.x + a.y * b.y;

  e.lengthSquared = v =>
    v.x * v.x + v.y * v.y;

  e.length = v =>
    Math.sqrt(e.lengthSquared(v));

  e.normalize = v => {
    const length = e.length(v);
    t.assert(
      length !== 0,
      'Cannot normalize vector of length 0.');
    return {
      x: v.x / length,
      y: v.y / length,
    };
  };

  return e;
});
