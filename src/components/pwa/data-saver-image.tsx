"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

interface DataSaverImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  dataSaverEnabled?: boolean;
}

/**
 * DataSaverImage — Lazy loads images based on Data Saver setting.
 * When Data Saver is on, shows a placeholder until user taps to load.
 * This saves mobile data for employees in Egypt.
 */
export function DataSaverImage({
  src,
  alt,
  className = "",
  width,
  height,
  dataSaverEnabled = false,
}: DataSaverImageProps) {
  const [loaded, setLoaded] = useState(!dataSaverEnabled);
  const [imageError, setImageError] = useState(false);

  if (dataSaverEnabled && !loaded) {
    return (
      <button
        onClick={() => setLoaded(true)}
        className={`flex items-center justify-center bg-gray-100 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10 transition-colors ${className}`}
        style={{ width, height, minHeight: height || 120 }}
        title="Tap to load image"
      >
        <div className="text-center p-4">
          <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-400">Tap to load</p>
        </div>
      </button>
    );
  }

  if (imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-white/5 rounded-xl ${className}`}
        style={{ width, height, minHeight: height || 120 }}
      >
        <ImageIcon className="h-8 w-8 text-gray-300" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      width={width || 400}
      height={height || 300}
      loading="lazy"
      onError={() => setImageError(true)}
    />
  );
}
