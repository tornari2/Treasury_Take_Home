export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    </div>
  );
}
