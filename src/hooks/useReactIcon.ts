import React, { useEffect, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { IconType } from 'react-icons/lib/iconBase';

const useReactIcon = (iconComponent: IconType, color?: string) => {
  const [ icon, setIcon ] = useState<HTMLImageElement | null>(null)
  useEffect(() => {
    const img = new window.Image();
    const svg = renderToString(React.createElement(iconComponent, { color }))
    img.src = 'data:image/svg+xml;base64,' + window.btoa(svg);
    img.onload = () => setIcon(img)
  }, [iconComponent])

  return icon;
};

export default useReactIcon;
