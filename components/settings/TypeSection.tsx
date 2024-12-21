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
import { addType, deleteType } from "@/actions/settings-actions";
import { Trash2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Type name must be at least 2 characters.",
  }),
});

type Type = {
  id: number;
  name: string;
};

export function TypesSection() {
  const [types, setTypes] = useState<Type[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    // Fetch existing types from the server
    const fetchTypes = async () => {
      // Replace this with actual API call
      const response = await fetch("/api/types");
      const data = await response.json();
      setTypes(data);
    };
    fetchTypes();
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const newType = await addType(values);
      setTypes([...types, newType]);
      form.reset();
    } catch (error) {
      console.error("Failed to add type:", error);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteType(id);
      setTypes(types.filter((type) => type.id !== id));
    } catch (error) {
      console.error("Failed to delete type:", error);
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
                <FormLabel>Type Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter type name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Add Type</Button>
        </form>
      </Form>
      <div>
        <h3 className="text-lg font-semibold mb-2">Existing Types</h3>
        <ul className="space-y-2">
          {types.map((type) => (
            <li key={type.id} className="flex items-center justify-between">
              <span>{type.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(type.id)}
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
