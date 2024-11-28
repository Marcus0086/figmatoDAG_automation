"use client";

import { MonitorPlay } from "lucide-react";

import { BROWSER_VNC_URL, ENV } from "@/lib/constants";

const Browser = () => {
  const iframeUrl = `${BROWSER_VNC_URL}/vnc.html?autoconnect=true&resize=scale&reconnect=true&quality=9`;
  return (
    <div className="w-full h-screen lg:h-full overflow-hidden rounded-xl bg-gradient-to-b from-slate-800/50 via-slate-900/50 to-slate-950/50 backdrop-blur-xl border border-slate-700/10">
      <div className="px-8 py-6 border-b border-slate-800/10 bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-transparent flex items-center justify-between">
        <h2 className="text-xl tracking-[0.15em] font-extralight text-slate-200 uppercase">
          Browser View
        </h2>
        <div className="flex items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-700/20">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm text-slate-400 tracking-wide font-light">
            Active Session
          </span>
        </div>
      </div>
      <div className="h-full overflow-hidden bg-gradient-to-b from-slate-900/30 to-slate-950/30 rounded-lg border border-slate-700/20 shadow-lg">
        {iframeUrl && ENV !== "development" ? (
          <iframe
            src={iframeUrl}
            className="w-full h-full rounded-lg border border-slate-700/20 bg-slate-950/30
                       shadow-lg transition-all duration-300 hover:shadow-xl"
            title="Browser View"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center 
                          bg-gradient-to-b from-slate-900/30 to-slate-950/30 
                          rounded-lg border border-slate-700/20 shadow-lg"
          >
            <MonitorPlay className="h-24 w-24 text-slate-600 mb-6" />
            <span className="text-slate-400 tracking-[0.1em] uppercase text-sm font-light">
              Browser View Inactive
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Browser;
