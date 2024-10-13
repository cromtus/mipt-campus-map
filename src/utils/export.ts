import Konva from 'konva';
import { exportStageSVG } from 'react-konva-to-svg';
import { jsPDF } from 'jspdf';
import normalFont from '../../assets/Arial.ttf';
import boldFont from '../../assets/Arial Bold.ttf';
import 'svg2pdf.js';

export const exportSVG = async (stage: Konva.Stage) => {
  const svg = await exportStageSVG(stage);
  downloadContent(svg, 'campus.svg', 'image/svg+xml');
};

export const exportPDF = async (stage: Konva.Stage) => {
  const svg = await exportStageSVG(stage);
  const el = document.createElement('div');
  el.innerHTML = svg;
  document.body.appendChild(el);
  const svgElement = el.firstChild as SVGElement;
  const width = svgElement.clientWidth;
  const height = svgElement.clientHeight;
  const doc = new jsPDF({
    format: [width, height],
    unit: 'px',
    orientation: 'landscape',
    filters: ['ASCIIHexEncode']
  })
  await addFontByUrl(doc, normalFont, 'Arial', 'normal');
  await addFontByUrl(doc, boldFont, 'Arial', 'bold');
  await doc.svg(svgElement, { x: 0, y: 0, width, height });
  doc.save('campus.pdf');
  // document.body.removeChild(el);
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

async function addFontByUrl(doc: jsPDF, url: string, fontName: string, fontStyle: string) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = btoa(
    Array.from(new Uint8Array(arrayBuffer)).map(byte => String.fromCharCode(byte)).join('')
  );
  const filename = url.split('/').pop() ?? `${Date.now()}.ttf`;
  doc.addFileToVFS(filename, base64);
  doc.addFont(filename, fontName, fontStyle);
}