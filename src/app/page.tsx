import ManualWorkflow from "@/components/manualWorkflow";
import Browser from "@/components/browser";
import DebugPanel from "@/components/debugPanel";

const Home = () => {
  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        <div className="w-full lg:w-1/3">
          <ManualWorkflow />
        </div>
        <div className="w-full lg:flex-1">
          <Browser />
        </div>
      </div>
      <DebugPanel />
    </main>
  );
};

export default Home;
