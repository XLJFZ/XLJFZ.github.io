import type {
  CustomLayerInterface,
  Map,
  MercatorCoordinate as Coordinate,
} from 'maplibre-gl';
import { projectElevatedPoint } from './planner-rooftops';

type ElevatedLocation = {
  lng: number;
  lat: number;
  altitude: number;
  ground: number;
  label: string;
};
export type RooftopScene = {
  enabled: boolean;
  camera: ElevatedLocation;
  subject: ElevatedLocation;
};

/** An always-visible annotation, projected from world XYZ rather than a pixel lift. */
export function createRooftopOverlay(
  map: Map,
  mercator: {
    fromLngLat: (
      point: { lng: number; lat: number },
      altitude?: number,
    ) => Coordinate;
  },
  readScene: () => RooftopScene,
): CustomLayerInterface {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('aria-label', '三维机位与楼顶连线');
  svg.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:hidden;';
  const line = (color: string, dashed = false) => {
    const node = document.createElementNS(ns, 'line');
    node.setAttribute('stroke', color);
    node.setAttribute('stroke-width', '2');
    if (dashed) node.setAttribute('stroke-dasharray', '4 4');
    svg.appendChild(node);
    return node;
  };
  const legs = [line('#d8c19b', true), line('#9fc9bf', true)];
  const sight = line('#f8e0ad');
  const pins = ['#d8c19b', '#9fc9bf'].map((color) => {
    const group = document.createElementNS(ns, 'g');
    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('r', '7');
    dot.setAttribute('fill', color);
    dot.setAttribute('stroke', '#171815');
    dot.setAttribute('stroke-width', '2');
    const text = document.createElementNS(ns, 'text');
    text.setAttribute('y', '-15');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('stroke', '#171815');
    text.setAttribute('stroke-width', '3');
    text.setAttribute('paint-order', 'stroke');
    text.setAttribute('font-size', '13');
    text.setAttribute('font-family', 'sans-serif');
    group.appendChild(dot);
    group.appendChild(text);
    svg.appendChild(group);
    return { group, text };
  });
  const setLine = (
    node: SVGLineElement,
    a: { x: number; y: number } | null,
    b: { x: number; y: number } | null,
  ) => {
    node.style.display = a && b ? '' : 'none';
    if (!a || !b) return;
    node.setAttribute('x1', String(a.x));
    node.setAttribute('y1', String(a.y));
    node.setAttribute('x2', String(b.x));
    node.setAttribute('y2', String(b.y));
  };
  return {
    id: 'planner-rooftop-overlay',
    type: 'custom',
    renderingMode: '3d',
    onAdd() {
      map.getCanvasContainer().appendChild(svg);
    },
    onRemove() {
      svg.remove();
    },
    render(_gl, options) {
      const scene = readScene();
      svg.style.display = scene.enabled ? '' : 'none';
      if (!scene.enabled) return;
      const canvas = map.getCanvas();
      const project = (location: ElevatedLocation, altitude: number) =>
        projectElevatedPoint(
          options.defaultProjectionData.mainMatrix,
          mercator.fromLngLat(location, altitude),
          canvas.clientWidth,
          canvas.clientHeight,
        );
      const points = [scene.camera, scene.subject].map((location, index) => {
        const top = project(location, location.altitude);
        const ground = project(location, location.ground);
        setLine(legs[index], ground, top);
        pins[index].group.style.display = top ? '' : 'none';
        if (top)
          pins[index].group.setAttribute(
            'transform',
            `translate(${top.x},${top.y})`,
          );
        pins[index].text.textContent = location.label;
        return top;
      });
      setLine(sight, points[0], points[1]);
    },
  };
}
