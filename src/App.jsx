import '@google/model-viewer';
import { useMemo, useState } from 'react';
import {
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  Mail,
  MapPin,
  Maximize2,
  MoveLeft,
  MoveRight,
  Palette,
  Phone,
  Plus,
  QrCode,
  Ruler,
  Smartphone,
  Trash2,
} from 'lucide-react';
import KitchenPreview from './components/KitchenPreview.jsx';
import { defaultLayout, kitchenModules, kitchenSizePresets, materials } from './data/kitchen.js';

const heroImage = 'https://kitchenrm.ru/wa-data/public/shop/products/03/19/1903/images/18695/18695.970.jpg';
const modelUrl = '/models/kitchen-rm-demo.glb';

const pilotKitchen = {
  title: 'Кухня «Графит шагрень 2200×2400»',
  price: 'от 160 000 ₽',
  source: 'https://kitchenrm.ru/grafit-shagren-2200kh2400/',
};

const steps = [
  { title: 'Размер', icon: Ruler },
  { title: 'Модули', icon: Grid3X3 },
  { title: 'Цвет', icon: Palette },
  { title: 'AR', icon: Smartphone },
];

const MODULE_TYPE_LABEL = { base: 'низ', tall: 'пенал', wall: 'верх' };

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

function buildArLink({ sizePreset, material, scheme, layout }) {
  if (typeof window === 'undefined') return '#ar-view';
  const url = new URL(window.location.href);
  url.hash = 'ar-view';
  url.searchParams.set('kitchen', 'grafit-shagren');
  url.searchParams.set('size', `${sizePreset.mainWall}x${sizePreset.sideWall}`);
  url.searchParams.set('scheme', scheme);
  url.searchParams.set('material', material.id);
  url.searchParams.set('modules', layout.join(','));
  return url.toString();
}

