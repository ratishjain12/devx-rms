"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { addSkill, deleteSkill } from "@/actions/settings-actions";
import { Trash2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Skill name must be at least 2 characters.",
  }),
});

type Skill = {
  id: number;
  name: string;
};

export function SkillsSection() {
  const [skills, setSkills] = useState<Skill[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    // Fetch existing skills from the server
    const fetchSkills = async () => {
      // Replace this with actual API call
      const response = await fetch("/api/skills");
      const data = await response.json();
      setSkills(data);
    };
    fetchSkills();
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const newSkill = await addSkill(values);
      setSkills([...skills, newSkill]);
      form.reset();
    } catch (error) {
      console.error("Failed to add skill:", error);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteSkill(id);
      setSkills(skills.filter((skill) => skill.id !== id));
    } catch (error) {
      console.error("Failed to delete skill:", error);
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Skill Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter skill name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Add Skill</Button>
        </form>
      </Form>
      <div>
        <h3 className="text-lg font-semibold mb-2">Existing Skills</h3>
        <ul className="space-y-2">
          {skills.map((skill) => (
            <li key={skill.id} className="flex items-center justify-between">
              <span>{skill.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(skill.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
