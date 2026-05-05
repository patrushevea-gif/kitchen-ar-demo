import { useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  Box,
  Calculator,
  Camera,
  CheckCircle2,
  Clock3,
  Factory,
  Grid3X3,
  Mail,
  MapPin,
  MoveLeft,
  MoveRight,
  Palette,
  Phone,
  Plus,
  Ruler,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
} from 'lucide-react';
import KitchenPreview from './components/KitchenPreview.jsx';
import { defaultLayout, kitchenModules, materials } from './data/kitchen.js';

const heroImage = 'https://kitchenrm.ru/wa-data/public/shop/products/03/19/1903/images/6159/6159.970.jpg';

const pilotKitchen = {
  title: 'Графит Кварц черный Турин',
  subtitle: 'Пилотная кухня 2200x2400 мм',
  price: 'от 93 000 ₽',
  source: 'kitchenrm.ru/grafit-kvarts-chernyy-turin',
  details: [
    'Размер 2200x2400 мм',
    'Фасад Графит фреза + Кварц черный фреза',
    'Столешница Дуб Вотан 26 мм',
    'Стекло Графит софт, профиль Gola черный',
  ],
};

const modeCards = [
  {
    id: 'layout',
    icon: Grid3X3,
    title: '3D-компоновка',
    text: 'Клиент двигает модули на экране, меняет порядок и видит итоговую длину.',
    status: 'Готовим сегодня',
  },
  {
    id: 'static-ar',
    icon: Smartphone,
    title: 'AR готовой кухни',
    text: 'Завтра подключаем GLB/USDZ: вся собранная кухня открывается в телефоне как один объект.',
    status: 'Следующий этап',
  },
  {
    id: 'editable-ar',
    icon: ArrowLeftRight,
    title: 'AR с движением модулей',
    text: 'Оставляем как премиум-функцию: сначала докажем ценность простым и стабильным сценарием.',
    status: 'Версия 2.0',
  },
];

const digitizingPlan = [
  'Собрать точные размеры модулей: ширина, высота, глубина, цоколь, столешница.',
  'Подготовить GLB-модули с material slots: front, body, countertop, handle, glass.',
  'Сделать 3 материала фасада и 2 столешницы без дублирования геометрии.',
  'Экспортировать цельную AR-сцену выбранной компоновки для iPhone и Android.',
];

function moduleById(id) {
  return kitchenModules.find((item) => item.id === id);
}

function moveItem(items, index, direction) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const next = [...items];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}

