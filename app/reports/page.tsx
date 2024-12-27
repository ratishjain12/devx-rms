"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  name: string;
}

export default function MonthlyBillPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [baseAmount, setBaseAmount] = useState<number>(1000);
  const [totalDays] = useState<number>(getDaysInCurrentMonth());
  const [attendanceData, setAttendanceData] = useState<{
    [key: string]: number;
  }>({});

  useEffect(() => {
    fetchEmployees();
    loadAttendanceData();
  }, []);

  function getDaysInCurrentMonth() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      toast({
        title: "Error",
        description: "Failed to fetch employees. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadAttendanceData = () => {
    const storedData = localStorage.getItem("attendanceData");
    if (storedData) {
      setAttendanceData(JSON.parse(storedData));
    }
  };

  const saveAttendanceData = (newData: { [key: string]: number }) => {
    localStorage.setItem("attendanceData", JSON.stringify(newData));
    setAttendanceData(newData);
  };

  const handleAttendanceChange = (employeeId: string, days: number) => {
    if (days > totalDays) {
      toast({
        title: "Invalid Input",
        description: `Days attended cannot exceed ${totalDays} days.`,
        variant: "destructive",
      });
      return;
    }
    const newData = { ...attendanceData, [employeeId]: days };
    saveAttendanceData(newData);
  };

  const calculateBill = (employeeId: string) => {
    const daysPresent = attendanceData[employeeId] || 0;
    return (daysPresent / totalDays) * baseAmount;
  };

  const calculateTotalMonthlyBill = () => {
    return employees.reduce(
      (total, employee) => total + calculateBill(employee.id),
      0
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Monthly Bill Calculation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <Input
            type="number"
            value={baseAmount}
            onChange={(e) => setBaseAmount(Number(e.target.value))}
            placeholder="Base Amount"
            className="w-1/2"
          />
          <div className="w-1/2 flex items-center justify-end">
            <span className="text-sm text-gray-500">
              Total Days in Month: {totalDays}
            </span>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee Name</TableHead>
              <TableHead>Days Present</TableHead>
              <TableHead>Monthly Bill</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>{employee.name}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={attendanceData[employee.id] || 0}
                    onChange={(e) =>
                      handleAttendanceChange(
                        employee.id,
                        Number(e.target.value)
                      )
                    }
                    className="w-20"
                    min={0}
                    max={totalDays}
                  />
                </TableCell>
                <TableCell>₹{calculateBill(employee.id).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex justify-end">
        <div className="text-xl font-bold">
          Total Monthly Bill: ₹{calculateTotalMonthlyBill().toFixed(2)}
        </div>
      </CardFooter>
    </Card>
  );
}
