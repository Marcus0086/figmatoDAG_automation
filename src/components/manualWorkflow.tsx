"use client";

import Image from "next/image";
import { Loader2, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useBrowserAutomation } from "@/hooks/useBrowserAutomation";

import { uploadToS3 } from "@/lib/s3";

const ManualWorkflow = () => {
  const { runAutomation, setUrlHandler, isLoading, error, cancelAutomation } =
    useBrowserAutomation();
  const [url, setUrl] = useState("");
  const [isUrlSet, setIsUrlSet] = useState(false);
  const [isSettingUrl, setIsSettingUrl] = useState(false);
  const [attributes, setAttributes] = useState({
    productFamiliarity: 0.5,
    patience: 0.5,
    techSavviness: 0.5,
    domainFamiliarity: 0.5,
    industryExpertise: 0.5,
  });

  const [imageUrl, setImageUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleImageUpload = async (image: File) => {
    if (!image) return;
    setIsUploading(true);
    try {
      const buffer = await image.arrayBuffer(); // Convert image to buffer
      const imageBuffer = Buffer.from(buffer);
      const key = `ground_truth/${uuidv4()}.png`; // Generate UUID with timestamp
      const url = await uploadToS3(imageBuffer, key); // Upload image to S3 and get the URL
      setImageUrl(url);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.log(error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      await handleImageUpload(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
    },
    disabled: !isUrlSet,
  });

  const mapAttributesToRequest = (attrs: typeof attributes) => ({
    productFamiliarity:
      attrs.productFamiliarity === 0
        ? "NOVICE"
        : attrs.productFamiliarity === 0.5
        ? "INTERMEDIATE"
        : "EXPERT",
    patience: attrs.patience,
    techSavviness:
      attrs.techSavviness === 0
        ? "LOW"
        : attrs.techSavviness === 0.5
        ? "MEDIUM"
        : "HIGH",
    domainFamiliarity:
      attrs.domainFamiliarity === 0
        ? "NOVICE"
        : attrs.domainFamiliarity === 0.5
        ? "INTERMEDIATE"
        : "EXPERT",
    industryExpertise:
      attrs.industryExpertise === 0
        ? "LOW"
        : attrs.industryExpertise === 0.5
        ? "MEDIUM"
        : "HIGH",
  });

  const handleSetUrl = async () => {
    if (!url) return;

    setIsSettingUrl(true);
    try {
      const response = await setUrlHandler(url);
      if (response.success) {
        setIsUrlSet(true);
        toast.success("URL set successfully");
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to set URL");
    } finally {
      setIsSettingUrl(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    const journey = formData.get("journey") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    try {
      await runAutomation({
        journey,
        title,
        attributes: mapAttributesToRequest(attributes),
        groundTruth: {
          img: imageUrl,
          description: description || undefined,
        },
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <div className="h-full rounded-xl bg-gradient-to-b from-slate-800/50 via-slate-900/50 to-slate-950/50 backdrop-blur-xl border border-slate-700/10">
      <div className="px-8 py-6 border-b border-slate-800/10 bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-transparent">
        <h2 className="text-xl tracking-[0.15em] font-extralight text-slate-200 uppercase">
          User Simulation
        </h2>
      </div>
      <div className="p-8">
        {/* URL Input Section */}
        <div className="mb-8 space-y-4">
          <Label htmlFor="url" className="text-slate-400">
            Target URL
          </Label>
          <div className="flex gap-2">
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL..."
              className="flex-1 bg-slate-600/30 border-slate-700/20 text-slate-300
                         placeholder:text-slate-400/80 focus:ring-slate-500
                         focus:border-slate-500"
            />
            <Button
              onClick={handleSetUrl}
              disabled={!url || isSettingUrl}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200"
            >
              {isSettingUrl ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Setting...
                </>
              ) : (
                "Set URL"
              )}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="relative group">
            <Textarea
              required
              disabled={!isUrlSet}
              placeholder="Describe your journey..."
              name="journey"
              className="w-full min-h-[200px] bg-slate-600/30 border-slate-700/20 rounded-lg !text-lg
                         text-slate-300 placeholder:text-slate-400/80 placeholder:text-lg placeholder:font-light
                         focus:ring-1 focus:ring-slate-500 focus:border-slate-500
                         tracking-wide font-light resize-none p-6
                         transition-all duration-300
                         group-hover:border-slate-600/50
                         disabled:opacity-50 disabled:cursor-not-allowed"
              rows={10}
            />
          </div>

          <Label htmlFor="success" className="text-slate-400 mb-2 block">
            Show us how success looks like
          </Label>

          <div
            {...getRootProps()}
            className={`h-40 relative flex items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 ${
              isDragActive
                ? "border-slate-500 bg-slate-700/30 animate-pulse"
                : "border-slate-700/20 bg-slate-600/30"
            } ${!isUrlSet ? "opacity-50 cursor-not-allowed" : ""}`}
            style={{
              backgroundImage:
                "radial-gradient(circle, #2d3748 1px, transparent 1px)",
              backgroundSize: "10px 10px",
            }}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                <div className="animate-spin">
                  <svg
                    className="w-8 h-8 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m0 14v1m8-8h1M4 12H3m15.364-6.364l.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707"
                    />
                  </svg>
                </div>
              </div>
            ) : imageUrl ? (
              <div className="relative">
                <Image
                  src={imageUrl}
                  alt="Uploaded Thumbnail"
                  width={128}
                  height={128}
                  unoptimized={true}
                  className="object-cover rounded-lg border border-slate-700/20"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p className="text-slate-400 mt-2">
                Drag {"n"} drop an image here, or click to select one
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-400">
              Success Description (optional)
            </Label>
            <Textarea
              id="description"
              name="description"
              disabled={!isUrlSet}
              placeholder="Describe what success looks like in words..."
              className="w-full bg-slate-600/30 border-slate-700/20 text-slate-300
                         placeholder:text-slate-400/80 focus:ring-slate-500
                         focus:border-slate-500"
              rows={3}
            />
          </div>

          <div className="space-y-6">
            <h2 className="text-slate-400 text-lg font-light tracking-wide">
              User Attributes
            </h2>
            <div className="w-full">
              <Label htmlFor="title" className="text-slate-400 mb-2 block">
                Title
              </Label>
              <Select name="title" required disabled={!isUrlSet}>
                <SelectTrigger className="w-full bg-slate-600/30 border-slate-700/20 text-slate-300 focus:ring-slate-500 focus:ring-1 disabled:opacity-50">
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
                domainFamiliarity: "Domain Familiarity",
                industryExpertise: "Industry Expertise",
              }).map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <Label className="text-slate-400">{label}</Label>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500 text-sm">Low</span>
                    <div className="flex-1 relative">
                      <Slider
                        disabled={!isUrlSet}
                        className="cursor-grab disabled:opacity-50 disabled:cursor-not-allowed"
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

          <div className="flex items-center justify-end gap-4">
            {isLoading && (
              <Button
                className="px-8 py-6 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 
                         hover:from-slate-700 hover:via-slate-600 hover:to-slate-700
                         text-slate-200 rounded-lg tracking-[0.1em] uppercase
                         text-sm font-light transition-all duration-500
                         border border-slate-600/20 hover:border-slate-500/30
                         disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-lg hover:shadow-xl"
                onClick={cancelAutomation}
              >
                Cancel Automation
              </Button>
            )}
            <Button
              className="px-8 py-6 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 
                         hover:from-slate-700 hover:via-slate-600 hover:to-slate-700
                         text-slate-200 rounded-lg tracking-[0.1em] uppercase
                         text-sm font-light transition-all duration-500
                         border border-slate-600/20 hover:border-slate-500/30
                         disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-lg hover:shadow-xl"
              type="submit"
              disabled={isLoading || !isUrlSet}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Simulating...
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
