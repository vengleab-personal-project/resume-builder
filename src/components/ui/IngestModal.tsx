"use client";

import React from 'react';
import { X, Upload as UploadIcon } from 'lucide-react';
import { Upload } from '@/features/Upload';

interface IngestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IngestModal = ({ isOpen, onClose }: IngestModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <UploadIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Ingest Resume</h2>
              <p className="text-xs text-slate-500">Upload or paste your resume to get started</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <Upload />
        </div>
      </div>
    </div>
  );
};
