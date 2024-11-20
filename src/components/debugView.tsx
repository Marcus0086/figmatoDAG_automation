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
  timestamp: string;
  annotatedImage: string;
  flashImage: string;
  action: string;
}

const DebugView = () => {
  const [debugEntries, setDebugEntries] = useState<DebugEntry[]>([]);

  const { action } = useActionStore();

  useEffect(() => {
    setDebugEntries(
      action.map((a) => ({
        timestamp: new Date().toISOString(),
        annotatedImage: a.data.annotatedImage,
        flashImage: a.data.flashImage,
        action: a.data.action + "\n" + JSON.stringify(a.data.boundingBox),
      }))
    );
  }, [action]);

  return (
    <div className="mt-6 rounded-lg border border-slate-700/20 bg-slate-900/20 max-h-[600px] overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-slate-900/90 backdrop-blur-sm z-10">
          <TableRow className="hover:bg-slate-800/50 border-slate-700/20">
            <TableHead className="text-slate-400 font-light tracking-wider">
              Timestamp
            </TableHead>
            <TableHead className="text-slate-400 font-light tracking-wider">
              Annotated Image
            </TableHead>
            <TableHead className="text-slate-400 font-light tracking-wider">
              Flash Detection
            </TableHead>
            <TableHead className="text-slate-400 font-light tracking-wider">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {debugEntries.map((entry, index) => (
            <TableRow
              key={index}
              className="hover:bg-slate-800/50 border-slate-700/20"
            >
              <TableCell className="text-sm text-slate-300 font-light">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </TableCell>
              <TableCell>
                <div className="relative w-[400px] h-[300px] rounded-lg overflow-hidden border border-slate-700/20">
                  <Image
                    src={entry.annotatedImage}
                    alt="Annotated"
                    fill
                    className="object-cover"
                  />
                </div>
              </TableCell>
              <TableCell>
                <div className="relative w-[400px] h-[300px] rounded-lg overflow-hidden border border-slate-700/20">
                  <Image
                    src={entry.flashImage}
                    alt="Flash"
                    fill
                    className="object-cover"
                  />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-center items-center h-full">
                  <pre className="text-xs text-slate-300 font-mono bg-slate-800/50 p-4 rounded-lg border border-slate-700/20">
                    {entry.action}
                  </pre>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DebugView;
