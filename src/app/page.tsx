import ManualWorkflow from "@/components/manualWorkflow";
import Browser from "@/components/browser";
import DebugPanel from "@/components/debugPanel";

const Home = () => {
  return (
    <main className="flex flex-col gap-6">
      <div className="flex gap-6 h-screen">
        <div className="w-1/3">
          <ManualWorkflow />
        </div>
        <Browser />
      </div>
      <DebugPanel />
    </main>
  );
};

export default Home;
