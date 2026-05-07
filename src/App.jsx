import '@google/model-viewer';
import { useMemo, useState } from 'react';
import {
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
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
  X,
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

function getModuleById(id) {
  return kitchenModules.find((m) => m.id === id);
}

function buildArLink({ sizePreset, material, scheme, cornerSide, layout }) {
  if (typeof window === 'undefined') return '#ar-view';
  const url = new URL(window.location.href);
  url.hash = 'ar-view';
  url.searchParams.set('size', `${sizePreset.mainWall}x${sizePreset.sideWall}`);
  url.searchParams.set('scheme', scheme);
  url.searchParams.set('corner', cornerSide);
  url.searchParams.set('material', material.id);
  url.searchParams.set('modules', layout.join(','));
  return url.toString();
}

// ── Компонент зоны ──────────────────────────────────────────────────────────
function ModuleZone({ label, sublabel, accent, types, allLayout, onAdd, onRemove, onSwap, facadeColor }) {
  const [showAdd, setShowAdd] = useState(false);

  const available = kitchenModules.filter((m) => types.includes(m.type));

  const items = allLayout
    .map((id, idx) => ({ id, idx, module: getModuleById(id) }))
    .filter(({ module }) => module && types.includes(module.type));

  const handleShift = (idx, dir) => {
    const zoneIdxs = items.map((it) => it.idx);
    const pos = zoneIdxs.indexOf(idx);
    const target = pos + dir;
    if (target < 0 || target >= zoneIdxs.length) return;
    onSwap(idx, zoneIdxs[target]);
  };

  return (
    <div className="module-zone" style={{ '--zone-accent': accent }}>
      <div className="zone-header">
        <div className="zone-title-group">
          <span className="zone-label">{label}</span>
          <span className="zone-sublabel">{sublabel}</span>
        </div>
        <button
          className={`zone-add-trigger${showAdd ? ' open' : ''}`}
          type="button"
          onClick={() => setShowAdd((s) => !s)}
        >
          {showAdd ? (
            <><X size={13} /> Закрыть</>
          ) : (
            <><Plus size={13} /> Добавить</>
          )}
        </button>
      </div>

      {showAdd && (
        <div className="zone-add-list">
          <span className="zone-add-hint">Выберите что добавить:</span>
          {available.map((m) => (
            <button
              key={m.id}
              type="button"
              className="zone-add-option"
              onClick={() => { onAdd(m.id); setShowAdd(false); }}
            >
              <Plus size={11} />
              {m.title}
              <span>{m.width} мм</span>
            </button>
          ))}
        </div>
      )}

      <div className="zone-cards">
        {items.length === 0 ? (
          <p className="zone-empty">
            Здесь пусто — нажмите «Добавить», чтобы поставить шкафы в этот ряд
          </p>
        ) : (
          items.map(({ id, idx, module }, pos) => (
            <div
              key={`${id}-${idx}`}
              className="zone-card"
              style={{ '--card-accent': facadeColor }}
            >
              <div className="zone-card-info">
                <strong>{module.title}</strong>
                <span>{module.width} мм</span>
              </div>
              <div className="zone-card-actions">
                <button
                  type="button"
                  onClick={() => handleShift(idx, -1)}
                  disabled={pos === 0}
                  title="Сдвинуть влево"
                >
                  <MoveLeft size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  title="Удалить"
                  className="action-delete"
                >
                  <Trash2 size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleShift(idx, 1)}
                  disabled={pos === items.length - 1}
                  title="Сдвинуть вправо"
                >
                  <MoveRight size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Главный компонент ───────────────────────────────────────────────────────
export default function App() {
  const [sizePresetId, setSizePresetId] = useState('original');
  const [scheme, setScheme] = useState('corner');
  const [cornerSide, setCornerSide] = useState('right');
  const [layout, setLayout] = useState(defaultLayout);
  const [materialId, setMaterialId] = useState('graphite-quartz');
  const [arReady, setArReady] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const material = materials.find((m) => m.id === materialId) ?? materials[0];
  const sizePreset = kitchenSizePresets.find((p) => p.id === sizePresetId) ?? kitchenSizePresets[1];
  const selectedModules = layout.map(getModuleById).filter(Boolean);

  const baseWidth = useMemo(
    () => selectedModules.filter((m) => m.type === 'base' || m.type === 'tall').reduce((s, m) => s + m.width, 0),
    [selectedModules],
  );

  const fitStatus = baseWidth > sizePreset.mainWall ? 'warning' : 'ready';
  const arUrl = buildArLink({ sizePreset, material, scheme, cornerSide, layout });
  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(arUrl)}&size=260&margin=1`;

  const requestText = `${pilotKitchen.title}\nСхема: ${scheme === 'straight' ? 'прямая' : `угловая, угол ${cornerSide === 'right' ? 'вправо' : 'влево'}`}\nРазмер: ${sizePreset.mainWall}×${sizePreset.sideWall} мм\nМатериал: ${material.name}\nМодули: ${selectedModules.map((m) => m.title).join(', ')}`;

  const applyPreset = (preset) => {
    setSizePresetId(preset.id);
    setLayout(preset.layout);
    setArReady(false);
  };

  const addModule = (id) => {
    setLayout((prev) => [...prev, id]);
    setArReady(false);
  };

  const removeModule = (index) => {
    setLayout((prev) => prev.filter((_, i) => i !== index));
    setArReady(false);
  };

  const swapModules = (i, j) => {
    setLayout((prev) => {
      const arr = [...prev];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
    setArReady(false);
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
            <a href="#ar-view">AR</a>
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

        {/* Center: 3D + zones */}
        <section className="builder-surface">
          <div className="builder-header">
            <div>
              <p className="eyebrow">Живой конструктор</p>
              <h2>Соберите кухню — смотрите в AR</h2>
            </div>
          </div>

          <KitchenPreview
            layout={layout}
            material={material}
            wallLength={sizePreset.mainWall}
            sideLength={sizePreset.sideWall}
            scheme={scheme}
            cornerSide={cornerSide}
          />

          {/* ── Две зоны модулей ──────────────────────────────────────────── */}
          <div className="module-zones">
            <ModuleZone
              label="Нижние шкафы и колонны"
              sublabel="Стоят на полу вдоль стен"
              accent="#2251c5"
              types={['tall', 'base']}
              allLayout={layout}
              onAdd={addModule}
              onRemove={removeModule}
              onSwap={swapModules}
              facadeColor={material.face}
            />
            <ModuleZone
              label="Верхние шкафы"
              sublabel="Навесные — крепятся к стене"
              accent="#167840"
              types={['wall']}
              allLayout={layout}
              onAdd={addModule}
              onRemove={removeModule}
              onSwap={swapModules}
              facadeColor={material.face}
            />
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

            {scheme === 'corner' && (
              <>
                <p className="dock-label">Сторона угла</p>
                <div className="segmented">
                  <button
                    className={cornerSide === 'left' ? 'active' : ''}
                    type="button"
                    onClick={() => { setCornerSide('left'); setArReady(false); }}
                  >
                    ← Влево
                  </button>
                  <button
                    className={cornerSide === 'right' ? 'active' : ''}
                    type="button"
                    onClick={() => { setCornerSide('right'); setArReady(false); }}
                  >
                    Вправо →
                  </button>
                </div>
              </>
            )}
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
              {fitStatus === 'ready'
                ? `Влезает: ${baseWidth} / ${sizePreset.mainWall} мм`
                : `Не влезает: ${baseWidth} / ${sizePreset.mainWall} мм`}
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
            На компьютере клиент видит QR. На телефоне открывается эта же сборка с кнопкой
            AR — можно поставить кухню в свою комнату.
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
