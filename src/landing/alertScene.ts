import {
  Color,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  OrthographicCamera,
  PMREMGenerator,
  Scene,
  Shape,
  WebGLRenderer,
  type BufferGeometry,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export type FieldVariant = 'hero' | 'closing';

interface Placement {
  /** Centre as a share of the half width and half height, from -1 to 1. */
  x: number;
  y: number;
  /** Size relative to the largest figure. */
  size: number;
  /** Distance behind the picture plane, in world units. */
  z: number;
  turn: number;
  tilt: number;
  phase: number;
  pace: number;
}

const at = (
  x: number,
  y: number,
  size: number,
  z: number,
  turn: number,
  tilt: number,
  phase: number,
  pace: number,
): Placement => ({ x, y, size, z, turn, tilt, phase, pace });

/** Figures keep to the edges so the headline and the call to action stay clear. */
const wide: Record<FieldVariant, readonly Placement[]> = {
  hero: [
    at(-0.84, 0.6, 0.72, 0, 0.5, 0.12, 0, 1),
    at(0.86, 0.7, 0.48, -1, -0.6, -0.1, 2.1, 0.8),
    at(-0.6, -0.7, 0.44, -1.5, 0.7, 0.16, 4.2, 1.1),
    at(0.64, -0.66, 0.66, 0.5, -0.45, -0.14, 1.3, 0.9),
  ],
  closing: [
    at(-0.82, 0.2, 1.0, 0, 0.5, 0.1, 0.6, 0.9),
    at(0.84, -0.2, 1.12, 0, -0.5, -0.12, 2.6, 1),
    at(0.55, 0.8, 0.48, -2.5, 0.3, 0.15, 4.4, 1.2),
  ],
};

const narrow: Record<FieldVariant, readonly Placement[]> = {
  hero: [
    at(-0.74, -0.04, 0.5, 0, 0.5, 0.12, 0, 1),
    at(0.8, -0.2, 0.38, -1, -0.6, -0.1, 2.1, 0.8),
    at(-0.62, -0.6, 0.4, -1, 0.6, 0.14, 4.2, 1.1),
    at(0.72, -0.62, 0.5, 0.5, -0.45, -0.14, 1.3, 0.9),
  ],
  closing: [
    at(-0.78, 0.82, 0.64, 0, 0.5, 0.1, 0.6, 0.9),
    at(0.78, -0.82, 0.72, 0, -0.5, -0.12, 2.6, 1),
  ],
};

/** A polygon with softened corners, so the edges catch light like moulded plastic. */
function rounded(points: readonly [number, number][], radius: number): Shape {
  const shape = new Shape();
  const count = points.length;
  points.forEach(([vx, vy], index) => {
    const [px, py] = points[(index + count - 1) % count]!;
    const [nx, ny] = points[(index + 1) % count]!;
    const toward = (tx: number, ty: number): [number, number] => {
      const length = Math.hypot(tx - vx, ty - vy);
      return [
        vx + ((tx - vx) / length) * radius,
        vy + ((ty - vy) / length) * radius,
      ];
    };
    const [ax, ay] = toward(px, py);
    const [bx, by] = toward(nx, ny);
    if (index === 0) shape.moveTo(ax, ay);
    else shape.lineTo(ax, ay);
    shape.quadraticCurveTo(vx, vy, bx, by);
  });
  shape.closePath();
  return shape;
}

const corners: readonly [number, number][] = [
  [0, 1],
  [-1, -0.74],
  [1, -0.74],
];
const centre = corners.reduce((sum, [, y]) => sum + y, 0) / corners.length;

/** The triangle's corners scaled about its centre and moved so the centre is the origin. */
function triangle(scale: number): [number, number][] {
  return corners.map(([x, y]) => [x * scale, (y - centre) * scale]);
}

function moulded(
  shape: Shape,
  depth: number,
  bevel: number,
  segments = 5,
): ExtrudeGeometry {
  return new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.9,
    bevelSegments: segments,
    curveSegments: 14,
  });
}

function buildParts() {
  const body = moulded(rounded(triangle(0.9), 0.3), 0.36, 0.11, 7);

  const ring = rounded(triangle(0.68), 0.2);
  ring.holes.push(rounded(triangle(0.58), 0.16));
  const frame = moulded(ring, 0.03, 0.018, 3);

  const bar = moulded(
    rounded(
      [
        [-0.105, 0.32],
        [0.105, 0.32],
        [0.058, -0.2],
        [-0.058, -0.2],
      ],
      0.05,
    ),
    0.04,
    0.02,
    3,
  );

  const dot = new Shape();
  dot.absarc(0, 0, 0.085, 0, Math.PI * 2, false);
  const point = moulded(dot, 0.04, 0.02, 3);

  return { body, frame, bar, point };
}

