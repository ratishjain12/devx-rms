"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Search, Plus, Edit, Trash2, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import CollapsibleTableCell from "@/components/ui/CollapsibleCell";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchSkills = useCallback(async () => {
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
  }, []);

  const fetchRoles = useCallback(async () => {
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
  }, []);

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/employees");
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      setEmployees(data);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
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
  }, [itemsPerPage]);

  const handleCreateOrUpdateEmployee = useCallback(
    async (e: React.FormEvent) => {
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
    },
    [editingEmployee, selectedSkills, selectedRoles, fetchEmployees]
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchSkills();
    fetchRoles();
  }, [
    fetchEmployees,
    fetchSkills,
    fetchRoles,
    debouncedSearchQuery,
    selectedSeniority,
    selectedSkill,
    selectedRole,
    currentPage,
  ]);

  // Filter and paginate employees
  const filteredEmployees = employees
    .filter((employee) => {
      const matchesSearch = employee.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesSeniority =
        selectedSeniority === "ALL" || employee.seniority === selectedSeniority;
      const matchesSkill =
        selectedSkill === "ALL" || employee.skills.includes(selectedSkill);
      const matchesRole =
        selectedRole === "ALL" || employee.roles.includes(selectedRole);
      return matchesSearch && matchesSeniority && matchesSkill && matchesRole;
    })
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Employees</h1>
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-grow">
          <div className="relative">
            <Input
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
              <SelectItem
                key={skill.id}
                value={skill.name}
                className="capitalize"
              >
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
        <>
          <Table className="border rounded-sm">
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
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell className="capitalize">
                    {employee.seniority.toLowerCase()}
                  </TableCell>
                  <TableCell>
                    <div className="relative group">
                      {employee.assignments &&
                      employee.assignments.length > 0 ? (
                        <div>
                          {/* Get unique projects */}
                          {(() => {
                            // Use a Set to store unique project names
                            const uniqueProjects = new Set<string>();
                            employee.assignments.forEach((assignment) => {
                              uniqueProjects.add(assignment.project.name);
                            });

                            // Convert the Set back to an array
                            const uniqueProjectNames =
                              Array.from(uniqueProjects);

                            return (
                              <span className="capitalize flex items-center">
                                {uniqueProjectNames[0]}{" "}
                                {/* Display the first project name */}
                                {uniqueProjectNames.length > 1 && (
                                  <span className="border rounded-full flex items-center justify-center w-[28px] h-[28px] text-sm ml-2">
                                    {`+${uniqueProjectNames.length - 1}`}
                                  </span>
                                )}
                              </span>
                            );
                          })()}

                          {/* Show tooltip with all unique projects */}
                          {employee.assignments.length > 1 && (
                            <div className="absolute left-0 top-full mt-1 hidden w-48 bg-white border border-gray-200 rounded-md shadow-md group-hover:block z-10">
                              <div className="p-2 text-sm">
                                {(() => {
                                  // Use a Set to store unique project names
                                  const uniqueProjects = new Set<string>();
                                  employee.assignments.forEach((assignment) => {
                                    uniqueProjects.add(assignment.project.name);
                                  });

                                  // Convert the Set back to an array and render
                                  return Array.from(uniqueProjects).map(
                                    (projectName, index) => (
                                      <div key={index}>{projectName}</div>
                                    )
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {employee.roles && employee.roles.length > 0 && (
                        <CollapsibleTableCell
                          items={employee.roles}
                          maxVisible={1}
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {employee.skills && employee.skills.length > 0 && (
                        <CollapsibleTableCell items={employee.skills} />
                      )}
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
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/employees/${employee.id}`)}
                      >
                        <Eye className="h-4 w-4" />
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
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredEmployees.length > 0 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(Math.max(1, currentPage - 1));
                      }}
                      aria-disabled={currentPage === 1}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(page);
                          }}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(Math.min(totalPages, currentPage + 1));
                      }}
                      aria-disabled={currentPage === totalPages}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
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
