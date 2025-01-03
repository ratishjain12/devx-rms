import { GanttChart } from "@/components/gantt/GanttChart";

export default function Dashboard() {
  return (
    <div className="px-4">
      <GanttChart />
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
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
      <div className="mt-4">
        <AnalyticsCards />
      </div> */}
    </div>
  );
}
