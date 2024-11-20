"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useActionStore } from "@/app/store/actionStore";

import { manualTesting } from "@/lib/actions/browser";

const ManualWorkflow = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { action, setAction } = useActionStore();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const journey = formData.get("journey") as string;
      const response = await manualTesting(journey);
      if (response.success && response.data) {
        setAction([
          ...action,
          {
            type: "manual",
            data: {
              action: response.data.action.action,
              annotatedImage: response.data.annotatedImage,
              flashImage: response.data.flashImage,
              boundingBox: response.data.action.boundingBox,
            },
          },
        ]);
      } else {
        console.error(response.error);
      }
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl bg-gradient-to-b from-slate-800/50 via-slate-900/50 to-slate-950/50 backdrop-blur-xl border border-slate-700/10">
      <div className="px-8 py-6 border-b border-slate-800/10 bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-transparent">
        <h2 className="text-xl tracking-[0.15em] font-extralight text-slate-200 uppercase">
          Manual Automation
        </h2>
      </div>
      <div className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <Textarea
              required
              placeholder="Describe your journey..."
              name="journey"
              className="w-full min-h-[200px] bg-slate-950/30 border-slate-700/20 rounded-lg 
                         text-slate-300 placeholder:text-slate-600 placeholder:text-sm placeholder:font-light
                         focus:ring-1 focus:ring-slate-500 focus:border-slate-500
                         tracking-wide font-light resize-none p-6
                         transition-all duration-300
                         group-hover:border-slate-600/50"
              rows={8}
            />
          </div>
          <div className="flex justify-end">
            <Button
              className="px-8 py-6 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 
                         hover:from-slate-700 hover:via-slate-600 hover:to-slate-700
                         text-slate-200 rounded-lg tracking-[0.1em] uppercase
                         text-sm font-light transition-all duration-500
                         border border-slate-600/20 hover:border-slate-500/30
                         disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-lg hover:shadow-xl"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Execute Journey"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualWorkflow;
