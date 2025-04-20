import React, { useEffect, useRef } from "react";

const Modal = ({ isOpen, onClose, title, children }) => {
  const mouseDownTargetIsBackdrop = useRef(false);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handleMouseDownOnBackdrop = (e) => {
    mouseDownTargetIsBackdrop.current = e.target === e.currentTarget;
  };

  const handleClickOnBackdrop = () => {
    if (mouseDownTargetIsBackdrop.current) {
      onClose();
    }
    mouseDownTargetIsBackdrop.current = false;
  };

  const handleMouseUpGlobal = () => {
    mouseDownTargetIsBackdrop.current = false;
  };

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUpGlobal);
    return () => {
      document.removeEventListener("mouseup", handleMouseUpGlobal);
    };
  }, []);

  if (!isOpen) {
    return null;
  }

  const handleContentInteraction = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/10 transition-opacity duration-300 ease-in-out"
      onMouseDown={handleMouseDownOnBackdrop}
      onClick={handleClickOnBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl transition-transform duration-300 ease-in-out scale-95 opacity-0 animate-modal-scale-in" // Increased max-w-2xl
        onMouseDown={handleContentInteraction}
        onClick={handleContentInteraction}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer z-10"
          aria-label="Close modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        {title && (
          <h2
            id="modal-title"
            className="text-xl font-semibold text-indigo-800 mb-4"
          >
            {title}
          </h2>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