export default function App() {
  const [wallLength, setWallLength] = useState(2400);
  const [scheme, setScheme] = useState('corner');
  const [layout, setLayout] = useState(defaultLayout);
  const [materialId, setMaterialId] = useState('graphite-quartz');
  const [mode, setMode] = useState('layout');

  const material = materials.find((item) => item.id === materialId) ?? materials[0];

  const totalWidth = useMemo(
    () =>
      layout
        .map(moduleById)
        .filter((item) => item && (item.type === 'base' || item.type === 'tall'))
        .reduce((sum, item) => sum + item.width, 0),
    [layout],
  );

  const selectedModules = layout.map(moduleById).filter(Boolean);
  const addModule = (id) => setLayout((items) => [...items, id]);
  const removeModule = (index) => setLayout((items) => items.filter((_, itemIndex) => itemIndex !== index));
  const shiftModule = (index, direction) => setLayout((items) => moveItem(items, index, direction));

  const requestText = `${pilotKitchen.title}, ${scheme === 'straight' ? 'прямая' : 'угловая'} схема, стена ${wallLength} мм, материал ${material.name}, модули: ${selectedModules
    .map((item) => item.title)
    .join(', ')}`;

  return (
    <main>
      <header className="site-header">
        <div className="topbar">
          <span>
            <MapPin size={15} /> Екатеринбург, ул. Холмистая 17В
          </span>
          <span>
            <Clock3 size={15} /> Пн 11:00-16:30, Вт-Пт 08:00-16:30
          </span>
          <span>
            <Phone size={15} /> +7 (343) 385-70-43
          </span>
        </div>
        <nav className="nav">
          <a className="brand" href="#top" aria-label="Кухни РМ">
            <span className="brand-mark">РМ</span>
            <span>
              <strong>Кухни РМ</strong>
              <small>AR-инструмент продаж</small>
            </span>
          </a>
          <div className="nav-links" aria-label="Разделы">
            <a href="#catalog">Пилот</a>
            <a href="#constructor">Компоновка</a>
            <a href="#digitizing">3D-подготовка</a>
            <a href="#request">Заявка</a>
          </div>
        </nav>
      </header>

      <section id="top" className="hero">
        <img src={heroImage} alt={pilotKitchen.title} />
        <div className="hero-copy">
          <p className="eyebrow">Демо для фабрики кухни РМ</p>
          <h1>{pilotKitchen.title} в AR</h1>
          <p>
            Готовим демонстрацию на реальной кухне с сайта: модульная компоновка, смена материалов и
            сценарий AR-просмотра на телефоне.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#constructor">
              <Grid3X3 size={18} /> Открыть компоновку
            </a>
            <a className="button ghost" href="#digitizing">
              <Box size={18} /> План 3D-моделей
            </a>
          </div>
        </div>
      </section>

      <section className="benefits" aria-label="Преимущества">
        <article>
          <ShieldCheck />
          <strong>18 месяцев</strong>
          <span>гарантия на мебель</span>
        </article>
        <article>
          <Calculator />
          <strong>Быстрый расчет</strong>
          <span>заявка с параметрами сборки</span>
        </article>
        <article>
          <Factory />
          <strong>Свое производство</strong>
          <span>модули и фасады фабрики</span>
        </article>
        <article>
          <Sparkles />
          <strong>AR-примерка</strong>
          <span>показ кухни в комнате клиента</span>
        </article>
      </section>

      <section id="catalog" className="catalog-section">
        <div className="section-heading">
          <p className="eyebrow">Пилотная модель</p>
          <h2>{pilotKitchen.subtitle}</h2>
          <p>
            Берем кухню средней сложности: есть угловая логика, разные фасады, стекло, профиль и
            столешница. Этого достаточно, чтобы завтра показать ценность 3D/AR без лишнего R&D.
          </p>
        </div>
        <div className="catalog-grid">
          <article className="product-card">
            <img src={heroImage} alt={pilotKitchen.title} />
            <div>
              <h3>{pilotKitchen.title}</h3>
              <strong className="price-line">{pilotKitchen.price}</strong>
              <ul className="feature-list">
                {pilotKitchen.details.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <a className="inline-button as-link" href={`https://${pilotKitchen.source}`} target="_blank" rel="noreferrer">
                Оригинал на сайте РМ
              </a>
            </div>
          </article>
          <article className="workflow-card">
            <Ruler />
            <h3>Что готовим к 3D/AR</h3>
            <p>
              Сегодня фиксируем сценарий, список модулей и материалы. Завтра заменяем черновые блоки на
              реальные GLB/USDZ-модели и подключаем AR-кнопку.
            </p>
          </article>
        </div>
      </section>

      <section className="mode-section">
        <div className="section-heading">
          <p className="eyebrow">Функционал демо</p>
          <h2>Три режима, но без лишнего усложнения</h2>
        </div>
        <div className="mode-grid">
          {modeCards.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={mode === item.id ? 'mode-card active' : 'mode-card'}
                type="button"
                onClick={() => setMode(item.id)}
              >
                <Icon />
                <strong>{item.title}</strong>
                <span>{item.text}</span>
                <em>{item.status}</em>
              </button>
            );
          })}
        </div>
      </section>

      <section id="constructor" className="constructor">
        <div className="panel controls-panel">
          <div className="section-heading compact">
            <p className="eyebrow">{mode === 'layout' ? '3D-компоновка' : 'AR-сценарий'}</p>
            <h2>Соберите примерную кухню</h2>
          </div>

          <label className="range-control">
            <span>Длина основной стены</span>
            <strong>{wallLength} мм</strong>
            <input
              type="range"
              min="2200"
              max="4200"
              step="100"
              value={wallLength}
              onChange={(event) => setWallLength(Number(event.target.value))}
            />
          </label>

          <div className="segmented" aria-label="Схема кухни">
            <button
              className={scheme === 'straight' ? 'active' : ''}
              type="button"
              onClick={() => setScheme('straight')}
            >
              Прямая
            </button>
            <button
              className={scheme === 'corner' ? 'active' : ''}
              type="button"
              onClick={() => setScheme('corner')}
            >
              Угловая
            </button>
          </div>

          <div className="module-list">
            <span className="control-label">Добавить модуль</span>
            {kitchenModules.map((item) => (
              <button key={item.id} className="module-chip" type="button" onClick={() => addModule(item.id)}>
                <Plus size={16} /> {item.title}
              </button>
            ))}
          </div>

          <div className="layout-stack">
            <span className="control-label">Порядок модулей</span>
            {selectedModules.map((item, index) => (
              <div className="layout-item" key={`${item.id}-${index}`}>
                <span>{index + 1}</span>
                <strong>{item.title}</strong>
                <small>{item.width} мм</small>
                <button type="button" aria-label="Сдвинуть левее" onClick={() => shiftModule(index, -1)}>
                  <MoveLeft size={16} />
                </button>
                <button type="button" aria-label="Сдвинуть правее" onClick={() => shiftModule(index, 1)}>
                  <MoveRight size={16} />
                </button>
                <button type="button" aria-label="Удалить модуль" onClick={() => removeModule(index)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div id="materials" className="swatches">
            <span className="control-label">Материалы фасада</span>
            {materials.map((item) => (
              <button
                key={item.id}
                className={item.id === materialId ? 'swatch active' : 'swatch'}
                type="button"
                onClick={() => setMaterialId(item.id)}
              >
                <span style={{ background: item.face }} />
                {item.name}
              </button>
            ))}
          </div>
        </div>

        <div className="panel preview-panel">
          <div className="preview-header">
            <div>
              <p className="eyebrow">Черновое 3D-превью</p>
              <h2>{material.name}</h2>
            </div>
            <span className={totalWidth > wallLength ? 'status warning' : 'status'}>
              {totalWidth} / {wallLength} мм
            </span>
          </div>
          <KitchenPreview layout={layout} material={material} wallLength={wallLength} scheme={scheme} />
          <div className="ar-row">
            <button className="button primary" type="button">
              <Camera size={18} /> Подготовить AR
            </button>
            <p>
              Сейчас это место под AR-экспорт. Завтра сюда подключаем цельную 3D-сцену кухни для
              телефона.
            </p>
          </div>
        </div>
      </section>

      <section id="digitizing" className="digitizing-section">
        <div className="section-heading">
          <p className="eyebrow">Подготовка к завтрашнему 3D</p>
          <h2>Что надо оцифровать для одного гарнитура</h2>
          <p>
            Модель не делаем одним монолитом. Нужна библиотека стандартных модулей плюс материалы,
            чтобы менять порядок и цвет без повторной генерации всей кухни.
          </p>
        </div>
        <div className="prep-grid">
          <article>
            <Box />
            <h3>Модули</h3>
            <ul className="feature-list">
              {kitchenModules.slice(0, 7).map((item) => (
                <li key={item.id}>
                  {item.title}: {item.width}x{item.height}x{item.depth} мм
                </li>
              ))}
            </ul>
          </article>
          <article>
            <Palette />
            <h3>Материалы</h3>
            <ul className="feature-list">
              {materials.map((item) => (
                <li key={item.id}>{item.name}</li>
              ))}
            </ul>
          </article>
          <article>
            <CheckCircle2 />
            <h3>План работ</h3>
            <ul className="feature-list">
              {digitizingPlan.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section id="request" className="request-section">
        <div>
          <p className="eyebrow">Заявка менеджеру</p>
          <h2>Короткая заявка по сборке</h2>
          <p>
            Форма не спорит с конструктором: она просто передает менеджеру параметры выбранной кухни.
          </p>
        </div>
        <form className="request-form">
          <label>
            Имя
            <input placeholder="Иван" />
          </label>
          <label>
            Телефон
            <input placeholder="+7 ..." />
          </label>
          <label>
            Комментарий к расчету
            <textarea value={requestText} readOnly rows="4" />
          </label>
          <button className="button primary" type="button">
            <Mail size={18} /> Отправить заявку
          </button>
        </form>
      </section>
    </main>
  );
}
