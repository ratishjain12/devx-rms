import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RolesSection } from "@/components/settings/RolesSection";
import { SkillsSection } from "@/components/settings/SkillsSection";
import { TypesSection } from "@/components/settings/TypeSection";

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <Tabs defaultValue="roles" className="w-full">
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="types">Types</TabsTrigger>
        </TabsList>
        <TabsContent value="roles">
          <RolesSection />
        </TabsContent>
        <TabsContent value="skills">
          <SkillsSection />
        </TabsContent>
        <TabsContent value="types">
          <TypesSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
