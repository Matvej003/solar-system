// ── Sun & Planet Data ────────────────────────────────────────────────────────

const SUN_DATA = {
  name: 'Sonne', isSun: true, radius: 2.8, color: '#ffcc00', tex: 'sun',
  atm: null, rings: false, selfRotSpeed: 0.0015,
  details: {
    typ:         'Stern (G-Typ)',
    durchmesser: '1.392.700 km',
    temperatur:  '5.500°C (Kern: 15 Mio°C)',
    alter:       '4,6 Mrd. Jahre',
    monde:       '—',
    umlaufzeit:  '—',
    fakt:        'Enthält 99,8% der gesamten Masse des Sonnensystems',
  },
};

const PLANET_DATA = [
  {
    name: 'Merkur', radius: 0.5, orbitR: 5.8, speed: 0.0415,
    color: '#b0a0a0', tex: 'mercury', atm: null, rings: false, selfRotSpeed: 0.003,
    details: {
      typ:         'Gesteinsplanet',
      durchmesser: '4.879 km',
      entfernung:  '57,9 Mio km',
      monde:       '0',
      umlaufzeit:  '88 Tage',
      temperatur:  '-180°C bis +430°C',
      fakt:        'Ein Tag auf Merkur dauert länger als ein Jahr auf Merkur',
    },
  },
  {
    name: 'Venus', radius: 0.8, orbitR: 9.5, speed: 0.0162,
    color: '#e8c97a', tex: 'venus', atm: 'rgba(230,200,100,0.22)', rings: false, selfRotSpeed: 0.001,
    details: {
      typ:         'Gesteinsplanet',
      durchmesser: '12.104 km',
      entfernung:  '108,2 Mio km',
      monde:       '0',
      umlaufzeit:  '225 Tage',
      temperatur:  '465°C',
      fakt:        'Heißester Planet — heißer als Merkur trotz größerer Sonnenentfernung',
    },
  },
  {
    name: 'Erde', radius: 0.9, orbitR: 13.5, speed: 0.01,
    color: '#1a6aaa', tex: 'earth', atm: 'rgba(100,160,255,0.22)', rings: false, selfRotSpeed: 0.008,
    details: {
      typ:         'Gesteinsplanet',
      durchmesser: '12.742 km',
      entfernung:  '149,6 Mio km',
      monde:       '1',
      umlaufzeit:  '365 Tage',
      temperatur:  '-88°C bis +58°C',
      fakt:        'Einziger bekannter Planet mit flüssigem Wasser und Leben',
    },
  },
  {
    name: 'Mars', radius: 0.6, orbitR: 17.5, speed: 0.0053,
    color: '#c1440e', tex: 'mars', atm: 'rgba(200,120,80,0.15)', rings: false, selfRotSpeed: 0.007,
    details: {
      typ:         'Gesteinsplanet',
      durchmesser: '6.779 km',
      entfernung:  '227,9 Mio km',
      monde:       '2',
      umlaufzeit:  '687 Tage',
      temperatur:  '-125°C bis +20°C',
      fakt:        'Olympus Mons ist mit 22 km der höchste Vulkan im Sonnensystem',
    },
  },
  {
    name: 'Jupiter', radius: 2.2, orbitR: 25.5, speed: 0.00084,
    color: '#c88b3a', tex: 'jupiter', atm: null, rings: false, selfRotSpeed: 0.02,
    details: {
      typ:         'Gasriese',
      durchmesser: '139.820 km',
      entfernung:  '778,5 Mio km',
      monde:       '95',
      umlaufzeit:  '12 Jahre',
      temperatur:  '-110°C',
      fakt:        'Der Große Rote Fleck ist ein Sturm der seit über 350 Jahren tobt',
    },
  },
  {
    name: 'Saturn', radius: 1.8, orbitR: 32.5, speed: 0.00034,
    color: '#e4d191', tex: 'saturn', atm: null, rings: true, selfRotSpeed: 0.018,
    details: {
      typ:         'Gasriese',
      durchmesser: '116.460 km',
      entfernung:  '1,43 Mrd km',
      monde:       '146',
      umlaufzeit:  '29 Jahre',
      temperatur:  '-140°C',
      fakt:        'So leicht dass er auf Wasser schwimmen würde',
    },
  },
  {
    name: 'Uranus', radius: 1.3, orbitR: 39.0, speed: 0.00012,
    color: '#7de8e8', tex: 'uranus', atm: 'rgba(120,230,230,0.2)', rings: false, selfRotSpeed: 0.012,
    details: {
      typ:         'Eisriese',
      durchmesser: '50.724 km',
      entfernung:  '2,87 Mrd km',
      monde:       '28',
      umlaufzeit:  '84 Jahre',
      temperatur:  '-195°C',
      fakt:        'Rotiert auf der Seite — seine Achse ist um 98° gekippt',
    },
  },
  {
    name: 'Neptun', radius: 1.2, orbitR: 44.5, speed: 0.00006,
    color: '#3f54ba', tex: 'neptune', atm: 'rgba(80,120,220,0.2)', rings: false, selfRotSpeed: 0.011,
    details: {
      typ:         'Eisriese',
      durchmesser: '49.244 km',
      entfernung:  '4,50 Mrd km',
      monde:       '16',
      umlaufzeit:  '165 Jahre',
      temperatur:  '-200°C',
      fakt:        'Winde mit bis zu 2.100 km/h — schnellste im gesamten Sonnensystem',
    },
  },
];

PLANET_DATA.forEach((p, i) => {
  p.angle   = (i / PLANET_DATA.length) * Math.PI * 2;
  p.selfRot = 0;
});
