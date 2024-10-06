import Konva from 'konva';
import { exportStageSVG } from 'react-konva-to-svg';

export const exportSVG = async (stage: Konva.Stage) => {
  const svg = await exportStageSVG(stage);
  downloadContent(svg, 'campus.svg', 'image/svg+xml');
};

export const localStorageKeys: string[] = []

export const exportJSON = () => {
  const object: Record<string, any> = {}
  for (const key of localStorageKeys) {
    object[key] = JSON.parse(localStorage.getItem(key) ?? '{}');
  }
  const json = JSON.stringify(object);
  downloadContent(json, 'campus.json', 'application/json');
};

const downloadContent = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
