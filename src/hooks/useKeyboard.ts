import { useState, useEffect } from 'react';

interface UseKeyboardProps {
  onDelete?: () => void;
  onCancel?: () => void;
}

export const useKeyboard = ({ onDelete, onCancel }: UseKeyboardProps = {}) => {
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') setIsCtrlPressed(true);
      if (e.key === 'Delete' && onDelete) {
        onDelete();
      }
      if (e.key === 'c' && onCancel) {
        onCancel();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') setIsCtrlPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onDelete, onCancel]);

  return { isCtrlPressed };
};