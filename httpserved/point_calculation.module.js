function convexHull(points) {
  points = [...points].sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);

  const cross = (o, a, b) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower = [];
  for (const p of points) {
    while (lower.length >= 2 && cross(lower.at(-2), lower.at(-1), p) <= 0)
      lower.pop();
    lower.push(p);
  }

  const upper = [];
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i];
    while (upper.length >= 2 && cross(upper.at(-2), upper.at(-1), p) <= 0)
      upper.pop();
    upper.push(p);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

function segmentsIntersect(a, b, c, d) {
  const cross = (p, q, r) =>
    (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);

  const d1 = cross(a, b, c);
  const d2 = cross(a, b, d);
  const d3 = cross(c, d, a);
  const d4 = cross(c, d, b);

  return d1 * d2 < 0 && d3 * d4 < 0;
}


function buildSimplePolygon(points) {
  if (points.length < 3) return points;

  const hull = convexHull(points);
  const hullSet = new Set(hull.map(p => `${p.x},${p.y}`));
  const inner = points.filter(p => !hullSet.has(`${p.x},${p.y}`));

  const polygon = [...hull];

  for (const p of inner) {
    let inserted = false;

    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i];
      const b = polygon[(i + 1) % polygon.length];

      const newEdge1 = [a, p];
      const newEdge2 = [p, b];

      let ok = true;

      for (let j = 0; j < polygon.length; j++) {
        const c = polygon[j];
        const d = polygon[(j + 1) % polygon.length];

        if (c === a || c === b) continue;

        if (
          segmentsIntersect(...newEdge1, c, d) ||
          segmentsIntersect(...newEdge2, c, d)
        ) {
          ok = false;
          break;
        }
      }

      if (ok) {
        polygon.splice(i + 1, 0, p);
        inserted = true;
        break;
      }
    }

    if (!inserted) polygon.push(p); // fallback (rare)
  }

  return polygon;
}

export {
    buildSimplePolygon
}