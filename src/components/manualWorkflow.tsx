"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useActionStore } from "@/app/store/actionStore";

import { manualTesting } from "@/lib/actions/browser";

const ManualWorkflow = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { setAction, setSummary } = useActionStore();
  const [attributes, setAttributes] = useState({
    productFamiliarity: 0.5,
    patience: 0.5,
    techSavviness: 0.5,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const journey = formData.get("journey") as string;
      const title = formData.get("title") as string;

      const response = await manualTesting(journey, title, attributes);
      if (response.success) {
        // Transform the steps into action store format
        const actions = response.stepsTaken.map((step) => ({
          data: {
            beforeImageUrl: step.beforeImageUrl,
            annotatedImageUrl: step.annotatedImageUrl,
            actionDescription: step.actionDescription,
            rationale: step.rationale,
            action: {
              elementName: step.action.elementName,
              boundingBox: step.action.boundingBox,
            },
          },
        }));

        // Add the summary as the last action
        if (response.summary) {
          setSummary(response.summary);
        }

        setAction(actions);
      }
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="overflow-hidden h-full rounded-xl bg-gradient-to-b from-slate-800/50 via-slate-900/50 to-slate-950/50 backdrop-blur-xl border border-slate-700/10">
      <div className="px-8 py-6 border-b border-slate-800/10 bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-transparent">
        <h2 className="text-xl tracking-[0.15em] font-extralight text-slate-200 uppercase">
          User Simulation
        </h2>
      </div>
      <div className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="relative group">
            <Textarea
              required
              placeholder="Describe your journey..."
              name="journey"
              className="w-full min-h-[200px] bg-slate-600/30 border-slate-700/20 rounded-lg !text-lg
                         text-slate-300 placeholder:text-slate-400/80 placeholder:text-lg placeholder:font-light
                         focus:ring-1 focus:ring-slate-500 focus:border-slate-500
                         tracking-wide font-light resize-none p-6
                         transition-all duration-300
                         group-hover:border-slate-600/50"
              rows={10}
            />
          </div>

          <div className="space-y-6">
            <h2 className="text-slate-400 text-lg font-light tracking-wide">
              User Attributes
            </h2>
            <div className="w-full">
              <Label htmlFor="title" className="text-slate-400 mb-2 block ">
                Title
              </Label>
              <Select name="title" required>
                <SelectTrigger className="w-full bg-slate-600/30 border-slate-700/20 text-slate-300 focus:ring-slate-500 focus:ring-1">
                  <SelectValue
                    placeholder="Select a title"
                    className="text-slate-400"
                  />
                </SelectTrigger>
                <SelectContent className="bg-slate-900/90 backdrop-blur-xl border-slate-700/20">
                  <SelectItem
                    value="supply_manager"
                    className="text-slate-300 focus:bg-slate-800 focus:text-slate-200"
                  >
                    Supply Manager
                  </SelectItem>
                  <SelectItem
                    value="account_manager"
                    className="text-slate-300 focus:bg-slate-800 focus:text-slate-200"
                  >
                    Account Manager
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {Object.entries({
                productFamiliarity: "Product Familiarity",
                patience: "Patience",
                techSavviness: "Tech Savviness",
              }).map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <Label className="text-slate-400">{label}</Label>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500 text-sm">Low</span>
                    <div className="flex-1 relative">
                      <Slider
                        className="cursor-grab"
                        value={[attributes[key as keyof typeof attributes]]}
                        onValueChange={(value) =>
                          setAttributes((prev) => ({
                            ...prev,
                            [key]: value[0],
                          }))
                        }
                        min={0}
                        max={1}
                        step={0.5}
                        defaultValue={[0.5]}
                      />
                      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-slate-500 text-sm">
                        Medium
                      </span>
                    </div>
                    <span className="text-slate-500 text-sm">High</span>
                  </div>
                </div>
              ))}
            </div>
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
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Simulating...
                </>
              ) : (
                "Simulate"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualWorkflow;
