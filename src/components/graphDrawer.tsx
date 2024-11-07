"use client";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
} from "@/components/ui/drawer";
import GraphComponent from "@/components/graph";

import { useGraphStore } from "@/app/store/graphStore";

const GraphDrawer = () => {
  const { graph } = useGraphStore();
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open Graph</Button>
      </DrawerTrigger>
      <DrawerContent className="h-full sm:!w-full">
        <div className="p-4 w-full h-full">
          <DrawerHeader>
            <DrawerTitle>Figma DAG</DrawerTitle>
            <DrawerDescription>
              Select a starting node and ending node to start the workflow.
            </DrawerDescription>
          </DrawerHeader>
          <div className="mt-3 w-full h-full">
            <GraphComponent graph={graph} />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default GraphDrawer;
