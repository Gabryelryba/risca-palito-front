// Standard segment-segment intersection test (does A1-A2 cross B1-B2?),
// via the counter-clockwise orientation method.
function ccw(a, b, c) {
  return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
}

export function segmentsIntersect(a1, a2, b1, b2) {
  return ccw(a1, b1, b2) !== ccw(a2, b1, b2) && ccw(a1, a2, b1) !== ccw(a1, a2, b2);
}

// Builds the on-canvas line segment for every stick, arranged in a centered,
// perfectly symmetrical grid of rows.
export function computeLayout(rows, width, height) {
  const rowHeight = height / (rows.length + 1);
  const stickLength = rowHeight * 0.72;
  const spacingX = 50;

  return rows.map((count, row) => {
    const rowWidth = (count - 1) * spacingX;
    const startX = width / 2 - rowWidth / 2;
    const topY = rowHeight * (row + 0.55);

    return Array.from({ length: count }, (_, i) => {
      const cx = startX + i * spacingX;
      return {
        row,
        index: i,
        x1: cx,
        y1: topY,
        x2: cx,
        y2: topY + stickLength,
      };
    });
  });
}
