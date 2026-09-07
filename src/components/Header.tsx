import React from 'react';
import { Calendar, FileText, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
            <Calendar className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900">Text2Cal</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                v1.0 • RFC 5545
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Raw plain text in, ready-to-import <code className="font-mono text-zinc-700 bg-zinc-100 px-1 py-0.5 rounded">.ics</code> calendar file out
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200">
            <Sparkles className="w-3.5 h-3.5 text-zinc-600" />
            <span>LLM Structured Extraction</span>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200">
            <FileText className="w-3.5 h-3.5 text-zinc-600" />
            <span>Apple • Google • Outlook Compatible</span>
          </div>
        </div>
      </div>
    </header>
  );
};
