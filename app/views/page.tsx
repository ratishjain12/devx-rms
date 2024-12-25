import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectsChart from "@/components/views/projects/ProjectsChart";

const Page = () => {
  return (
    <div className="px-4">
      <Tabs defaultValue="Project" className="w-full">
        <TabsList>
          <TabsTrigger value="Project">Project</TabsTrigger>
          <TabsTrigger value="Employee">Employee</TabsTrigger>
        </TabsList>
        <TabsContent value="Project">
          <ProjectsChart />
        </TabsContent>
        <TabsContent value="Employee">
          {/* Employee content will go here */}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Page;
