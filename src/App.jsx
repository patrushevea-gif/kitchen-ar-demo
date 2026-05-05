import { useMemo, useState } from 'react';
import {
  Calculator,
  Camera,
  Clock3,
  Factory,
  Grid3X3,
  Mail,
  MapPin,
  Minus,
  Phone,
  Plus,
  Ruler,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import KitchenPreview from './components/KitchenPreview.jsx';
import { defaultLayout, kitchenModules, materials } from './data/kitchen.js';

const heroImage =
  'https://kitchenrm.ru/wa-data/public/shop/products/50/62/6250/images/10891/10891.970.jpg';

function moduleById(id) {
  return kitchenModules.find((item) => item.id === id);
}

export default function App() {
  const [wallLength, setWallLength] = useState(3200);
  const [scheme, setScheme] = useState('straight');
  const [layout, setLayout] = useState(defaultLayout);
  const [materialId, setMaterialId] = useState('graphite');

  const material = materials.find((item) => item.id === materialId) ?? materials[0];

  const totalWidth = useMemo(
    () =>
      layout
        .map(moduleById)
        .filter((item) => item && (item.type === 'base' || item.type === 'tall'))
        .reduce((sum, item) => sum + item.width, 0),
    [layout],
  );

  const addModule = (id) => setLayout((items) => [...items, id]);
  const removeLastModule = () => setLayout((items) => items.slice(0, -1));

  const requestText = `Кухня ${material.name}, схема ${
    scheme === 'straight' ? 'прямая' : 'угловая'
  }, стена ${wallLength} мм, модули: ${layout.map((id) => moduleById(id)?.title).join(', ')}`;

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
              <small>AR-примерка гарнитура</small>
            </span>
          </a>
          <div className="nav-links" aria-label="Разделы">
            <a href="#catalog">Каталог</a>
            <a href="#constructor">Конструктор</a>
            <a href="#materials">Материалы</a>
            <a href="#request">Заявка</a>
          </div>
        </nav>
      </header>

      <section id="top" className="hero">
        <img src={heroImage} alt="Кухня РМ Лайн Графит" />
        <div className="hero-copy">
          <p className="eyebrow">Демо для фабрики кухни РМ</p>
          <h1>Кухня Лайн Графит в AR</h1>
          <p>
            Клиент собирает гарнитур из модулей, меняет материалы и смотрит кухню в своем
            помещении через телефон.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#constructor">
              <Grid3X3 size={18} /> Собрать кухню
            </a>
            <a className="button ghost" href="#request">
              <Mail size={18} /> Отправить расчет
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
          <h2>Сценарий для кухни с сайта</h2>
          <p>
            Для первого показа достаточно одной линейки: точная геометрия модулей, 2-3 материала и
            понятная заявка менеджеру.
          </p>
        </div>
        <div className="catalog-grid">
          <article className="product-card">
            <img src={heroImage} alt="Лайн Графит" />
            <div>
              <h3>Лайн Графит</h3>
              <p>Матовые фасады, светлый корпус и столешница под камень.</p>
              <button className="inline-button" type="button" onClick={() => setMaterialId('graphite')}>
                Выбрать для AR
              </button>
            </div>
          </article>
          <article className="workflow-card">
            <Ruler />
            <h3>Модульная логика</h3>
            <p>
              Кухня не хранится одной моделью: она собирается из тумб, шкафов, пеналов и материалов.
            </p>
          </article>
        </div>
      </section>

      <section id="constructor" className="constructor">
        <div className="panel controls-panel">
          <div className="section-heading compact">
            <p className="eyebrow">Конфигуратор</p>
            <h2>Соберите примерную кухню</h2>
          </div>

          <label className="range-control">
            <span>Длина стены</span>
            <strong>{wallLength} мм</strong>
            <input
              type="range"
              min="2400"
              max="4800"
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
            <span className="control-label">Модули</span>
            {kitchenModules.map((item) => (
              <button key={item.id} className="module-chip" type="button" onClick={() => addModule(item.id)}>
                <Plus size={16} /> {item.title}
              </button>
            ))}
            <button className="module-chip muted" type="button" onClick={removeLastModule}>
              <Minus size={16} /> Убрать последний
            </button>
          </div>

          <div id="materials" className="swatches">
            <span className="control-label">Материалы</span>
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
              <p className="eyebrow">3D-превью</p>
              <h2>{material.name}</h2>
            </div>
            <span className={totalWidth > wallLength ? 'status warning' : 'status'}>
              {totalWidth} / {wallLength} мм
            </span>
          </div>
          <KitchenPreview layout={layout} material={material} wallLength={wallLength} scheme={scheme} />
          <div className="ar-row">
            <button className="button primary" type="button">
              <Camera size={18} /> Открыть AR
            </button>
            <p>На следующем этапе кнопка откроет GLB/USDZ-сцену в телефоне клиента.</p>
          </div>
        </div>
      </section>

      <section id="request" className="request-section">
        <div>
          <p className="eyebrow">Заявка менеджеру</p>
          <h2>Клиент отправляет уже собранный вариант</h2>
          <p>
            Менеджер получает размеры, выбранный материал, список модулей и может сразу начать расчет.
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
            <textarea value={requestText} readOnly rows="5" />
          </label>
          <button className="button primary" type="button">
            <Mail size={18} /> Отправить заявку
          </button>
        </form>
      </section>
    </main>
  );
}
