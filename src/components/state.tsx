import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import ImageViewer from "./imageViewer";

const State = () => {
  return (
    <Card className="w-1/2 rounded-lg border-none">
      <CardHeader>
        <CardTitle>Current Automation State</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-5rem)]">
        <div className="relative h-full w-full">
          <ImageViewer imagePath="/images/1_2.png" />
        </div>
      </CardContent>
    </Card>
  );
};

export default State;
