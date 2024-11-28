"use client";

import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface AuthContextType {
  username: string;
  password: string;
  setAuth: Dispatch<SetStateAction<{ username: string; password: string }>>;
}

const AuthContext = createContext<AuthContextType>({
  username: "",
  password: "",
  setAuth: () => {},
});

const STORAGE_KEY = "auth_credentials";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [auth, setAuth] = useState(() => {
    // Initialize from localStorage if available
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : { username: "", password: "" };
    }
    return { username: "", password: "" };
  });

  const [showModal, setShowModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    // Check credentials on mount
    const storedAuth = localStorage.getItem(STORAGE_KEY);
    if (!storedAuth) {
      setShowModal(true);
    } else {
      const parsedAuth = JSON.parse(storedAuth);
      if (!validateCredentials(parsedAuth.username, parsedAuth.password)) {
        setShowModal(true);
        localStorage.removeItem(STORAGE_KEY);
      } else {
        setAuth(parsedAuth);
      }
    }
  }, []);

  const validateCredentials = (username: string, password: string) => {
    // Add your validation logic here
    return username === "featurely.ai" && password === "featurely@ai"; // Example validation
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsValidating(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      if (validateCredentials(username, password)) {
        const newAuth = { username, password };
        setAuth(newAuth);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newAuth));
        setShowModal(false);
        toast.success("Successfully authenticated");
      } else {
        toast.error("Invalid credentials");
      }
    } catch (error) {
      console.error(error);
      toast.error("Authentication failed");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <AuthContext.Provider value={{ ...auth, setAuth }}>
      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          if (!auth.username || !auth.password) {
            toast.error("Please authenticate to continue");
            return;
          }
          setShowModal(open);
        }}
        modal={true}
      >
        <DialogContent
          className="sm:max-w-md bg-slate-900 border border-slate-800"
          onPointerDownOutside={(e) => {
            if (!auth.username || !auth.password) {
              e.preventDefault();
              toast.error("Please authenticate to continue");
            }
          }}
          onEscapeKeyDown={(e) => {
            if (!auth.username || !auth.password) {
              e.preventDefault();
              toast.error("Please authenticate to continue");
            }
          }}
        >
          <DialogHeader className="relative">
            <DialogTitle className="text-slate-200">
              Authentication Required
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-400">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                className="bg-slate-800 border-slate-700 text-slate-200"
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-400">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="bg-slate-800 border-slate-700 text-slate-200"
                placeholder="Enter password"
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-slate-700 hover:bg-slate-600 text-slate-200"
                disabled={isValidating}
              >
                {isValidating ? "Authenticating..." : "Login"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
