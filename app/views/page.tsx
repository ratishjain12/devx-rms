import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const page = () => {
  return (
    <div className="px-4">
      <Tabs defaultValue="Project" className="w-[400px]">
        <TabsList>
          <TabsTrigger value="Project">Project</TabsTrigger>
          <TabsTrigger value="Employee">Employee</TabsTrigger>
        </TabsList>
        <TabsContent value="Project"></TabsContent>
        <TabsContent value="Employee"></TabsContent>
      </Tabs>
    </div>
  );
};

export default page;
