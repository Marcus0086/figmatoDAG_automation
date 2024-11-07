"use client";

import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { openFigmaFile } from "@/lib/actions/figma";

const FigmaCredentialsCard = ({
  onCredentialsChange,
  onBuildDAG,
}: {
  onCredentialsChange: (credentials: {
    fileUrl: string;
    token: string;
  }) => void;
  onBuildDAG: (fileUrl: string, token: string) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.target as HTMLFormElement);
    const fileUrl = formData.get("figmaFileUrl") as string;
    const token = formData.get("figmaToken") as string;
    onCredentialsChange({ fileUrl, token });
    const response = await openFigmaFile(fileUrl);
    if (response.success) {
      onBuildDAG(fileUrl, token);
    }
    setIsLoading(false);
  };
  return (
    <Card className="bg-white dark:bg-gray-800 w-[350px] h-auto overflow-y-auto flex flex-col">
      <CardHeader>
        <CardTitle>Enter Figma Credentials</CardTitle>
        <CardDescription>
          Enter your Figma credentials to start a new automation. Before
          starting the automation, please login to your Figma account from the
          browser view.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFormSubmit}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="figmaEmail">Figma File URL</Label>
              <Input
                id="figmaFileUrl"
                placeholder="Your Figma file URL"
                name="figmaFileUrl"
                required
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="figmaToken">Figma token</Label>
              <Input
                id="figmaToken"
                placeholder="Your Figma token"
                name="figmaToken"
                type="password"
                required
              />
            </div>
          </div>
          <Button className="w-full mt-4" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                <h3 className="ml-2">Building DAG</h3>
              </>
            ) : (
              "Build DAG"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default FigmaCredentialsCard;
