const art = (i: number): string => {
  const h = (i * 53 + 20) % 360;
  const h2 = (h + 70) % 360;
  const h3 = (h + 200) % 360;
  const cx1 = 120 + ((i * 97) % 360);
  const cy1 = 90 + ((i * 61) % 220);
  const r1 = 70 + ((i * 23) % 60);
  const cx2 = 380 + ((i * 41) % 200);
  const cy2 = 200 + ((i * 37) % 150);
  const r2 = 50 + ((i * 19) % 50);
  const curve = 250 + ((i * 19) % 70);
  const bottom = 280 + ((i * 7) % 60);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h},65%,48%)"/><stop offset="1" stop-color="hsl(${h2},70%,18%)"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation="14"/></filter></defs><rect width="600" height="400" fill="url(#g)"/><g filter="url(#b)"><circle cx="${cx1}" cy="${cy1}" r="${r1}" fill="hsl(${h3},80%,65%)" opacity=".7"/><circle cx="${cx2}" cy="${cy2}" r="${r2}" fill="hsl(${h2},85%,70%)" opacity=".5"/></g><path d="M0 330 Q150 ${curve} 300 310 T600 ${bottom} V400 H0Z" fill="hsl(${h},50%,10%)" opacity=".55"/></svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export const ART = Array.from({ length: 15 }, () => "/test.jpg");
export const ART_COUNT = ART.length;
