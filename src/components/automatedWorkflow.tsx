import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AutomatedWorkflow = () => {
  return (
    <Card className="rounded-lg border-none">
      <CardHeader>
        <CardTitle>Automated</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-[calc(100%-5rem)]">
        <Button className="mt-auto bg-blue-600 hover:bg-blue-700">
          Start Automation
        </Button>
      </CardContent>
    </Card>
  );
};

export default AutomatedWorkflow;
