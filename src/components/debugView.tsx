"use client";

import { useEffect, useState } from "react";
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

interface DebugEntry {
  step: number;
  timestamp: string;
  beforeImage: string;
  annotatedImage: string;
  actionDescription: string;
  rationale: string;
  boundingBox?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

const DebugView = () => {
  const [debugEntries, setDebugEntries] = useState<DebugEntry[]>([]);
  const { action } = useActionStore();

  useEffect(() => {
    if (action && action.length > 0) {
      setDebugEntries(
        action.map((a, index) => ({
          step: index + 1,
          timestamp: new Date().toISOString(),
          beforeImage: a.data.beforeImageUrl,
          annotatedImage: a.data.annotatedImageUrl,
          actionDescription: a.data.actionDescription,
          rationale: a.data.rationale,
          boundingBox: a.data.action?.boundingBox || undefined,
        }))
      );
    }
  }, [action]);

  return (
    <div className="mt-6 rounded-lg border border-slate-700/20 bg-slate-900/20 max-h-[600px] overflow-auto">
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
          {debugEntries.map((entry) => (
            <TableRow
              key={entry.step}
              className="hover:bg-slate-800/50 border-slate-700/20"
            >
              <TableCell className="text-center font-mono text-slate-400">
                #{entry.step}
              </TableCell>
              <TableCell className="text-sm text-slate-300 font-light">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </TableCell>
              <TableCell>
                <div className="relative w-[300px] h-[200px] rounded-lg overflow-hidden border border-slate-700/20">
                  <Image
                    src={entry.beforeImage}
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
                    src={entry.annotatedImage}
                    alt="After"
                    fill
                    loading="lazy"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-slate-300 font-light">
                    {entry.actionDescription}
                  </p>
                  {entry.boundingBox && (
                    <pre className="text-xs text-slate-400 font-mono bg-slate-800/50 p-2 rounded">
                      {JSON.stringify(entry.boundingBox, null, 2)}
                    </pre>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm text-slate-400 font-light italic">
                  {entry.rationale}
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
