import Layout from "../components/layout";
import { AnalyticsCards } from "../components/analytics-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Dashboard() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <AnalyticsCards />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Manage your employees</p>
            <Button asChild>
              <Link href="/employees">View Employees</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Manage your projects</p>
            <Button asChild>
              <Link href="/projects">View Projects</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Assign</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Manage employee assignments</p>
            <Button asChild>
              <Link href="/assign">Assign Employees</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
