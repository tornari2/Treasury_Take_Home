'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, XCircle, Info, Loader2 } from 'lucide-react';
import { getFieldLabel } from '@/lib/validation/display';

interface ImageQualityIssues {
  hasPerspectiveDistortion: boolean;
  hasLightingIssues: boolean;
  hasGlare: boolean;
  needsPreprocessing: boolean;
}

interface LabelImage {
  id: number;
  image_type: string;
  mime_type: string;
  extracted_data: any;
  verification_result: any;
  confidence_score: number | null;
  image_data_base64?: string;
  quality_issues?: ImageQualityIssues | null;
}

interface Application {
  id: number;
  applicant_name: string;
  beverage_type: string;
  status: string;
  expected_label_data: any;
  application_data?: any;
  label_images: LabelImage[];
  review_notes?: string | null;
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [application, setApplication] = useState<Application | null>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [fetchError, setFetchError] = useState<'not_found' | 'error' | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Used for error state management
  const [verifying, setVerifying] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [imageZooms, setImageZooms] = useState<Record<number, number>>({});
  const [imagePans, setImagePans] = useState<Record<number, { x: number; y: number }>>({});
  const [isDragging, setIsDragging] = useState<Record<number, boolean>>({});
  const [dragStart, setDragStart] = useState<Record<number, { x: number; y: number }>>({});
  // Batch navigation state
  const [batchApplications, setBatchApplications] = useState<number[] | null>(null);
  const [currentBatchIndex, setCurrentBatchIndex] = useState<number | null>(null);
  const [isInBatch, setIsInBatch] = useState(false);
  // Ref to track the current fetch ID to prevent race conditions
  const currentFetchIdRef = useRef<string | null>(null);
  // Ref to prevent infinite loop when clearing verification results
  const isVerifyingRef = useRef(false);
  // Ref to preserve previous application during transitions (prevents flicker)
  // This stays in memory and doesn't cause quota issues
  const previousApplicationRef = useRef<Application | null>(null);

