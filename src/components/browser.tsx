"use client";

import { useEffect, useState } from "react";
import { MonitorPlay } from "lucide-react";

import { startBrowser } from "@/lib/actions/browser";
import { BROWSER_VNC_URL, ENV } from "@/lib/constants";

const Browser = () => {
  const iframeUrl = `${BROWSER_VNC_URL}/vnc.html?autoconnect=true&resize=remote&reconnect=true&quality=9`;
  const [isBrowserStarted, setIsBrowserStarted] = useState(false);

  const handleStartBrowser = async () => {
    const response = await startBrowser();
    if (response.success) {
      setIsBrowserStarted(true);
    } else {
      console.error(response.error);
    }
  };

  useEffect(() => {
    if (!isBrowserStarted) {
      handleStartBrowser();
    }
  }, [isBrowserStarted]);
  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-800 rounded-lg h-full w-full">
      <header className="bg-white dark:bg-gray-800 shadow-sm p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Browser View
        </h2>
      </header>
      <div className="flex-1 p-4">
        {iframeUrl && ENV !== "development" ? (
          <iframe
            src={iframeUrl}
            className="w-full h-full border-0 rounded-lg"
            title="Playwright Browser View"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-lg">
            <MonitorPlay className="h-24 w-24 text-gray-400" />
          </div>
        )}
      </div>
    </main>
  );
};

export default Browser;
