'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ApplicationForm } from '@/components/application-form';

interface Application {
  id: number;
  applicant_name: string;
  beverage_type: string;
  status: string;
  created_at: string;
  expected_label_data: any;
  application_data?: any;
}

export default function Dashboard() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedApps, setSelectedApps] = useState<Set<number>>(new Set());
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [verifyingApp, setVerifyingApp] = useState<number | null>(null);
  const [deletingApp, setDeletingApp] = useState<number | null>(null);
  const [deletingApps, setDeletingApps] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const url =
        selectedStatus === 'all'
          ? '/api/applications'
          : `/api/applications?status=${selectedStatus}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error fetching applications:', errorData);
        setApplications([]);
        return;
      }

      const data = await response.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedApps.size === applications.length) {
      setSelectedApps(new Set());
    } else {
      setSelectedApps(new Set(applications.map((app) => app.id)));
    }
  };

  const handleSelectApp = (appId: number) => {
    const newSelected = new Set(selectedApps);
    if (newSelected.has(appId)) {
      newSelected.delete(appId);
    } else {
      newSelected.add(appId);
    }
    setSelectedApps(newSelected);
  };

  const handleBatchVerify = async () => {
    if (selectedApps.size === 0) return;

    setBatchProcessing(true);
    try {
      const applicationIds = Array.from(selectedApps);
      const response = await fetch('/api/batch/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_ids: applicationIds,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store batch application IDs in sessionStorage for sequential navigation
        sessionStorage.setItem('batchApplications', JSON.stringify(applicationIds));
        sessionStorage.setItem('batchCurrentIndex', '0');
        // Redirect to first application's review page
        const firstAppId = applicationIds[0];
        setSelectedApps(new Set());
        router.push(`/review/${firstAppId}?batch=true`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message ||
          errorData.error ||
          'Failed to start batch processing. Please try again.';
        alert(`Batch Processing Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Batch verify error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert(
          'Network error: Unable to connect to the server. Please check your connection and try again.'
        );
      } else {
        alert('An unexpected error occurred while starting batch processing. Please try again.');
      }
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleVerifySingle = async (appId: number) => {
    setVerifyingApp(appId);
    try {
      const response = await fetch(`/api/applications/${appId}/verify`, {
        method: 'POST',
      });

      if (response.ok) {
        // Redirect directly to review page instead of showing alert
        router.push(`/review/${appId}`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.user_message ||
          errorData.message ||
          errorData.error ||
          'Verification failed. Please try again.';

        alert(`Verification Error: ${errorMessage}`);
        setVerifyingApp(null);
      }
    } catch (error) {
      console.error('Verify error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert(
          'Network error: Unable to connect to the server. Please check your connection and try again.'
        );
      } else {
        alert('An unexpected error occurred during verification. Please try again.');
      }
      setVerifyingApp(null);
    }
  };

  const handleDelete = async (appId: number) => {
    if (
      !confirm('Are you sure you want to delete this application? This action cannot be undone.')
    ) {
      return;
    }

    setDeletingApp(appId);
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchApplications();
        // Remove from selected apps if it was selected
        const newSelected = new Set(selectedApps);
        newSelected.delete(appId);
        setSelectedApps(newSelected);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Failed to delete application: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting application');
    } finally {
      setDeletingApp(null);
    }
  };

  const handleReviewSelected = () => {
    if (selectedApps.size === 0) return;

    const applicationIds = Array.from(selectedApps);
    // Store selected application IDs in sessionStorage for sequential navigation
    sessionStorage.setItem('batchApplications', JSON.stringify(applicationIds));
    sessionStorage.setItem('batchCurrentIndex', '0');
    // Redirect to first application's review page
    const firstAppId = applicationIds[0];
    setSelectedApps(new Set());
    router.push(`/review/${firstAppId}?batch=true`);
  };

  const handleDeleteSelected = async () => {
    if (selectedApps.size === 0) return;

    const count = selectedApps.size;
    const message =
      count === 1
        ? 'Are you sure you want to delete this application? This action cannot be undone.'
        : `Are you sure you want to delete ${count} applications? This action cannot be undone.`;

    if (!confirm(message)) {
      return;
    }

    setDeletingApps(new Set(selectedApps));
    const appIds = Array.from(selectedApps);
    const results = { success: 0, failed: 0 };

    try {
      // Delete applications in parallel
      const deletePromises = appIds.map(async (appId) => {
        try {
          const response = await fetch(`/api/applications/${appId}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            results.success++;
            return { appId, success: true };
          } else {
            results.failed++;
            return { appId, success: false };
          }
        } catch (error) {
          results.failed++;
          return { appId, success: false };
        }
      });

      await Promise.all(deletePromises);

      // Refresh applications list
      await fetchApplications();

      // Clear selection
      setSelectedApps(new Set());

      // Show results
      if (results.failed === 0) {
        alert(`Successfully deleted ${results.success} application(s).`);
      } else {
        alert(
          `Deleted ${results.success} application(s). Failed to delete ${results.failed} application(s).`
        );
      }
    } catch (error) {
      console.error('Batch delete error:', error);
      alert('Error deleting applications');
    } finally {
      setDeletingApps(new Set());
    }
  };

  const getTtbId = (app: Application): string => {
    const appData = app.application_data || app.expected_label_data;
    if (appData?.ttbId) {
      return appData.ttbId;
    }
    return `#${app.id}`;
  };

  const getBrandName = (app: Application): string => {
    const appData = app.application_data || app.expected_label_data;
    // Check both new format (brandName) and legacy format (brand_name)
    return appData?.brandName || appData?.brand_name || '—';
  };

  const getStatusVariant = (
    status: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'needs_review':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusDisplayText = (status: string): string => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'needs_review':
        return 'Flagged for Review';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Application Queue</h1>
            <Button onClick={() => setIsDialogOpen(true)}>New Application</Button>
          </div>

          <div className="flex gap-4 items-center mb-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedApps.size === applications.length && applications.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Brand Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No applications found
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow
                    key={app.id}
                    className={`cursor-pointer ${selectedApps.has(app.id) ? 'bg-blue-50' : ''}`}
                    onClick={() => handleSelectApp(app.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedApps.has(app.id)}
                        onCheckedChange={() => handleSelectApp(app.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{getTtbId(app)}</TableCell>
                    <TableCell>{app.applicant_name}</TableCell>
                    <TableCell>{getBrandName(app)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(app.status)}>
                        {getStatusDisplayText(app.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(app.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-3 justify-center">
          <Button
            onClick={handleReviewSelected}
            variant="default"
            disabled={selectedApps.size === 0}
          >
            Review{selectedApps.size >= 2 ? ` (${selectedApps.size})` : ''}
          </Button>
          <Button
            onClick={handleBatchVerify}
            variant="default"
            disabled={batchProcessing || selectedApps.size === 0}
          >
            {batchProcessing
              ? 'Processing...'
              : `Verify${selectedApps.size >= 2 ? ` (${selectedApps.size})` : ''}`}
          </Button>
          <Button
            onClick={handleDeleteSelected}
            variant="destructive"
            disabled={deletingApps.size > 0 || selectedApps.size === 0}
          >
            {deletingApps.size > 0
              ? 'Deleting...'
              : `Delete${selectedApps.size >= 2 ? ` (${selectedApps.size})` : ''}`}
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Application</DialogTitle>
          </DialogHeader>
          <ApplicationForm
            onSuccess={() => {
              fetchApplications();
            }}
            onClose={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
