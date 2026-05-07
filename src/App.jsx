import '@google/model-viewer';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  GripVertical,
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
const modelUrl = '/models/kitchen-rm-ar.glb';

const pilotKitchen = {
  title: 'Кухня «Графит шагрень 2200×2400»',
  price: 'от 160 000 ₽',
  source: 'https://kitchenrm.ru/grafit-shagren-2200kh2400/',
};

const MODULE_TYPE_LABEL = { base: 'Нижний', tall: 'Колонна', wall: 'Верхний' };
const MODULE_TYPE_SHORT = { base: 'Н', tall: 'К', wall: 'В' };

function getModuleById(id) {
  return kitchenModules.find((m) => m.id === id);
}

function buildArLink({ sizePreset, material, scheme, cornerSide, layout }) {
  if (typeof window === 'undefined') return '/ar';
  const url = new URL('/ar', window.location.origin);
  url.searchParams.set('open', '1');
  url.searchParams.set('size', `${sizePreset.mainWall}x${sizePreset.sideWall}`);
  url.searchParams.set('scheme', scheme);
  url.searchParams.set('corner', cornerSide);
  url.searchParams.set('material', material.id);
  url.searchParams.set('modules', layout.join(','));
  return url.toString();
}

export default function App() {
  const pathname = typeof window === 'undefined' ? '/' : window.location.pathname.replace(/\/$/, '');
  if (pathname === '/ar') return <ArExperience />;

  return <ConstructorExperience />;
}

function ArExperience() {
  const viewerRef = useRef(null);
  const [status, setStatus] = useState('loading');

  const openAr = async () => {
    const viewer = viewerRef.current;
    if (!viewer?.activateAR) return;

    try {
      await viewer.activateAR();
      setStatus('started');
    } catch {
      setStatus('manual');
    }
  };

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return undefined;

    const params = new URLSearchParams(window.location.search);
    const shouldOpen = params.get('open') === '1';
    const onLoad = () => {
      setStatus('ready');
      if (shouldOpen) window.setTimeout(() => openAr(), 450);
    };

    viewer.addEventListener('load', onLoad);
    return () => viewer.removeEventListener('load', onLoad);
  }, []);

  return (
    <main className="ar-page">
      <style>
        {`
          .ar-page {
            min-height: 100vh;
            background: linear-gradient(180deg, rgba(255, 250, 243, 0.96), rgba(244, 237, 227, 0.92)) #f4ede3;
          }

          .ar-page-header {
            position: fixed;
            top: 0;
            left: 0;
            z-index: 5;
            width: 100%;
            padding: 0.65rem 0.875rem;
            background: rgba(255, 250, 243, 0.94);
            border-bottom: 1px solid var(--line);
            backdrop-filter: blur(14px);
          }

          .ar-stage {
            position: relative;
            display: grid;
            min-height: 100vh;
            padding-top: 66px;
            overflow: hidden;
          }

          .ar-viewer {
            width: 100%;
            height: calc(100vh - 66px);
            min-height: 560px;
            background:
              radial-gradient(circle at 50% 24%, rgba(255,255,255,0.98), rgba(238,228,216,0.62) 44%, rgba(218,203,185,0.78)),
              #efe6da;
          }

          .ar-panel {
            position: absolute;
            left: 1rem;
            bottom: 1rem;
            display: grid;
            gap: 0.55rem;
            width: min(420px, calc(100% - 2rem));
            padding: 1rem;
            background: rgba(255, 250, 243, 0.94);
            border: 1px solid rgba(226, 214, 200, 0.96);
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            backdrop-filter: blur(16px);
          }

          .ar-panel h1 {
            margin-bottom: 0;
            font-size: clamp(1.25rem, 4vw, 1.75rem);
          }

          .ar-panel p {
            margin-bottom: 0;
          }

          .ar-panel small {
            color: var(--muted);
            font-size: 0.75rem;
            font-weight: 600;
          }

          @media (max-width: 640px) {
            .ar-stage { padding-top: 58px; }
            .ar-viewer { height: calc(100vh - 58px); min-height: 520px; }
            .ar-panel {
              left: 0.75rem;
              bottom: 0.75rem;
              width: calc(100% - 1.5rem);
            }
          }
        `}
      </style>
      <header className="ar-page-header">
        <a className="brand" href="/" aria-label="Кухни РМ">
          <span className="brand-mark">РМ</span>
          <span>
            <strong>Кухни РМ</strong>
            <small>AR-примерка кухни 2200×2400</small>
          </span>
        </a>
      </header>

      <section className="ar-stage" aria-label="AR-примерка кухни РМ">
        <model-viewer
          ref={viewerRef}
          className="ar-viewer"
          src={modelUrl}
          ar
          ar-modes="scene-viewer webxr quick-look"
          ar-placement="floor"
          ar-scale="fixed"
          camera-controls
          touch-action="pan-y"
          auto-rotate
          rotation-per-second="18deg"
          shadow-intensity="0.85"
          shadow-softness="0.72"
          exposure="1"
          camera-orbit="35deg 68deg 4.2m"
          min-camera-orbit="auto 48deg 2.2m"
          max-camera-orbit="auto 82deg 6.2m"
          interaction-prompt="none"
        >
          <button className="button primary ar-launch" slot="ar-button">
            <Camera size={17} /> Открыть в AR
          </button>
        </model-viewer>

        <div className="ar-panel">
          <p className="eyebrow">AR-модель кухни РМ</p>
          <h1>Поставьте кухню на пол и передвиньте к углу</h1>
          <p>
            Размер демо-модели настроен под кухню 2200×2400 мм. После запуска AR наведите телефон
            на пол, поставьте модель и пальцем сдвиньте ее к нужному углу.
          </p>
          <button className="button primary" type="button" onClick={openAr}>
            <Camera size={17} /> Смотреть в AR
          </button>
          <small>
            {status === 'loading'
              ? 'Загружаю 3D-модель...'
              : 'Если AR не открылся автоматически, нажмите кнопку.'}
          </small>
        </div>
      </section>
    </main>
  );
}

