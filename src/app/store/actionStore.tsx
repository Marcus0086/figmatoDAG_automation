"use client";

import { createContext, useContext, useState } from "react";
interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface ActionData {
  beforeImageUrl: string;
  annotatedImageUrl: string;
  actionDescription: string;
  rationale: string;
  action: {
    elementName: string;
    boundingBox: BoundingBox | null;
  };
}

interface Action {
  data: ActionData;
}

interface ActionContextType {
  action: Action[];
  summary: string;
  setAction: (action: Action[]) => void;
  setSummary: (summary: string) => void;
}

const ActionContext = createContext<ActionContextType | undefined>(undefined);

export const useActionStore = () => {
  const context = useContext(ActionContext);
  if (!context) {
    throw new Error("useActionStore must be used within a ActionProvider");
  }
  return context;
};

export const ActionProvider = ({ children }: { children: React.ReactNode }) => {
  const [action, setAction] = useState<Action[]>([]);
  const [summary, setSummary] = useState<string>("");
  return (
    <ActionContext.Provider
      value={{
        action,
        setAction,
        summary,
        setSummary,
      }}
    >
      {children}
    </ActionContext.Provider>
  );
};
