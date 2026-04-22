import React, { Component, ErrorInfo, ReactNode, Suspense } from 'react';

// Error Boundary Component
export class ImageErrorBoundary extends Component<{children: ReactNode, fallback: ReactNode}, {hasError: boolean}> {
  constructor(props: {children: ReactNode, fallback: ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Image loading error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Image Cache for Suspense
const imageCache = new Map<string, Promise<void> | boolean>();

export const SuspenseImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
  let status = imageCache.get(src);

  if (status === undefined) {
    const promise = new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        imageCache.set(src, true);
        resolve();
      };
      img.onerror = () => {
        imageCache.set(src, false);
        reject(new Error(`Failed to load image: ${src}`));
      };
    });
    imageCache.set(src, promise);
    throw promise; // Suspend
  }

  if (status instanceof Promise) {
    throw status; // Suspend
  }

  if (status === false) {
    throw new Error(`Failed to load image: ${src}`); // Trigger ErrorBoundary
  }

  return <img src={src} alt={alt} className={className} />;
};
