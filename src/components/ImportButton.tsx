import React from 'react';

type ImportButtonProps = {
    className?: string;
}

const ImportButton: React.FC<ImportButtonProps> = ({ className }) => {
  const handleImport = () => {
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'application/json';
    file.onchange = (e) => {
      const file = (e.target as HTMLInputElement)?.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (!text) return;
        const json = JSON.parse(text as string);
        for (const key in json) {
          localStorage.setItem(key, JSON.stringify(json[key]));
        }
      };
      reader.readAsText(file);
    };
    file.click();
  };

  return <button className={className} onClick={handleImport}>Import</button>;
};

export default ImportButton;
