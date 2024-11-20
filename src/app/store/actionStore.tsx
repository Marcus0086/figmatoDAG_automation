"use client";

import { createContext, useContext, useState } from "react";

interface Action {
  type: string;
  data: {
    annotatedImage: string;
    flashImage: string;
    action: string;
    boundingBox: {
      minX: number;
      minY: number;
      maxX: number;
      maxY: number;
    };
  };
}

interface ActionContextType {
  action: Action[];
  setAction: (action: Action[]) => void;
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

  return (
    <ActionContext.Provider
      value={{
        action,
        setAction,
      }}
    >
      {children}
    </ActionContext.Provider>
  );
};
