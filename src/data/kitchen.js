export const kitchenModules = [
  { id: 'fridge-600',  title: 'Холодильник 600',   width: 600, height: 2000, depth: 620, type: 'tall' },
  { id: 'tall-600',    title: 'Пенал 600',          width: 600, height: 2140, depth: 580, type: 'tall' },
  { id: 'base-400',    title: 'Тумба 400',          width: 400, height: 820,  depth: 560, type: 'base' },
  { id: 'base-600',    title: 'Тумба 600',          width: 600, height: 820,  depth: 560, type: 'base' },
  { id: 'base-800',    title: 'Тумба 800',          width: 800, height: 820,  depth: 560, type: 'base' },
  { id: 'sink-800',    title: 'Мойка 800',          width: 800, height: 820,  depth: 560, type: 'base' },
  { id: 'drawers-800', title: 'Ящики 800',          width: 800, height: 820,  depth: 560, type: 'base' },
  { id: 'oven-600',    title: 'Духовой шкаф 600',   width: 600, height: 820,  depth: 560, type: 'base' },
  { id: 'wall-400',    title: 'Шкаф 400',           width: 400, height: 720,  depth: 340, type: 'wall' },
  { id: 'wall-600',    title: 'Шкаф 600',           width: 600, height: 720,  depth: 340, type: 'wall' },
  { id: 'wall-800',    title: 'Шкаф 800',           width: 800, height: 720,  depth: 340, type: 'wall' },
  { id: 'wall-glass-800', title: 'Витрина 800',     width: 800, height: 720,  depth: 340, type: 'wall' },
];

export const kitchenSizePresets = [
  {
    id: 'compact',
    title: 'Компакт',
    description: 'Для небольшой кухни',
    mainWall: 2200,
    sideWall: 1800,
    layout: ['tall-600', 'base-600', 'sink-800', 'oven-600', 'wall-600', 'wall-glass-800'],
  },
  {
    id: 'original',
    title: 'Как на сайте',
    description: 'Графит шагрень 2200×2400',
    mainWall: 2400,
    sideWall: 2200,
    layout: ['fridge-600', 'tall-600', 'base-600', 'sink-800', 'drawers-800', 'wall-600', 'wall-glass-800'],
  },
  {
    id: 'extended',
    title: 'Расширенная',
    description: 'Для просторной кухни',
    mainWall: 3200,
    sideWall: 2600,
    layout: [
      'fridge-600', 'tall-600', 'base-600', 'sink-800', 'drawers-800', 'base-800',
      'wall-600', 'wall-glass-800', 'wall-800',
    ],
  },
];

export const materials = [
  {
    id: 'graphite-quartz',
    name: 'Графит шагрень / дерево',
    face: '#26231f',
    body: '#342f28',
    counter: '#a06f3f',
    shagreen: true,
  },
  {
    id: 'white-oak',
    name: 'Белый / Дуб Вотан',
    face: '#f5f2ec',
    body: '#e7dcc9',
    counter: '#9b7a55',
    shagreen: false,
  },
  {
    id: 'graphite-stone',
    name: 'Графит / светлый камень',
    face: '#2e2b27',
    body: '#342f28',
    counter: '#c7c0b6',
    shagreen: false,
  },
  {
    id: 'ivory-walnut',
    name: 'Слоновая кость / Орех',
    face: '#ede4d2',
    body: '#e0d4bc',
    counter: '#6b4c2a',
    shagreen: false,
  },
  {
    id: 'sage-ash',
    name: 'Шалфей / Ясень',
    face: '#6e8068',
    body: '#7d9177',
    counter: '#c4a97a',
    shagreen: false,
  },
];

export const defaultLayout = kitchenSizePresets[1].layout;