function ConstructorExperience() {
  const [sizePresetId, setSizePresetId] = useState('original');
  const [scheme, setScheme] = useState('corner');
  const [cornerSide, setCornerSide] = useState('right');
  const [layout, setLayout] = useState(defaultLayout);
  const [materialId, setMaterialId] = useState('graphite-quartz');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [arReady, setArReady] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const dragCounter = useRef(0);

  const material = materials.find((m) => m.id === materialId) ?? materials[0];
  const sizePreset = kitchenSizePresets.find((p) => p.id === sizePresetId) ?? kitchenSizePresets[1];
  const selectedModules = layout.map(getModuleById).filter(Boolean);

  const baseWidth = useMemo(
    () => selectedModules.filter((m) => m.type === 'base' || m.type === 'tall').reduce((s, m) => s + m.width, 0),
    [selectedModules],
  );

  const safeIndex = Math.min(selectedIndex, Math.max(0, selectedModules.length - 1));
  const selectedModule = selectedModules[safeIndex];
  const fitStatus = baseWidth > sizePreset.mainWall ? 'warning' : 'ready';

  const arUrl = buildArLink({ sizePreset, material, scheme, cornerSide, layout });
  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(arUrl)}&size=260&margin=1`;

  const requestText = `${pilotKitchen.title}\nСхема: ${scheme === 'straight' ? 'прямая' : `угловая, угол ${cornerSide === 'right' ? 'вправо' : 'влево'}`}\nРазмер: ${sizePreset.mainWall}×${sizePreset.sideWall} мм\nМатериал: ${material.name}\nМодули: ${selectedModules.map((m) => m.title).join(', ')}`;

  // ── Preset ──────────────────────────────────────────────────────────────────
  const applyPreset = (preset) => {
    setSizePresetId(preset.id);
    setLayout(preset.layout);
    setSelectedIndex(0);
    setArReady(false);
  };

  // ── Module operations ───────────────────────────────────────────────────────
  const addModule = (id) => {
    setLayout((prev) => [...prev, id]);
    setSelectedIndex(layout.length);
    setArReady(false);
  };

  const removeModule = (index) => {
    setLayout((prev) => prev.filter((_, i) => i !== index));
    setSelectedIndex((cur) => Math.max(0, Math.min(cur, layout.length - 2)));
    setArReady(false);
  };

  const shiftModule = (index, dir) => {
    const next = index + dir;
    if (next < 0 || next >= layout.length) return;
    setLayout((prev) => {
      const arr = [...prev];
      [arr[index], arr[next]] = [arr[next], arr[index]];
      return arr;
    });
    setSelectedIndex(next);
    setArReady(false);
  };

  // ── Drag-and-drop reorder ───────────────────────────────────────────────────
  const onDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setDragIndex(index);
    dragCounter.current = 0;
  };

  const onDragEnter = (e, index) => {
    e.preventDefault();
    dragCounter.current++;
    setDragOverIndex(index);
  };

  const onDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current === 0) setDragOverIndex(null);
  };

  const onDrop = (e, toIndex) => {
    e.preventDefault();
    const fromIndex = Number(e.dataTransfer.getData('text/plain'));
    if (fromIndex !== toIndex) {
      setLayout((prev) => {
        const arr = [...prev];
        const [item] = arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, item);
        return arr;
      });
      setSelectedIndex(toIndex);
      setArReady(false);
    }
    setDragIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  const onDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  const tileClass = (index) => {
    let c = 'module-tile';
    if (safeIndex === index) c += ' active';
    if (dragIndex === index) c += ' dragging';
    if (dragOverIndex === index && dragIndex !== index) c += ' drag-over';
    return c;
  };

  return (
    <main>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="site-header">
        <div className="topbar">
          <span><MapPin size={13} /> Екатеринбург, ул. Холмистая 17В</span>
          <span><Phone size={13} /> +7 (343) 385-70-43</span>
        </div>
        <nav className="nav">
          <a className="brand" href="#constructor">
            <span className="brand-mark">РМ</span>
            <span>
              <strong>Кухни РМ</strong>
              <small>3D-конструктор и AR-примерка</small>
            </span>
          </a>
          <div className="nav-links">
            <a href="#constructor">Конструктор</a>
            <a href={arUrl}>AR</a>
            <a href="#request">Заявка</a>
          </div>
        </nav>
      </header>

      {/* ── Workspace ──────────────────────────────────────────────────────── */}
      <section id="constructor" className="workspace">

        {/* Left: product card */}
        <aside className="product-rail">
          <img src={heroImage} alt={pilotKitchen.title} />
          <div>
            <p className="eyebrow">Демо для фабрики кухни РМ</p>
            <h1>{pilotKitchen.title}</h1>
            <strong>{pilotKitchen.price}</strong>
            <a href={pilotKitchen.source} target="_blank" rel="noreferrer">
              Оригинал на сайте <ChevronRight size={13} />
            </a>
          </div>
        </aside>

        {/* Center: 3D builder */}
        <section className="builder-surface">
          <div className="builder-header">
            <div>
              <p className="eyebrow">Живой конструктор</p>
              <h2>Соберите кухню — смотрите в AR</h2>
            </div>
            <ol className="stepper">
              {[['Размер', <Ruler size={14} />], ['Модули', <Grid3X3 size={14} />], ['Цвет', <Palette size={14} />], ['AR', <Smartphone size={14} />]].map(([label, icon], i) => (
                <li key={label}>{icon}{i + 1}. {label}</li>
              ))}
            </ol>
          </div>

          <KitchenPreview
            layout={layout}
            material={material}
            wallLength={sizePreset.mainWall}
            sideLength={sizePreset.sideWall}
            scheme={scheme}
            cornerSide={cornerSide}
          />

          {/* Module strip */}
          <p className="strip-hint">
            <GripVertical size={13} /> Перетащите для перестановки · Нажмите для выбора · В панели справа — удалить или сдвинуть
          </p>
          <div className="module-strip" role="list">
            {selectedModules.map((item, index) => (
              <button
                key={`${item.id}-${index}`}
                role="listitem"
                className={tileClass(index)}
                type="button"
                draggable
                onClick={() => setSelectedIndex(index)}
                onDragStart={(e) => onDragStart(e, index)}
                onDragEnter={(e) => onDragEnter(e, index)}
                onDragLeave={onDragLeave}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, index)}
                onDragEnd={onDragEnd}
              >
                <span className={`tile-num type-${item.type}`}>{index + 1}</span>
                <strong>{item.title}</strong>
                <small>{MODULE_TYPE_LABEL[item.type]} · {item.width} мм</small>
              </button>
            ))}
            {selectedModules.length === 0 && (
              <p className="strip-empty">Нет модулей — добавьте из панели справа</p>
            )}
          </div>
        </section>

        {/* Right: controls */}
        <aside className="control-dock">

          {/* Size & scheme */}
          <section>
            <div className="dock-title"><Ruler size={17} /><strong>Размер кухни</strong></div>
            <div className="preset-grid">
              {kitchenSizePresets.map((preset) => (
                <button
                  key={preset.id}
                  className={preset.id === sizePresetId ? 'preset-card active' : 'preset-card'}
                  type="button"
                  onClick={() => applyPreset(preset)}
                >
                  <strong>{preset.title}</strong>
                  <span>{preset.mainWall}×{preset.sideWall}</span>
                  <small>{preset.description}</small>
                </button>
              ))}
            </div>

            <p className="dock-label">Планировка</p>
            <div className="segmented">
              <button className={scheme === 'straight' ? 'active' : ''} type="button"
                onClick={() => { setScheme('straight'); setArReady(false); }}>
                Прямая
              </button>
              <button className={scheme === 'corner' ? 'active' : ''} type="button"
                onClick={() => { setScheme('corner'); setArReady(false); }}>
                Угловая
              </button>
            </div>

            {scheme === 'corner' && (
              <>
                <p className="dock-label">Сторона угла</p>
                <div className="segmented">
                  <button className={cornerSide === 'left' ? 'active' : ''} type="button"
                    onClick={() => { setCornerSide('left'); setArReady(false); }}>
                    ← Влево
                  </button>
                  <button className={cornerSide === 'right' ? 'active' : ''} type="button"
                    onClick={() => { setCornerSide('right'); setArReady(false); }}>
                    Вправо →
                  </button>
                </div>
              </>
            )}
          </section>

          {/* Modules */}
          <section>
            <div className="dock-title"><Grid3X3 size={17} /><strong>Модули</strong></div>

            {selectedModule ? (
              <div className="selected-module">
                <div>
                  <span>Выбран</span>
                  <strong>{selectedModule.title}</strong>
                  <small>{selectedModule.width}×{selectedModule.height}×{selectedModule.depth} мм · {MODULE_TYPE_LABEL[selectedModule.type]}</small>
                </div>
                <div className="icon-actions">
                  <button type="button" aria-label="Влево" title="Сдвинуть влево" onClick={() => shiftModule(safeIndex, -1)}>
                    <MoveLeft size={15} />
                  </button>
                  <button type="button" aria-label="Вправо" title="Сдвинуть вправо" onClick={() => shiftModule(safeIndex, 1)}>
                    <MoveRight size={15} />
                  </button>
                  <button type="button" aria-label="Удалить" title="Удалить модуль" className="icon-delete" onClick={() => removeModule(safeIndex)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <p className="empty-hint">Добавьте модуль из списка ниже</p>
            )}

            <p className="dock-label">Добавить</p>
            <div className="module-picker">
              {kitchenModules.map((item) => (
                <button key={item.id} type="button" onClick={() => addModule(item.id)}>
                  <span className={`picker-dot type-${item.type}`}>{MODULE_TYPE_SHORT[item.type]}</span>
                  <Plus size={12} />
                  {item.title}
                </button>
              ))}
            </div>
          </section>

          {/* Color */}
          <section>
            <div className="dock-title"><Palette size={17} /><strong>Цвет фасадов</strong></div>
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

          {/* AR */}
          <section>
            <div className="dock-title"><QrCode size={17} /><strong>AR-примерка</strong></div>
            <div className={`fit ${fitStatus}`}>
              {fitStatus === 'ready' ? <Check size={15} /> : <Maximize2 size={15} />}
              {fitStatus === 'ready' ? `Влезает: ${baseWidth} / ${sizePreset.mainWall} мм` : `Не влезает: ${baseWidth} / ${sizePreset.mainWall} мм`}
            </div>
            <button className="button primary" type="button" onClick={() => setArReady(true)}>
              <Camera size={17} /> Сформировать QR для AR
            </button>
          </section>

        </aside>
      </section>

      {/* ── AR section ─────────────────────────────────────────────────────── */}
      <section id="ar-view" className={arReady ? 'ar-section visible' : 'ar-section'}>
        <div className="ar-copy">
          <p className="eyebrow">AR-сцена текущей сборки</p>
          <h2>QR открывает модель кухни на телефоне</h2>
          <p>
            На компьютере клиент видит QR. На телефоне открывается отдельная AR-страница без
            конструктора — можно поставить кухню на пол и сдвинуть ее к углу.
          </p>
          <div className="ar-actions">
            <a className="button ghost-dark" href={arUrl}>
              <Smartphone size={17} /> Открыть AR-ссылку
            </a>
            <a className="button ghost-dark" href="#request">
              <Mail size={17} /> Отправить расчёт
            </a>
          </div>
        </div>
        <div className="qr-card">
          {arReady ? (
            <img src={qrUrl} alt="QR для открытия AR-модели кухни" />
          ) : (
            <button type="button" onClick={() => setArReady(true)}>
              <QrCode size={40} />
              Сформировать QR
            </button>
          )}
          <small>Наведите камеру телефона</small>
        </div>
        <model-viewer
          className="model-viewer"
          src={modelUrl}
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-placement="floor"
          ar-scale="fixed"
          camera-controls
          auto-rotate
          shadow-intensity="0.7"
          exposure="0.95"
          interaction-prompt="none"
        >
          <button className="button primary ar-launch" slot="ar-button">
            <Camera size={17} /> Смотреть в AR
          </button>
        </model-viewer>
      </section>

      {/* ── Request form ───────────────────────────────────────────────────── */}
      <section id="request" className="request-section">
        <button
          className="collapse-button"
          type="button"
          onClick={() => setFormOpen((o) => !o)}
          aria-expanded={formOpen}
        >
          {formOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          Отправить заявку менеджеру
          {formOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {formOpen && (
          <form className="request-form" onSubmit={(e) => e.preventDefault()}>
            <input placeholder="Ваше имя" />
            <input placeholder="+7 (___) ___-__-__" type="tel" />
            <textarea value={requestText} readOnly rows={4} />
            <button className="button primary" type="submit">
              <Mail size={17} /> Отправить заявку
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
