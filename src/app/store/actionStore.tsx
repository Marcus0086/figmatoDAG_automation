"use client";

import {
  createContext,
  useContext,
  useState,
  Dispatch,
  SetStateAction,
} from "react";
export interface ActionData {
  timestamp: string;
  step: number;
  beforeImageUrl: string;
  annotatedImageUrl: string;
  actionDescription: string;
  actionInput: string[];
  rationale: string;
}

interface Action {
  data: ActionData;
}

interface ActionContextType {
  actions: Action[];
  summary: string;
  setActions: Dispatch<SetStateAction<Action[]>>;
  setSummary: Dispatch<SetStateAction<string>>;
  isGeneratingSummary: boolean;
  setIsGeneratingSummary: Dispatch<SetStateAction<boolean>>;
  isAnalyseModalOpen: boolean;
  setIsAnalyseModalOpen: Dispatch<SetStateAction<boolean>>;
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
  const [actions, setActions] = useState<Action[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [isGeneratingSummary, setIsGeneratingSummary] =
    useState<boolean>(false);
  const [isAnalyseModalOpen, setIsAnalyseModalOpen] = useState<boolean>(true);
  return (
    <ActionContext.Provider
      value={{
        actions,
        setActions,
        summary,
        setSummary,
        isGeneratingSummary,
        setIsGeneratingSummary,
        isAnalyseModalOpen,
        setIsAnalyseModalOpen,
      }}
    >
      {children}
    </ActionContext.Provider>
  );
};
