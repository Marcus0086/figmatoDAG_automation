"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DebugView from "@/components/debugView";
import SummaryView from "@/components/summaryView";
import FeedbackView from "@/components/feedbackView";

const DebugPanel = () => {
  return (
    <div className="overflow-hidden rounded-xl bg-gradient-to-b from-slate-800/50 via-slate-900/50 to-slate-950/50 backdrop-blur-xl border border-slate-700/10">
      <div className="px-8 py-6 border-b border-slate-800/10 bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-transparent">
        <h2 className="text-xl tracking-[0.15em] font-extralight text-slate-200 uppercase mb-6">
          Execution Log
        </h2>
        <Tabs defaultValue="debug" className="w-full">
          <TabsList className="bg-slate-900/50 border border-slate-700/20">
            <TabsTrigger
              value="debug"
              className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-200
                         text-sm tracking-[0.15em] uppercase font-light"
            >
              Debug
            </TabsTrigger>
            <TabsTrigger
              value="summary"
              className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-200
                         text-sm tracking-[0.15em] uppercase font-light"
            >
              Summary
            </TabsTrigger>
            <TabsTrigger
              value="feedback"
              className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-200
                         text-sm tracking-[0.15em] uppercase font-light"
            >
              Feedback
            </TabsTrigger>
          </TabsList>
          <TabsContent value="debug">
            <DebugView />
          </TabsContent>
          <TabsContent value="summary">
            <SummaryView />
          </TabsContent>
          <TabsContent value="feedback">
            <FeedbackView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DebugPanel;
