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
import { addRole, deleteRole } from "@/actions/settings-actions";
import { Trash2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Role name must be at least 2 characters.",
  }),
});

type Role = {
  id: number;
  name: string;
};

export function RolesSection() {
  const [roles, setRoles] = useState<Role[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    // Fetch existing roles from the server
    const fetchRoles = async () => {
      // Replace this with actual API call
      const response = await fetch("/api/roles");
      const data = await response.json();
      setRoles(data);
    };
    fetchRoles();
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const newRole = await addRole(values);
      setRoles([...roles, newRole]);
      form.reset();
    } catch (error) {
      console.error("Failed to add role:", error);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteRole(id);
      setRoles(roles.filter((role) => role.id !== id));
    } catch (error) {
      console.error("Failed to delete role:", error);
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
                <FormLabel>Role Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter role name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Add Role</Button>
        </form>
      </Form>
      <div>
        <h3 className="text-lg font-semibold mb-2">Existing Roles</h3>
        <ul className="space-y-2">
          {roles.map((role) => (
            <li key={role.id} className="flex items-center justify-between">
              <span>{role.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(role.id)}
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