export default function App() {
  const [sizePresetId, setSizePresetId] = useState('original');
  const [scheme, setScheme] = useState('corner');
  const [layout, setLayout] = useState(defaultLayout);
  const [materialId, setMaterialId] = useState('graphite-quartz');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [arReady, setArReady] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const material = materials.find((item) => item.id === materialId) ?? materials[0];
  const sizePreset =
    kitchenSizePresets.find((item) => item.id === sizePresetId) ?? kitchenSizePresets[1];
  const selectedModules = layout.map(moduleById).filter(Boolean);

  const baseWidth = useMemo(
    () =>
      selectedModules
        .filter((item) => item.type === 'base' || item.type === 'tall')
        .reduce((sum, item) => sum + item.width, 0),
    [selectedModules],
  );

  // Safe fallback: clamp selected index to valid range
  const safeIndex = Math.min(selectedIndex, Math.max(0, selectedModules.length - 1));
  const selectedModule = selectedModules[safeIndex];

  const arUrl = buildArLink({ sizePreset, material, scheme, layout });
  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(arUrl)}&size=260&margin=1`;
  const fitStatus = baseWidth > sizePreset.mainWall ? 'warning' : 'ready';

  const requestText = `${pilotKitchen.title}, ${scheme === 'straight' ? 'прямая' : 'угловая'} схема, ${sizePreset.mainWall}×${sizePreset.sideWall} мм, материал: ${material.name}, модули: ${selectedModules.map((item) => item.title).join(', ')}`;

  const applyPreset = (preset) => {
    setSizePresetId(preset.id);
    setLayout(preset.layout);
    setSelectedIndex(0);
    setArReady(false);
  };

  const addModule = (id) => {
    setLayout((items) => [...items, id]);
    setSelectedIndex(layout.length);
    setArReady(false);
  };

  const removeModule = (index) => {
    setLayout((items) => items.filter((_, i) => i !== index));
    setSelectedIndex((cur) => Math.max(0, Math.min(cur, layout.length - 2)));
    setArReady(false);
  };

  const shiftModule = (index, direction) => {
    setLayout((items) => moveItem(items, index, direction));
    setSelectedIndex(Math.max(0, Math.min(index + direction, layout.length - 1)));
    setArReady(false);
  };

  return (
    <main>
      <header className="site-header">
        <div className="topbar">
          <span>
            <MapPin size={14} /> Екатеринбург, ул. Холмистая 17В
          </span>
          <span>
            <Phone size={14} /> +7 (343) 385-70-43
          </span>
        </div>
        <nav className="nav">
          <a className="brand" href="#constructor" aria-label="Кухни РМ">
            <span className="brand-mark">РМ</span>
            <span>
              <strong>Кухни РМ</strong>
              <small>3D-конструктор и AR-примерка</small>
            </span>
          </a>
          <div className="nav-links">
            <a href="#constructor">Конструктор</a>
            <a href="#ar-view">AR</a>
            <a href="#request">Заявка</a>
          </div>
        </nav>
      </header>

      <section id="constructor" className="workspace">
        <aside className="product-rail">
          <img src={heroImage} alt={pilotKitchen.title} />
          <div>
            <p className="eyebrow">Демо для фабрики кухни РМ</p>
            <h1>{pilotKitchen.title}</h1>
            <strong>{pilotKitchen.price}</strong>
            <a href={pilotKitchen.source} target="_blank" rel="noreferrer">
              Оригинал на сайте
            </a>
          </div>
        </aside>

        <section className="builder-surface">
          <div className="builder-header">
            <div>
              <p className="eyebrow">Живой конструктор</p>
              <h2>Соберите кухню и сразу откройте ее в AR</h2>
            </div>
            <div className="stepper" aria-label="Сценарий сборки">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <span key={step.title}>
                    <Icon size={15} />
                    {index + 1}. {step.title}
                  </span>
                );
              })}
            </div>
          </div>

          <KitchenPreview
            layout={layout}
            material={material}
            wallLength={sizePreset.mainWall}
            sideLength={sizePreset.sideWall}
            scheme={scheme}
          />

          <div className="module-strip" aria-label="Текущая сборка">
            {selectedModules.map((item, index) => (
              <button
                key={`${item.id}-${index}`}
                className={safeIndex === index ? 'module-tile active' : 'module-tile'}
                type="button"
                onClick={() => setSelectedIndex(index)}
              >
                <span>{index + 1}</span>
                <strong>{item.title}</strong>
                <small>
                  {item.width} мм ·{' '}
                  <span className={`type-badge type-${item.type}`}>
                    {MODULE_TYPE_LABEL[item.type]}
                  </span>
                </small>
              </button>
            ))}
          </div>
        </section>

        <aside className="control-dock">
          <section>
            <div className="dock-title">
              <Ruler size={18} />
              <strong>Размер и схема</strong>
            </div>
            <div className="preset-grid">
              {kitchenSizePresets.map((preset) => (
                <button
                  key={preset.id}
                  className={preset.id === sizePresetId ? 'preset-card active' : 'preset-card'}
                  type="button"
                  onClick={() => applyPreset(preset)}
                >
                  <strong>{preset.title}</strong>
                  <span>
                    {preset.mainWall}×{preset.sideWall}
                  </span>
                </button>
              ))}
            </div>
            <div className="segmented">
              <button
                className={scheme === 'straight' ? 'active' : ''}
                type="button"
                onClick={() => { setScheme('straight'); setArReady(false); }}
              >
                Прямая
              </button>
              <button
                className={scheme === 'corner' ? 'active' : ''}
                type="button"
                onClick={() => { setScheme('corner'); setArReady(false); }}
              >
                Угловая
              </button>
            </div>
          </section>

          <section>
            <div className="dock-title">
              <Grid3X3 size={18} />
              <strong>Модули</strong>
            </div>
            {selectedModule ? (
              <div className="selected-module">
                <div>
                  <span>Выбран</span>
                  <strong>{selectedModule.title}</strong>
                  <small>
                    {selectedModule.width}×{selectedModule.height}×{selectedModule.depth} мм
                  </small>
                </div>
                <div className="icon-actions">
                  <button type="button" aria-label="Влево" onClick={() => shiftModule(safeIndex, -1)}>
                    <MoveLeft size={16} />
                  </button>
                  <button type="button" aria-label="Вправо" onClick={() => shiftModule(safeIndex, 1)}>
                    <MoveRight size={16} />
                  </button>
                  <button type="button" aria-label="Удалить" onClick={() => removeModule(safeIndex)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <p className="empty-hint">Добавьте модуль из списка ниже</p>
            )}
            <div className="module-picker">
              {kitchenModules.map((item) => (
                <button key={item.id} type="button" onClick={() => addModule(item.id)}>
                  <Plus size={15} />
                  {item.title}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="dock-title">
              <Palette size={18} />
              <strong>Цвет</strong>
            </div>
            <div className="swatches">
              {materials.map((item) => (
                <button
                  key={item.id}
                  className={item.id === materialId ? 'swatch active' : 'swatch'}
                  type="button"
                  onClick={() => { setMaterialId(item.id); setArReady(false); }}
                >
                  <span style={{ background: item.face }} />
                  {item.name}
                </button>
              ))}
            </div>
          </section>

          <section className="ar-dock">
            <div className="dock-title">
              <QrCode size={18} />
              <strong>AR-примерка</strong>
            </div>
            <div className={`fit ${fitStatus}`}>
              {fitStatus === 'ready' ? <Check size={16} /> : <Maximize2 size={16} />}
              {baseWidth} / {sizePreset.mainWall} мм
            </div>
            <button className="button primary" type="button" onClick={() => setArReady(true)}>
              <Camera size={18} /> Сформировать QR для AR
            </button>
          </section>
        </aside>
      </section>

      <section id="ar-view" className={arReady ? 'ar-section visible' : 'ar-section'}>
        <div className="ar-copy">
          <p className="eyebrow">AR-сцена текущей сборки</p>
          <h2>QR открывает модель кухни на телефоне</h2>
          <p>
            На компьютере клиент видит QR. На телефоне открывается эта же сборка и кнопка запуска
            AR — можно поставить кухню прямо в свою комнату.
          </p>
          <div className="ar-actions">
            <a className="button ghost-dark" href={arUrl}>
              <Smartphone size={18} /> Открыть AR-ссылку
            </a>
            <a className="button ghost-dark" href="#request">
              <Mail size={18} /> Отправить расчет
            </a>
          </div>
        </div>
        <div className="qr-card">
          {arReady ? (
            <img src={qrUrl} alt="QR для открытия AR-модели кухни" />
          ) : (
            <button type="button" onClick={() => setArReady(true)}>
              <QrCode size={42} />
              Сформировать QR
            </button>
          )}
          <small>Наведите камеру телефона на QR-код</small>
        </div>
        <model-viewer
          className="model-viewer"
          src={modelUrl}
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          auto-rotate
          shadow-intensity="0.7"
          exposure="0.95"
          interaction-prompt="none"
        >
          <button className="button primary ar-launch" slot="ar-button">
            <Camera size={18} /> Смотреть в AR
          </button>
        </model-viewer>
      </section>

      <section id="request" className="request-section">
        <button
          className="collapse-button"
          type="button"
          onClick={() => setFormOpen((open) => !open)}
          aria-expanded={formOpen}
        >
          {formOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          Заявка менеджеру
          {formOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {formOpen && (
          <form className="request-form">
            <input placeholder="Имя" />
            <input placeholder="+7 ..." />
            <textarea value={requestText} readOnly rows="3" />
            <button className="button primary" type="button">
              <Mail size={18} /> Отправить заявку
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
