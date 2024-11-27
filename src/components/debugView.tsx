"use client";

import Image from "next/image";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActionStore } from "@/app/store/actionStore";

const DebugView = ({
  onTabChange,
}: {
  onTabChange: (value: string) => void;
}) => {
  const {
    actions,
    isGeneratingSummary,
    summary,
    isAnalyseModalOpen,
    setIsAnalyseModalOpen,
  } = useActionStore();

  return (
    <div className="mt-6 rounded-lg border border-slate-700/20 bg-slate-900/20 max-h-[600px] overflow-auto relative">
      {isGeneratingSummary ? (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-20">
          <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700/30">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-200 rounded-full animate-spin" />
              <p className="text-slate-200">Analysing steps...</p>
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}

      {summary.length > 0 && !isGeneratingSummary && isAnalyseModalOpen ? (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-20">
          <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700/30 relative">
            <button
              onClick={() => setIsAnalyseModalOpen(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-200"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-slate-200 mb-2">
                  Analysis Complete!
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                  Your steps have been analyzed. Check the results in the
                  Summary tab.
                </p>
                <button
                  onClick={() => {
                    onTabChange("summary");
                    setIsAnalyseModalOpen(false);
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 transition-colors rounded-md text-slate-200 text-sm"
                >
                  View Summary
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}

      <Table>
        <TableHeader className="sticky top-0 bg-slate-900/90 backdrop-blur-sm z-10">
          <TableRow className="hover:bg-slate-800/50 border-slate-700/20">
            <TableHead className="text-slate-400 font-light tracking-wider">
              Step
            </TableHead>
            <TableHead className="text-slate-400 font-light tracking-wider">
              Time
            </TableHead>
            <TableHead className="text-slate-400 font-light tracking-wider">
              Before
            </TableHead>
            <TableHead className="text-slate-400 font-light tracking-wider">
              After
            </TableHead>
            <TableHead className="text-slate-400 font-light tracking-wider">
              Action
            </TableHead>
            <TableHead className="text-slate-400 font-light tracking-wider">
              Rationale
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {actions.map((entry) => (
            <TableRow
              key={entry.data.timestamp}
              className="hover:bg-slate-800/50 border-slate-700/20"
            >
              <TableCell className="text-center font-mono text-slate-400">
                #{entry.data.step}
              </TableCell>
              <TableCell className="text-sm text-slate-300 font-light">
                {entry.data.timestamp}
              </TableCell>
              <TableCell>
                <div className="relative w-[300px] h-[200px] rounded-lg overflow-hidden border border-slate-700/20">
                  <Image
                    src={entry.data.beforeImageUrl}
                    alt="Before"
                    fill
                    loading="lazy"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </TableCell>
              <TableCell>
                <div className="relative w-[300px] h-[200px] rounded-lg overflow-hidden border border-slate-700/20">
                  <Image
                    src={entry.data.annotatedImageUrl}
                    alt="After"
                    fill
                    loading="lazy"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm text-slate-300 font-light">
                  {entry.data.actionDescription}
                </p>
              </TableCell>
              <TableCell>
                <p className="text-sm text-slate-400 font-light italic">
                  {entry.data.rationale}
                </p>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DebugView;
