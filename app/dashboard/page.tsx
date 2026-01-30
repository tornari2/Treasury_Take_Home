'use client';

import { useState, useEffect, useRef } from 'react';
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
import { MessageSquare } from 'lucide-react';

interface Application {
  id: number;
  applicant_name: string;
  beverage_type: string;
  status: string;
  created_at: string;
  expected_label_data: any;
  application_data?: any;
  review_notes?: string | null;
}

// Module-level variables to persist across component remounts
let cachedApplications: Application[] = [];
let hasLoadedBefore = false;

export default function Dashboard() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>(cachedApplications);
  const [loading, setLoading] = useState(false); // Start as false to prevent loading screen
  const previousApplicationsRef = useRef<Application[]>(cachedApplications);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedApps, setSelectedApps] = useState<Set<number>>(new Set());
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [verifyingApp, setVerifyingApp] = useState<number | null>(null);
  const [deletingApp, setDeletingApp] = useState<number | null>(null);
  const [deletingApps, setDeletingApps] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Initialize with cached applications if available (prevents flicker on navigation)
    if (cachedApplications.length > 0) {
      setApplications(cachedApplications);
      previousApplicationsRef.current = cachedApplications;
    }
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  const fetchApplications = async () => {
    try {
      // Only show loading on true initial load (never loaded before)
      if (!hasLoadedBefore && cachedApplications.length === 0) {
        setLoading(true);
      }
      const url =
        selectedStatus === 'all'
          ? '/api/applications'
          : `/api/applications?status=${selectedStatus}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error fetching applications:', errorData);
        // Keep previous applications visible on error
        return;
      }

      const data = await response.json();
      const newApplications = data.applications || [];
      setApplications(newApplications);
      previousApplicationsRef.current = newApplications; // Store for transitions
      cachedApplications = newApplications; // Cache at module level
      hasLoadedBefore = true; // Mark as loaded at module level
    } catch (error) {
      console.error('Error fetching applications:', error);
      // Keep previous applications visible on error
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    const currentApps = applications.length > 0 ? applications : previousApplicationsRef.current;
    if (selectedApps.size === currentApps.length) {
      setSelectedApps(new Set());
    } else {
      setSelectedApps(new Set(currentApps.map((app) => app.id)));
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

    // For single application, use synchronous verify API
    if (selectedApps.size === 1) {
      const appId = Array.from(selectedApps)[0];
      await handleVerifySingle(appId);
      return;
    }

    const applicationIds = Array.from(selectedApps);

    // Start batch processing in background (don't wait for it)
    try {
      const response = await fetch('/api/batch/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_ids: applicationIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message ||
          errorData.error ||
          'Failed to start batch processing. Please try again.';

        const isNetworkError =
          errorMessage.toLowerCase().includes('network') ||
          errorMessage.toLowerCase().includes('connect') ||
          errorMessage.toLowerCase().includes('firewall');

        if (isNetworkError) {
          alert(
            `Batch Processing Error: ${errorMessage}\n\nIf this issue persists, it may be due to network restrictions blocking access to the verification service. Please contact your system administrator.`
          );
        } else {
          alert(`Batch Processing Error: ${errorMessage}`);
        }
        return;
      }
    } catch (error) {
      console.error('Batch verify error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert(
          'Network Error: Unable to connect to the verification service. This may be due to network restrictions or firewall settings blocking outbound connections. Please check your network connectivity or contact your system administrator.'
        );
      } else {
        alert('An unexpected error occurred while starting batch processing. Please try again.');
      }
      return;
    }

    // Immediately navigate to first application's review page (like single verify)
    // Batch processing will continue in the background
    sessionStorage.setItem('batchApplications', JSON.stringify(applicationIds));
    sessionStorage.setItem('batchCurrentIndex', '0');
    const firstAppId = applicationIds[0];
    setSelectedApps(new Set());
    router.push(`/review/${firstAppId}?verify=true&batch=true`);
  };

  const handleVerifySingle = async (appId: number) => {
    // Navigate immediately to review page - verification will happen there
    // This provides immediate feedback and shows loading state on review page
    router.push(`/review/${appId}?verify=true`);
  };

  const handleDelete = async (appId: number) => {
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
        console.error(`Failed to delete application: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
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

      // Log results to console instead of showing alerts
      if (results.failed === 0) {
        console.log(`Successfully deleted ${results.success} application(s).`);
      } else {
        console.error(
          `Deleted ${results.success} application(s). Failed to delete ${results.failed} application(s).`
        );
      }
    } catch (error) {
      console.error('Batch delete error:', error);
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

  const getProductType = (app: Application): string => {
    // Map beverage type to display labels that match the application form
    if (!app.beverage_type) return '—';
    switch (app.beverage_type.toLowerCase()) {
      case 'beer':
        return 'Malt Beverage';
      case 'wine':
        return 'Wine';
      case 'spirits':
        return 'Distilled Spirits';
      default:
        // Fallback: capitalize first letter
        return app.beverage_type.charAt(0).toUpperCase() + app.beverage_type.slice(1);
    }
  };

  const getProductSource = (app: Application): string => {
    const appData = app.application_data || app.expected_label_data;
    const originType = appData?.originType;
    if (!originType) return '—';
    // Capitalize first letter
    return originType.charAt(0).toUpperCase() + originType.slice(1);
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
        // Treat needs_review as pending for display purposes
        return 'outline';
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
        // Display needs_review as pending
        return 'Pending';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };

  // Use previous applications during loading to prevent flicker
  const displayApplications =
    applications.length > 0 ? applications : previousApplicationsRef.current;

  // ONLY show loading screen on true initial load (never loaded before AND no cached data)
  // During navigation, keep previous applications visible
  if (loading && !hasLoadedBefore && displayApplications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner with color scheme */}
      <div className="relative w-full h-32 overflow-hidden">
        {/* Top section - Deep muted blue (65-70% of height) */}
        <div className="absolute top-0 left-0 w-full h-[68%] bg-[#305170] flex items-center justify-between gap-4 px-8">
          {/* Left side: Logo and title */}
          <div className="flex items-center gap-4">
            <img
              src="/test_labels/TTB_Logo/TTB_logo_web.svg"
              alt="TTB Logo"
              className="h-16 w-auto"
            />
            <h1 className="text-white text-2xl font-bold">Alcohol Label Verifier</h1>
          </div>
          {/* Right side: Prototype disclaimer */}
          <p className="text-white text-xs font-medium">PROTOTYPE — NOT AN OFFICIAL TTB SYSTEM</p>
        </div>
        {/* Bottom section - Rich dark red (30-35% of height) */}
        <div className="absolute bottom-0 left-0 w-full h-[32%] bg-[#9A3B39]"></div>
      </div>

      <div className="p-8">
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
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          selectedApps.size === displayApplications.length &&
                          displayApplications.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Brand Name</TableHead>
                    <TableHead>Product Type</TableHead>
                    <TableHead>Product Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Review Notes</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayApplications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                        No applications found
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayApplications.map((app) => (
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
                        <TableCell>{getProductType(app)}</TableCell>
                        <TableCell>{getProductSource(app)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusVariant(app.status)}
                            className={app.status === 'approved' ? 'green-badge' : ''}
                          >
                            {getStatusDisplayText(app.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {app.review_notes &&
                          (app.status === 'approved' || app.status === 'rejected') ? (
                            <div className="relative group inline-flex items-center justify-center">
                              <MessageSquare className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                              <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-80 max-w-[calc(100vw-2rem)] p-3 bg-gray-900 text-white text-xs rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                                <div className="whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                                  {app.review_notes}
                                </div>
                                <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
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
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-3 justify-center">
            <Button
              onClick={handleReviewSelected}
              variant="default"
              disabled={selectedApps.size === 0}
            >
              {selectedApps.size >= 2
                ? `Review Batch (${selectedApps.size})`
                : selectedApps.size === 1
                  ? 'Review'
                  : 'Review'}
            </Button>
            <Button
              onClick={handleBatchVerify}
              variant="default"
              disabled={batchProcessing || selectedApps.size === 0}
              className="sparkly-purple text-white"
            >
              {batchProcessing
                ? 'Processing...'
                : selectedApps.size >= 2
                  ? `Verify Batch (${selectedApps.size})`
                  : selectedApps.size === 1
                    ? 'Verify'
                    : 'Verify'}
            </Button>
            <Button
              onClick={handleDeleteSelected}
              variant="destructive"
              disabled={deletingApps.size > 0 || selectedApps.size === 0}
            >
              {deletingApps.size > 0
                ? 'Removing...'
                : selectedApps.size >= 2
                  ? `Remove Batch (${selectedApps.size})`
                  : selectedApps.size === 1
                    ? 'Remove'
                    : 'Remove'}
            </Button>
          </div>
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
