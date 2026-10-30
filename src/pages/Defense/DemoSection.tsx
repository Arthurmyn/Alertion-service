import { useNavigate } from 'react-router-dom';
import { DemoScenarioList } from '../../components/demo/DemoBar.tsx';
import { archives } from '../../data/archives.ts';
import {
  demoCatalog,
  demoRoute,
  demoState,
  demoStepCount,
} from '../../data/demoSteps.ts';
import { useStore } from '../../state/store.tsx';
import styles from './Defense.module.css';
import { sectionTitle } from './links.ts';

const versionA = archives['nan-v1.zip']?.label ?? '';
const versionB = archives['nan-v2.zip']?.label ?? '';

export function DemoSection() {
  const { dispatch } = useStore();
  const navigate = useNavigate();

  function start() {
    dispatch({ type: 'load', state: demoState(1) });
    navigate(demoRoute(1));
  }

  return (
    <section className={styles.section} id="demo" aria-labelledby="demo-title">
      <h2 id="demo-title">{sectionTitle.demo}</h2>
      <p>
        {`${demoStepCount} шагов: версия ${versionA}, архив больше лимита, публикация ${versionB}, возврат к ${versionA}.`}
      </p>
      <p>
        <button type="button" onClick={start}>
          Запустить демо
        </button>
      </p>
      {demoCatalog.map((group) => (
        <div key={group.id}>
          <h3>{group.title}</h3>
          <DemoScenarioList ids={group.ids} className={styles.stack} />
        </div>
      ))}
    </section>
  );
}
