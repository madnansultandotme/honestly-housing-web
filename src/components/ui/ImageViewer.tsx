"use client";

import React, { useState } from 'react';

interface ImageViewerProps {
  images: string[];
  initialIndex?: number;
  onClose?: () => void;
}

export default function ImageViewer({ images, initialIndex = 0, onClose }: ImageViewerProps) {
  const [index, setIndex] = useState<number>(initialIndex);
  if (!images || images.length === 0) return null;

  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-4xl h-full max-h-[90vh] bg-transparent">
        <button
          onClick={() => (onClose ? onClose() : null)}
          className="absolute top-3 right-3 z-10 bg-white rounded-full p-2 shadow"
          aria-label="Close"
        >
          ✕
        </button>

        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow"
          aria-label="Previous"
        >
          ‹
        </button>

        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow"
          aria-label="Next"
        >
          ›
        </button>

        <div className="w-full h-full flex items-center justify-center">
          <img
            src={images[index]}
            alt={`Image ${index + 1} of ${images.length}`}
            className="max-h-[90vh] max-w-full object-contain rounded"
          />
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white text-sm">
          {index + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}
