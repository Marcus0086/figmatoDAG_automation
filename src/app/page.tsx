import FigmaFlow from "@/components/figma/figmaFlow";
import Browser from "@/components/browser";

const Home = () => {
  return (
    <main className="p-4 flex lg:flex-row flex-col items-center gap-4 justify-center h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">Figma Automation</h1>
        <FigmaFlow />
      </div>
      <Browser />
    </main>
  );
};

export default Home;
