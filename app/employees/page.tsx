"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { Employee, Skill, Role } from "@/types/models";
import { Seniority } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeniority, setSelectedSeniority] = useState<string>("ALL");
  const [selectedSkill, setSelectedSkill] = useState<string>("ALL");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [editingEmployee, setEditingEmployee] =
    useState<Partial<Employee> | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    fetchEmployees();
    fetchSkills();
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, selectedSeniority, selectedSkill, selectedRole]);

  const fetchSkills = async () => {
    try {
      const response = await fetch("/api/skills");
      if (!response.ok) throw new Error("Failed to fetch skills");
      const data = await response.json();
      setSkills(data);
    } catch (error) {
      console.error("Error fetching skills:", error);
      toast({
        title: "Error",
        description: "Failed to fetch skills",
        variant: "destructive",
      });
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles");
      if (!response.ok) throw new Error("Failed to fetch roles");
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast({
        title: "Error",
        description: "Failed to fetch roles",
        variant: "destructive",
      });
    }
  };

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (debouncedSearchQuery.trim())
        queryParams.append("q", debouncedSearchQuery.trim());
      if (selectedSeniority !== "ALL")
        queryParams.append("seniority", selectedSeniority);
      if (selectedSkill !== "ALL") queryParams.append("skill", selectedSkill);
      if (selectedRole !== "ALL") queryParams.append("role", selectedRole);

      const response = await fetch(
        `/api/employees/search?${queryParams.toString()}`
      );
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    const isUpdate = !!editingEmployee.id;
    const endpoint = isUpdate
      ? `/api/employees/${editingEmployee.id}`
      : "/api/employees";
    const method = isUpdate ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingEmployee,
          skills: selectedSkills,
          roles: selectedRoles,
        }),
      });

      if (!response.ok) {
        throw new Error(
          isUpdate ? "Failed to update employee" : "Failed to create employee"
        );
      }

      await fetchEmployees();
      setEditingEmployee(null);
      setSelectedSkills([]);
      setSelectedRoles([]);
      setIsEditDialogOpen(false);

      toast({
        title: "Success",
        description: isUpdate
          ? "Employee updated successfully"
          : "Employee created successfully",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: isUpdate
          ? "Failed to update employee"
          : "Failed to create employee",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Employee Management</h1>
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-grow">
          <div className="relative">
            <Input
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <Select value={selectedSeniority} onValueChange={setSelectedSeniority}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Seniority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Seniority</SelectItem>
            <SelectItem value="INTERN">Intern</SelectItem>
            <SelectItem value="JUNIOR">Junior</SelectItem>
            <SelectItem value="SENIOR">Senior</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedSkill} onValueChange={setSelectedSkill}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Skill" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Skills</SelectItem>
            {skills.map((skill) => (
              <SelectItem key={skill.id} value={skill.name}>
                {skill.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.name}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            setEditingEmployee({ name: "", seniority: "JUNIOR" });
            setSelectedSkills([]);
            setSelectedRoles([]);
            setIsEditDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Employee
        </Button>
      </div>
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Seniority</TableHead>
              <TableHead>Current Project</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>
                  <Link
                    href={`/employees/${employee.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {employee.name}
                  </Link>
                </TableCell>
                <TableCell>{employee.seniority}</TableCell>
                <TableCell>
                  {employee.assignments?.length
                    ? employee.assignments[employee.assignments.length - 1]
                        .project.name
                    : "Not Assigned"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {employee.roles && employee.roles.length > 0
                      ? employee.roles.map((role) => (
                          <Badge key={role} variant="outline">
                            {role}
                          </Badge>
                        ))
                      : "No Roles"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {employee.skills && employee.skills.length > 0
                      ? employee.skills.map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))
                      : "No Skills"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingEmployee(employee);
                        setSelectedSkills(employee.skills ?? []);
                        setSelectedRoles(employee.roles ?? []);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        if (
                          confirm(
                            "Are you sure you want to delete this employee?"
                          )
                        ) {
                          try {
                            const response = await fetch(
                              `/api/employees/${employee.id}`,
                              { method: "DELETE" }
                            );
                            if (!response.ok)
                              throw new Error("Failed to delete employee");
                            await fetchEmployees();
                            toast({
                              title: "Success",
                              description: "Employee deleted successfully",
                            });
                          } catch (error) {
                            console.error("Error deleting employee:", error);
                            toast({
                              title: "Error",
                              description: "Failed to delete employee",
                              variant: "destructive",
                            });
                          }
                        }
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEmployee?.id ? "Edit Employee" : "Add Employee"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateOrUpdateEmployee}>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={editingEmployee?.name || ""}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee!,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label>Seniority</Label>
                <Select
                  value={editingEmployee?.seniority || "JUNIOR"}
                  onValueChange={(value) =>
                    setEditingEmployee({
                      ...editingEmployee!,
                      seniority: value as Seniority,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seniority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INTERN">Intern</SelectItem>
                    <SelectItem value="JUNIOR">Junior</SelectItem>
                    <SelectItem value="SENIOR">Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Skills</Label>
                <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
                  {skills.map((skill) => (
                    <div key={skill.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`skill-${skill.id}`}
                        value={skill.name}
                        checked={selectedSkills.includes(skill.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSkills((prev) => [...prev, skill.name]);
                          } else {
                            setSelectedSkills((prev) =>
                              prev.filter((selected) => selected !== skill.name)
                            );
                          }
                        }}
                      />
                      <label htmlFor={`skill-${skill.id}`} className="text-sm">
                        {skill.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Roles</Label>
                <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`role-${role.id}`}
                        value={role.name}
                        checked={selectedRoles.includes(role.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRoles((prev) => [...prev, role.name]);
                          } else {
                            setSelectedRoles((prev) =>
                              prev.filter((selected) => selected !== role.name)
                            );
                          }
                        }}
                      />
                      <label htmlFor={`role-${role.id}`} className="text-sm">
                        {role.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button type="submit">
                {editingEmployee?.id ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
