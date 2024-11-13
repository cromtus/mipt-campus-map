import { useState, useEffect } from 'react';

interface UseKeyboardProps {
  onDelete?: () => void;
  onCancelEdge?: () => void;
}

export const useKeyboard = ({ onDelete, onCancelEdge }: UseKeyboardProps = {}) => {
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') setIsCtrlPressed(true);
      if (e.key === 'Delete' && onDelete) {
        onDelete();
      }
      if (e.key === 'c' && onCancelEdge) {
        onCancelEdge();
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
  }, [onDelete, onCancelEdge]);

  return { isCtrlPressed };
};