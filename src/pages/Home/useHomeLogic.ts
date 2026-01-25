"use client";

import { useRef } from 'react';

export const useHomeLogic = () => {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return {
    contentRef,
    handlePrint
  };
};
