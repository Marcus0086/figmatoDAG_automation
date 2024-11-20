import ManualWorkflow from "@/components/manualWorkflow";
import Browser from "@/components/browser";
import DebugPanel from "@/components/debugPanel";

const Home = () => {
  return (
    <main className="flex flex-col gap-8">
      <div className="flex gap-8 h-screen">
        <div className="w-1/3 flex flex-col gap-8">
          <ManualWorkflow />
        </div>
        <Browser />
      </div>
      <DebugPanel />
    </main>
  );
};

export default Home;