  useEffect(() => {
    if (params.id) {
      const newId = Number(params.id);

      // Skip fetch if we already have the correct application loaded
      if (application && application.id === newId) {
        setIsLoading(false);
        return;
      }

      // When switching to a different application:
      // - Keep previous application visible (don't clear it)
      // - Don't reset hasAttemptedFetch (prevents loading screens from showing)
      // - Don't set isLoading (prevents overlay)
      // - Just fetch the new application in the background
      if (application && application.id !== newId) {
        // ID changed to a different app - keep previous app visible
        setFetchError(null);
        setIsLoading(false);
        // Keep hasAttemptedFetch as true to prevent loading screens
      } else if (!application && !previousApplicationRef.current) {
        // True initial load - no application ever loaded and no previous in memory
        // Set hasAttemptedFetch immediately to prevent loading screens
        setHasAttemptedFetch(true);
        setFetchError(null);
        setIsLoading(false);
      }

      // Update the ref to track which ID we're fetching
      currentFetchIdRef.current = params.id as string;
      fetchApplication();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Initialize batch navigation state
  useEffect(() => {
    const batchParam = searchParams?.get('batch');
    const storedBatchApps = sessionStorage.getItem('batchApplications');
    const storedBatchIndex = sessionStorage.getItem('batchCurrentIndex');

    if (batchParam === 'true' || storedBatchApps) {
      try {
        const appIds = storedBatchApps ? JSON.parse(storedBatchApps) : null;
        if (appIds && Array.isArray(appIds) && appIds.length > 0) {
          const currentAppId = Number(params.id);
          const index = appIds.indexOf(currentAppId);

          if (index !== -1) {
            // Current app is in batch
            setBatchApplications(appIds);
            setCurrentBatchIndex(index);
            setIsInBatch(true);
            // Update sessionStorage with current index
            sessionStorage.setItem('batchCurrentIndex', index.toString());
          } else if (batchParam === 'true') {
            // Batch param is true but current app not in batch - might be direct navigation
            // Still show batch navigation but use stored index
            setBatchApplications(appIds);
            setCurrentBatchIndex(storedBatchIndex ? Number(storedBatchIndex) : 0);
            setIsInBatch(true);
          }
          // If no batch param and app not in stored batch, don't enable batch mode
        } else if (storedBatchApps) {
          // Invalid or empty batch data - clear it
          sessionStorage.removeItem('batchApplications');
          sessionStorage.removeItem('batchCurrentIndex');
        }
      } catch (error) {
        console.error('Error parsing batch applications from sessionStorage:', error);
        // Clear invalid data
        sessionStorage.removeItem('batchApplications');
        sessionStorage.removeItem('batchCurrentIndex');
      }
    }
  }, [params.id, searchParams]);

  // Update ref whenever application changes (for smooth transitions)
  // Keep in memory only - sessionStorage would exceed quota with image data
  useEffect(() => {
    if (application) {
      previousApplicationRef.current = application;
    }
  }, [application]);

  // Initialize zoom and pan for all images
  useEffect(() => {
    if (application?.label_images) {
      const initialZooms: Record<number, number> = {};
      const initialPans: Record<number, { x: number; y: number }> = {};
      application.label_images.forEach((img) => {
        initialZooms[img.id] = 1;
        initialPans[img.id] = { x: 0, y: 0 };
      });
      setImageZooms(initialZooms);
      setImagePans(initialPans);
    }
  }, [application]);

  // Load review notes from application when it changes
  useEffect(() => {
    if (application?.review_notes) {
      setReviewNotes(application.review_notes);
    } else {
      // Clear notes if application has no review notes (e.g., after reverification)
      setReviewNotes('');
    }
  }, [application?.id, application?.review_notes]);

  // Auto-trigger verification when application loads
  useEffect(() => {
    if (!application || !params.id) return;

    // Don't auto-trigger if we're already verifying (prevents infinite loop)
    if (isVerifyingRef.current) return;

    // Check if verify=true param is present (user clicked Verify from dashboard)
    const shouldVerify = searchParams?.get('verify') === 'true';

    // Check if application has verification results
    const hasVerification = application.label_images.some(
      (img: LabelImage) =>
        img.verification_result &&
        img.verification_result !== null &&
        typeof img.verification_result === 'object' &&
        Object.keys(img.verification_result).length > 0
    );

    // Trigger verification if:
    // 1. verify=true param is present (user wants to verify/re-verify), OR
    // 2. No verification exists yet (first time loading)
    if (application.label_images.length > 0 && (shouldVerify || !hasVerification)) {
      // Remove verify param from URL to prevent re-triggering on refresh
      if (shouldVerify) {
        router.replace(`/review/${params.id}`, { scroll: false });
      }
      triggerVerification();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application, params.id, searchParams]);

  const fetchApplication = async () => {
    // Capture the ID at the start of the fetch to prevent race conditions
    const fetchId = params.id as string;

    // Only proceed if this is still the current fetch
    if (currentFetchIdRef.current !== fetchId) {
      return; // Another navigation happened, ignore this fetch
    }

    try {
      setHasAttemptedFetch(true);
      // Don't set isLoading to true here - we want to keep previous content visible
      // Only show loading state if we have no application at all (handled by early return)
      const response = await fetch(`/api/applications/${fetchId}`);

      // Check again if params.id changed during the fetch
      if (currentFetchIdRef.current !== fetchId) {
        return; // Navigation happened during fetch, ignore result
      }

      if (!response.ok) {
        // Check one more time before handling error
        if (currentFetchIdRef.current !== fetchId) {
          return; // Navigation happened, ignore error handling
        }

        // Only handle 404 (not found) errors specially
        if (response.status === 404) {
          // Application not found - handle batch navigation if in batch mode
          // Check sessionStorage directly in case state hasn't been set yet
          const storedBatchApps = sessionStorage.getItem('batchApplications');
          if (storedBatchApps) {
            try {
              const appIds = JSON.parse(storedBatchApps);
              if (Array.isArray(appIds) && appIds.length > 0) {
                // Remove invalid application from batch and try next
                const updatedBatch = appIds.filter((id: number) => id !== Number(fetchId));
                if (updatedBatch.length > 0) {
                  sessionStorage.setItem('batchApplications', JSON.stringify(updatedBatch));
                  const storedIndex = sessionStorage.getItem('batchCurrentIndex');
                  const currentIdx = storedIndex ? Number(storedIndex) : 0;
                  const nextIndex =
                    currentIdx < updatedBatch.length ? currentIdx : updatedBatch.length - 1;
                  const nextAppId = updatedBatch[nextIndex];
                  sessionStorage.setItem('batchCurrentIndex', nextIndex.toString());
                  router.push(`/review/${nextAppId}?batch=true`);
                  return;
                } else {
                  // No more valid applications in batch - clear and go to dashboard
                  sessionStorage.removeItem('batchApplications');
                  sessionStorage.removeItem('batchCurrentIndex');
                  router.push('/dashboard');
                  return;
                }
              }
            } catch (error) {
              console.error('Error handling batch navigation:', error);
            }
          }

          // Only set error state if this is still the current fetch
          if (currentFetchIdRef.current === fetchId) {
            // Don't clear application on error - keep previous visible
            setFetchError('not_found');
            setIsLoading(false);
          }
        } else {
          // Other errors (500, network, etc.) - show error but allow retry
          console.error(`Failed to fetch application: ${response.status} ${response.statusText}`);
          if (currentFetchIdRef.current === fetchId) {
            // Don't clear application on error - keep previous visible
            setFetchError('error');
            setIsLoading(false);
            // Keep hasAttemptedFetch true so we show error state
          }
        }
        return;
      }

      const data = await response.json();

      // Final check before setting state
      if (currentFetchIdRef.current !== fetchId) {
        return; // Navigation happened, ignore this result
      }

      // Only update if this is the application we're currently viewing
      if (data.application && data.application.id === Number(fetchId)) {
        setApplication(data.application);
        previousApplicationRef.current = data.application; // Store for transitions (in memory only)
        setFetchError(null); // Clear any previous errors on successful fetch
        setIsLoading(false); // Loading complete
      }
    } catch (error) {
      // Only log/update state if this is still the current fetch
      if (currentFetchIdRef.current === fetchId) {
        console.error('Error fetching application:', error);
        // Don't clear application on error - keep previous visible
        setFetchError('error');
        setIsLoading(false);
        // Keep hasAttemptedFetch true so we show error state
      }
    }
  };

  const triggerVerification = async () => {
    // Prevent multiple simultaneous verifications
    if (isVerifyingRef.current) {
      return;
    }

    isVerifyingRef.current = true;
    setVerifying(true);

    // Clear review notes immediately when reverifying
    setReviewNotes('');

    // Clear old verification results immediately so user doesn't see stale data
    // Use functional update to ensure we're working with the latest state
    setApplication((prevApplication) => {
      if (!prevApplication?.label_images) {
        return prevApplication;
      }
      return {
        ...prevApplication,
        label_images: prevApplication.label_images.map((img) => ({
          ...img,
          verification_result: null, // Clear verification results - use null to ensure proper clearing
          extracted_data: null, // Also clear extracted data
          quality_issues: null, // Clear quality issues - they'll be recalculated during verification
        })),
      };
    });

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 180000);

      const response = await fetch(`/api/applications/${params.id}/verify`, {
        method: 'POST',
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);

      if (response.ok) {
        // Clear review notes again after successful verification (in case they were set during fetch)
        setReviewNotes('');
        await fetchApplication();
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.user_message ||
          errorData.message ||
          errorData.error ||
          'Verification failed. Please try again.';

        alert(`Verification Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Verification error:', error);
      if (error instanceof DOMException && error.name === 'AbortError') {
        alert('Verification timed out. The service may be busy. Please try again in a moment.');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        alert(
          'Network error: Unable to connect to the server. Please check your connection and try again.'
        );
      } else {
        alert('An unexpected error occurred during verification. Please try again.');
      }
    } finally {
      setVerifying(false);
      isVerifyingRef.current = false;
    }
  };

  const handleStatusUpdate = async (status: string) => {
    try {
      const response = await fetch(`/api/applications/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          review_notes: reviewNotes,
        }),
      });

      if (response.ok) {
        await fetchApplication();
        // Handle batch navigation or redirect to dashboard
        if (status === 'approved' || status === 'rejected') {
          // Read from sessionStorage to ensure we have the latest batch state
          const storedBatchApps = sessionStorage.getItem('batchApplications');
          if (storedBatchApps) {
            try {
              const appIds = JSON.parse(storedBatchApps);
              if (Array.isArray(appIds) && appIds.length > 0) {
                const storedIndex = sessionStorage.getItem('batchCurrentIndex');
                const currentIdx = storedIndex ? Number(storedIndex) : 0;
                // Check if there's a next application in the batch
                if (currentIdx < appIds.length - 1) {
                  // Auto-navigate to next application
                  const nextIndex = currentIdx + 1;
                  const nextAppId = appIds[nextIndex];
                  if (nextAppId) {
                    sessionStorage.setItem('batchCurrentIndex', nextIndex.toString());
                    router.push(`/review/${nextAppId}?batch=true`);
                    return;
                  }
                }
                // Last application in batch - automatically return to dashboard
                exitBatch();
                return;
              }
            } catch (error) {
              console.error('Error reading batch state:', error);
            }
          }
          // Not in batch mode - redirect to dashboard
          router.push('/dashboard');
        }
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Error updating status');
    }
  };

  // Batch navigation functions
  const goToPrevious = () => {
    if (batchApplications && currentBatchIndex !== null && currentBatchIndex > 0) {
      const prevIndex = currentBatchIndex - 1;
      const prevAppId = batchApplications[prevIndex];
      if (prevAppId) {
        sessionStorage.setItem('batchCurrentIndex', prevIndex.toString());
        router.push(`/review/${prevAppId}?batch=true`);
      }
    }
  };

  const goToNext = () => {
    if (
      batchApplications &&
      currentBatchIndex !== null &&
      currentBatchIndex < batchApplications.length - 1
    ) {
      const nextIndex = currentBatchIndex + 1;
      const nextAppId = batchApplications[nextIndex];
      if (nextAppId) {
        sessionStorage.setItem('batchCurrentIndex', nextIndex.toString());
        router.push(`/review/${nextAppId}?batch=true`);
      }
    }
  };

  const exitBatch = () => {
    sessionStorage.removeItem('batchApplications');
    sessionStorage.removeItem('batchCurrentIndex');
    setBatchApplications(null);
    setCurrentBatchIndex(null);
    setIsInBatch(false);
    router.push('/dashboard');
  };

  const getFieldStatusVariant = (
    result: any
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (!result) return 'outline';
    switch (result.type) {
      case 'match':
        return 'default';
      case 'soft_mismatch':
        return 'secondary';
      case 'hard_mismatch':
      case 'not_found':
        return 'destructive';
      case 'not_applicable':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getFieldStatusIcon = (result: any) => {
    if (!result) return null;
    switch (result.type) {
      case 'match':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'soft_mismatch':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'hard_mismatch':
      case 'not_found':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'not_applicable':
        return <Info className="h-5 w-5 text-gray-500" />;
      default:
        return null;
    }
  };

  /**
   * Format health warning text with "GOVERNMENT WARNING" in bold
   * @param text - The health warning text
   * @param shouldBold - Whether to apply bold formatting (true for expected, check formatChecks for extracted)
   * @returns JSX element with formatted text
   */
  const formatHealthWarning = (text: string | null | undefined, shouldBold: boolean = true) => {
    if (!text) return null;

    // Find "GOVERNMENT WARNING" (case-insensitive) - handle with or without colon
    const searchPattern = /GOVERNMENT\s+WARNING:?/i;
    const match = text.match(searchPattern);

    if (match) {
      const matchedText = match[0];
      const index = text.toLowerCase().indexOf(matchedText.toLowerCase());

      if (index !== -1) {
        const before = text.substring(0, index);
        const govWarning = text.substring(index, index + matchedText.length);
        const after = text.substring(index + matchedText.length);

        return (
          <>
            {before}
            {shouldBold ? <span className="font-bold">{govWarning}</span> : govWarning}
            {after}
          </>
        );
      }
    }

    // If pattern not found, return text as-is
    return <>{text}</>;
  };

  // Use previous application during transitions to prevent flicker
  // Always prefer current application, fall back to previous if available
  // NEVER show loading screens during navigation - always show previous app if available
  const displayApplication = application || previousApplicationRef.current;

  // ONLY show error states if we have a real error AND no application to display
  // NEVER show loading screens - they cause flicker
  if (!displayApplication && fetchError === 'not_found' && hasAttemptedFetch) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Application not found</div>
      </div>
    );
  }

  if (!displayApplication && fetchError === 'error' && hasAttemptedFetch) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-2 text-center">
          <div className="text-lg text-red-600">Error loading application</div>
          <button
            onClick={() => {
              setFetchError(null);
              fetchApplication();
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If we have no application to display and no error, show nothing (or previous app)
  // This prevents any loading screens from appearing
  if (!displayApplication) {
    // Return empty div instead of loading screen - prevents flicker
    return <div className="min-h-screen bg-gray-50" />;
  }

  // Use displayApplication instead of application to prevent flicker during transitions
  const currentApp = displayApplication;

  // Use the first image's verification result (they should all be the same)
  // Only use verification_result if it exists and is not null
  const firstImageVerificationResult = currentApp.label_images[0]?.verification_result;
  const verificationResult =
    firstImageVerificationResult &&
    typeof firstImageVerificationResult === 'object' &&
    Object.keys(firstImageVerificationResult).length > 0
      ? firstImageVerificationResult
      : {};

  // Handle mouse down for panning a specific image
  const handleMouseDown = (imageId: number) => (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0) {
      // Left mouse button
      const currentPan = imagePans[imageId] || { x: 0, y: 0 };
      setIsDragging((prev) => ({ ...prev, [imageId]: true }));
      setDragStart((prev) => ({
        ...prev,
        [imageId]: { x: e.clientX - currentPan.x, y: e.clientY - currentPan.y },
      }));
    }
  };

  // Handle mouse move for panning a specific image
  const handleMouseMove = (imageId: number) => (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging[imageId]) {
      const start = dragStart[imageId] || { x: 0, y: 0 };
      setImagePans((prev) => ({
        ...prev,
        [imageId]: { x: e.clientX - start.x, y: e.clientY - start.y },
      }));
    }
  };

  // Handle mouse up for panning
  const handleMouseUp = (imageId: number) => () => {
    setIsDragging((prev) => ({ ...prev, [imageId]: false }));
  };

  // Handle mouse leave to stop dragging
  const handleMouseLeave = (imageId: number) => () => {
    setIsDragging((prev) => ({ ...prev, [imageId]: false }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 relative">
      {/* Removed loading overlay - previous content stays visible during transitions */}
      <div className="max-w-7xl mx-auto">
        {/* Verification Banner Bar */}
        {verifying && (
          <Alert className="mb-6 border-blue-500 bg-blue-50">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            <AlertDescription className="text-blue-900">
              <span className="font-medium">Verifying application with AI...</span>
            </AlertDescription>
          </Alert>
        )}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => {
                // Clear batch context when going back to dashboard
                if (isInBatch) {
                  sessionStorage.removeItem('batchApplications');
                  sessionStorage.removeItem('batchCurrentIndex');
                }
                router.push('/dashboard');
              }}
            >
              ← Back to Dashboard
            </Button>
            {isInBatch && batchApplications && currentBatchIndex !== null && (
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={goToPrevious} disabled={currentBatchIndex === 0}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Application {currentBatchIndex + 1} of {batchApplications.length}
                </span>
                <Button
                  variant="outline"
                  onClick={goToNext}
                  disabled={currentBatchIndex === batchApplications.length - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Label Images */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Label Images</h2>

            <div className="space-y-6">
              {currentApp.label_images.map((img) => {
                const imageZoom = imageZooms[img.id] || 1;
                const imagePan = imagePans[img.id] || { x: 0, y: 0 };
                const isImageDragging = isDragging[img.id] || false;
                const qualityIssues = img.quality_issues;

                return (
                  <div key={img.id} className="border rounded-lg p-4 bg-gray-50">
                    {/* Quality Issues Notification - Only show when verification is complete */}
                    {qualityIssues?.needsPreprocessing &&
                      !verifying &&
                      img.verification_result !== null &&
                      typeof img.verification_result === 'object' &&
                      Object.keys(img.verification_result).length > 0 && (
                        <Alert className="mb-3 border-yellow-500 bg-yellow-50">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription>
                            <div className="font-medium text-yellow-900 mb-1">
                              Image Quality Issues Detected
                            </div>
                            <div className="text-sm text-yellow-800 space-y-1">
                              {qualityIssues.hasPerspectiveDistortion && (
                                <div>• Weird angle/perspective distortion detected</div>
                              )}
                              {qualityIssues.hasLightingIssues && (
                                <div>• Poor lighting conditions detected</div>
                              )}
                              {qualityIssues.hasGlare && <div>• Glare/hotspots detected</div>}
                              <div className="text-xs text-yellow-700 mt-2 italic">
                                Image was automatically preprocessed to improve readability
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    <div className="mb-2 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize">{img.image_type}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newZoom = Math.max(0.5, imageZoom - 0.25);
                            setImageZooms((prev) => ({ ...prev, [img.id]: newZoom }));
                            // Reset pan when zooming out significantly
                            if (newZoom <= 1) {
                              setImagePans((prev) => ({ ...prev, [img.id]: { x: 0, y: 0 } }));
                            }
                          }}
                        >
                          -
                        </Button>
                        <span className="text-sm w-12 text-center">
                          {Math.round(imageZoom * 100)}%
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setImageZooms((prev) => ({
                              ...prev,
                              [img.id]: Math.min(3, imageZoom + 0.25),
                            }));
                          }}
                        >
                          +
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setImageZooms((prev) => ({ ...prev, [img.id]: 1 }));
                            setImagePans((prev) => ({ ...prev, [img.id]: { x: 0, y: 0 } }));
                          }}
                          title="Reset zoom and pan"
                          disabled={imageZoom === 1 && imagePan.x === 0 && imagePan.y === 0}
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                    <div
                      className="overflow-hidden border rounded relative cursor-grab active:cursor-grabbing"
                      style={{ height: '500px' }}
                      onMouseDown={handleMouseDown(img.id)}
                      onMouseMove={handleMouseMove(img.id)}
                      onMouseUp={handleMouseUp(img.id)}
                      onMouseLeave={handleMouseLeave(img.id)}
                    >
                      {img.image_data_base64 && (
                        <img
                          src={`data:${img.mime_type};base64,${img.image_data_base64}`}
                          alt={img.image_type}
                          style={{
                            transform: `translate(${imagePan.x}px, ${imagePan.y}px) scale(${imageZoom})`,
                            transformOrigin: 'top left',
                            transition: isImageDragging ? 'none' : 'transform 0.1s ease-out',
                          }}
                          className="max-w-full select-none"
                          draggable={false}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Verification Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">AI Verification Recommendations</h2>
            <p className="text-sm text-muted-foreground mb-4">
              These are AI-generated verification results to assist your review. Use your
              professional judgment to make the final decision.
            </p>

            {Object.keys(verificationResult).length === 0 || verifying ? (
              <div className="space-y-4">
                {!verifying && (
                  <>
                    <div className="text-muted-foreground">
                      No verification results yet. Click &quot;Verify&quot; to process.
                    </div>
                    <Button
                      onClick={triggerVerification}
                      disabled={verifying}
                      variant="default"
                      className="w-full"
                    >
                      Verify Application
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(verificationResult).map(([fieldName, result]: [string, any]) => {
                  const isSoftMismatch = result.type === 'soft_mismatch';
                  return (
                    <Alert
                      key={fieldName}
                      variant={
                        getFieldStatusVariant(result) === 'destructive' ? 'destructive' : 'default'
                      }
                      className={`border-2 ${isSoftMismatch ? 'border-yellow-600' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        {getFieldStatusIcon(result)}
                        <div className="flex-1">
                          <div className="font-semibold text-foreground">
                            {getFieldLabel(
                              fieldName,
                              currentApp?.beverage_type,
                              currentApp?.expected_label_data?.originType ||
                                currentApp?.application_data?.originType
                            )}
                          </div>
                          {result.type === 'not_applicable' ? (
                            <div className="text-sm mt-1 text-muted-foreground">
                              {result.expected || 'N/A - Not applicable'}
                            </div>
                          ) : (
                            <>
                              {/* Display Expected/Extracted for cross-checked fields (including NOT_FOUND if expected exists) */}
                              {(result.type !== 'not_found' || result.expected) && (
                                <>
                                  {(() => {
                                    // Special handling for wine classType when expected is null
                                    const isWineClassType =
                                      (fieldName === 'classType' || fieldName === 'class_type') &&
                                      (currentApp?.beverage_type === 'wine' ||
                                        currentApp?.beverage_type === 'WINE');

                                    // Special handling for non-wine classType when expected is null (beer/spirits)
                                    const isNonWineClassType =
                                      (fieldName === 'classType' || fieldName === 'class_type') &&
                                      application?.beverage_type !== 'wine' &&
                                      application?.beverage_type !== 'WINE';

                                    // Special handling for sulfite declaration when expected is null
                                    const isSulfiteDeclaration =
                                      (fieldName === 'sulfiteDeclaration' ||
                                        fieldName === 'sulfite_declaration') &&
                                      (currentApp?.beverage_type === 'wine' ||
                                        currentApp?.beverage_type === 'WINE');

                                    // Special handling for age statement when not required
                                    const isAgeStatement =
                                      (fieldName === 'ageStatement' ||
                                        fieldName === 'age_statement') &&
                                      (currentApp?.beverage_type === 'spirits' ||
                                        currentApp?.beverage_type === 'SPIRITS');

                                    // Special handling for alcohol content (always required)
                                    const isAlcoholContent =
                                      fieldName === 'alcoholContent' ||
                                      fieldName === 'alcohol_content';

                                    // For wine classType with null expected, show requirement statement after "Expected:"
                                    if (isWineClassType && !result.expected) {
                                      return (
                                        <div className="text-sm mt-1 text-foreground">
                                          <span className="font-medium">Expected:</span>{' '}
                                          <span className="text-foreground">
                                            A Class/Type designation is required whenever a Varietal
                                            is not listed on the application.
                                          </span>
                                        </div>
                                      );
                                    }

                                    // For non-wine classType (beer/spirits) with null expected, show requirement statement
                                    if (isNonWineClassType && !result.expected) {
                                      const beverageType = currentApp?.beverage_type?.toLowerCase();
                                      const typeDescription =
                                        beverageType === 'spirits'
                                          ? 'A Class or Type designation describing the kind of distilled spirits'
                                          : 'A Class or Type designation describing the kind of malt beverage';
                                      return (
                                        <div className="text-sm mt-1 text-foreground">
                                          <span className="font-medium">Expected:</span>{' '}
                                          <span className="text-foreground">{typeDescription}</span>
                                        </div>
                                      );
                                    }

                                    // For sulfite declaration with null expected, show requirement statement after "Expected:"
                                    if (isSulfiteDeclaration && !result.expected) {
                                      return (
                                        <div className="text-sm mt-1 text-foreground">
                                          <span className="font-medium">Expected:</span>{' '}
                                          <span className="text-foreground">
                                            Must appear if the product has 10 ppm or more (total)
                                            sulfur dioxide.
                                          </span>
                                        </div>
                                      );
                                    }

                                    // For age statement, show the expected value (which will be "N/A - Not required for Class or Type" when not required)
                                    if (isAgeStatement && result.expected) {
                                      // Check if it's an N/A value - if so, don't show "Expected:" label
                                      if (result.expected.startsWith('N/A')) {
                                        return (
                                          <div className="text-sm mt-1 text-muted-foreground">
                                            {result.expected}
                                          </div>
                                        );
                                      }
                                      return (
                                        <div className="text-sm mt-1 text-foreground">
                                          <span className="font-medium">Expected:</span>{' '}
                                          <span className="text-foreground">{result.expected}</span>
                                        </div>
                                      );
                                    }

                                    // For alcohol content, show "Required" if expected is missing (alcohol content is always required)
                                    if (isAlcoholContent && !result.expected) {
                                      return (
                                        <div className="text-sm mt-1 text-foreground">
                                          <span className="font-medium">Expected:</span>{' '}
                                          <span className="text-foreground">Required</span>
                                        </div>
                                      );
                                    }

                                    // Special handling for health warning - show "GOVERNMENT WARNING" in bold
                                    const isHealthWarning =
                                      fieldName === 'healthWarning' ||
                                      fieldName === 'health_warning';

                                    // Default display for other fields - only show Expected/Extracted for cross-checked fields
                                    if (result.expected || result.extracted) {
                                      // Check if expected is an N/A value - if so, don't show "Expected:" label
                                      if (result.expected && result.expected.startsWith('N/A')) {
                                        return (
                                          <div className="text-sm mt-1 text-muted-foreground">
                                            {result.expected}
                                          </div>
                                        );
                                      }
                                      return (
                                        <div className="text-sm mt-1 text-foreground">
                                          <span className="font-medium">Expected:</span>{' '}
                                          {isHealthWarning ? (
                                            <span className="text-foreground">
                                              {formatHealthWarning(result.expected || 'None', true)}
                                            </span>
                                          ) : (
                                            <span className="text-foreground">
                                              {result.expected || 'None'}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                  {/* Show Extracted: for cross-checked fields (show "None" if field not found) */}
                                  {(result.expected || result.extracted) && (
                                    <div className="text-sm text-foreground">
                                      <span className="font-medium">Extracted:</span>{' '}
                                      {(() => {
                                        // Show "None" if field not found, otherwise show extracted value
                                        const extractedValue =
                                          result.extracted === 'Field not found' ||
                                          !result.extracted
                                            ? 'None'
                                            : result.extracted;

                                        const isHealthWarning =
                                          fieldName === 'healthWarning' ||
                                          fieldName === 'health_warning';

                                        // For health warning, check if formatChecks indicate bold (if available)
                                        // Otherwise, assume bold if "GOVERNMENT WARNING" is present
                                        const shouldBold =
                                          isHealthWarning &&
                                          extractedValue !== 'None' &&
                                          /GOVERNMENT WARNING/i.test(extractedValue);

                                        return isHealthWarning && extractedValue !== 'None' ? (
                                          <span className="text-muted-foreground">
                                            {formatHealthWarning(extractedValue, shouldBold)}
                                          </span>
                                        ) : (
                                          <span className="text-muted-foreground">
                                            {extractedValue}
                                          </span>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </Alert>
                  );
                })}
              </div>
            )}

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="review-notes">
                  Review Notes
                  <span className="text-muted-foreground font-normal ml-2">
                    (Recommended, especially when overriding verification results)
                  </span>
                </Label>
                <Textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  placeholder="Document your decision rationale, especially if overriding verification results or rejecting for reasons beyond what the system detected..."
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleStatusUpdate('approved')}
                  className="flex-1 green-button"
                  variant="default"
                >
                  Approve
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('rejected')}
                  className="flex-1"
                  variant="destructive"
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