export function mountAlertScene(
  canvas: HTMLCanvasElement,
  variant: FieldVariant,
): () => void {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch {
    // No WebGL: the page reads the same without the figures.
    return () => undefined;
  }

  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(new Color(0x000000), 0);

  const scene = new Scene();
  const environment = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = environment.fromScene(room, 0.04).texture;
  scene.environmentIntensity = 0.55;

  const key = new DirectionalLight(0xffffff, 1.3);
  key.position.set(-3, 5, 6);
  scene.add(key);

  /* Flat projection keeps figures at the page edges from stretching. */
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 60);
  camera.position.z = 14;

  const redPlastic = new MeshPhysicalMaterial({
    color: 0xc41a1a,
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.16,
  });
  const blackPlastic = new MeshPhysicalMaterial({
    color: 0x1c1b1b,
    roughness: 0.38,
    clearcoat: 0.7,
    clearcoatRoughness: 0.25,
  });
  const parts = buildParts();

  const bodyFront = 0.36 + 0.11;
  const figures = new Group();
  scene.add(figures);

  const build = (): Group => {
    const group = new Group();
    const add = (
      geometry: BufferGeometry,
      material: MeshPhysicalMaterial,
      z: number,
      y = 0,
    ) => {
      const mesh = new Mesh(geometry, material);
      mesh.position.set(0, y, z);
      group.add(mesh);
    };
    add(parts.body, redPlastic, -0.18);
    add(parts.frame, blackPlastic, bodyFront - 0.2);
    add(parts.bar, blackPlastic, bodyFront - 0.2, 0.2);
    add(parts.point, blackPlastic, bodyFront - 0.2, -0.3);
    return group;
  };

  let placements: readonly Placement[] = [];
  let wrappers: Group[] = [];
  let unit = 1;
  let halfWidth = 1;
  let halfHeight = 1;

  const arrange = () => {
    figures.clear();
    placements = (halfWidth / halfHeight < 0.8 ? narrow : wide)[variant];
    wrappers = placements.map(() => {
      const wrapper = new Group();
      wrapper.add(build());
      figures.add(wrapper);
      return wrapper;
    });
  };

  let narrowLayout = false;
  const resize = () => {
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    renderer.setSize(width, height, false);
    halfHeight = 4;
    halfWidth = (halfHeight * width) / height;
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    unit = Math.min(1.05, Math.max(0.6, halfWidth / 4.4));
    const nowNarrow = halfWidth / halfHeight < 0.8;
    if (!wrappers.length || nowNarrow !== narrowLayout) {
      narrowLayout = nowNarrow;
      arrange();
    }
  };

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onPointer = (event: PointerEvent) => {
    pointer.tx = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (event.clientY / window.innerHeight) * 2 - 1;
  };

  const draw = (seconds: number) => {
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;
    placements.forEach((p, index) => {
      const wrapper = wrappers[index]!;
      const t = seconds * p.pace + p.phase;
      const depth = 1 + (p.z + 3) * 0.12;
      wrapper.scale.setScalar(p.size * unit * 1.05);
      wrapper.position.set(
        p.x * halfWidth + Math.cos(t * 0.4) * 0.1 - pointer.x * 0.12 * depth,
        p.y * halfHeight + Math.sin(t * 0.6) * 0.2 + pointer.y * 0.08 * depth,
        p.z,
      );
      wrapper.rotation.set(
        Math.sin(t * 0.3) * 0.16 + pointer.y * 0.08,
        p.turn + Math.sin(t * 0.35) * 0.5 + pointer.x * 0.16,
        p.tilt + Math.sin(t * 0.25) * 0.07,
      );
    });
    renderer.render(scene, camera);
  };

  resize();
  const observer = new ResizeObserver(() => {
    resize();
    if (still) draw(2);
  });
  observer.observe(canvas);

  let frame = 0;
  let visible = true;
  const started = performance.now();
  const loop = (now: number) => {
    frame = requestAnimationFrame(loop);
    if (!visible || document.hidden) return;
    draw((now - started) / 1000);
  };

  const watcher = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
  });
  watcher.observe(canvas);

  if (still) {
    draw(2);
  } else {
    frame = requestAnimationFrame(loop);
    window.addEventListener('pointermove', onPointer, { passive: true });
  }
  canvas.dataset.ready = 'true';

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('pointermove', onPointer);
    observer.disconnect();
    watcher.disconnect();
    for (const geometry of Object.values(parts)) geometry.dispose();
    redPlastic.dispose();
    blackPlastic.dispose();
    room.dispose();
    environment.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };
}
