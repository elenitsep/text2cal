import React, { useState } from 'react';
import { X, Copy, Check, FileCode, Download } from 'lucide-react';

interface IcsPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  icsContent: string;
  onDownload: () => void;
}

export const IcsPreviewModal: React.FC<IcsPreviewModalProps> = ({
  isOpen,
  onClose,
  icsContent,
  onDownload,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(icsContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-zinc-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 bg-zinc-50">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-zinc-700" />
            <h3 className="font-semibold text-sm text-zinc-900">RFC 5545 .ICS File Source</h3>
          </div>
          <button
            id="btn-close-modal"
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto flex-1 font-mono text-xs bg-zinc-950 text-emerald-400 select-all leading-relaxed whitespace-pre-wrap rounded-b-none">
          {icsContent}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-200 bg-zinc-50">
          <span className="text-xs text-zinc-500">
            {icsContent.split('\n').length} lines • Valid iCalendar 2.0
          </span>
          <div className="flex items-center gap-2">
            <button
              id="btn-copy-ics-modal"
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 text-xs font-medium text-zinc-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              id="btn-download-ics-modal"
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .ics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
