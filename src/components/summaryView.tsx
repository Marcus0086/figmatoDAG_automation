"use client";

import ReactMarkdown from "react-markdown";

import { useActionStore } from "@/app/store/actionStore";

const SummaryView = ({ summary }: { summary?: string }) => {
  const { summary: actionsSummary } = useActionStore();

  return (
    <article className="prose prose-2xl !text-3xl prose-invert mx-auto min-w-full mt-6 p-6 rounded-lg border border-slate-700/20 bg-slate-900/20">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-light text-slate-200 tracking-wide mb-4">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-light text-slate-300 tracking-wide mt-6 mb-3">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-light text-slate-400 tracking-wide mt-4 mb-2">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-light text-slate-500 tracking-wide mt-3 mb-2">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-slate-400 text-sm font-light tracking-wide mb-3">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-2 mb-4 text-slate-400">
              {children}
            </ul>
          ),
          li: ({ children }) => (
            <li className="text-sm font-light tracking-wide">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-medium text-slate-300">{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-slate-700 pl-4 my-4 italic text-slate-500">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="bg-slate-800/50 px-1.5 py-0.5 rounded text-slate-300 text-sm font-mono">
              {children}
            </code>
          ),
        }}
      >
        {summary || actionsSummary}
      </ReactMarkdown>
    </article>
  );
};

export default SummaryView;
