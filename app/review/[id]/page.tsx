'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { getFieldLabel } from '@/lib/validation/display';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LabelImage {
  id: number;
  image_type: string;
  mime_type: string;
  extracted_data: any;
  verification_result: any;
  confidence_score: number | null;
  image_data_base64?: string;
}

interface Application {
  id: number;
  applicant_name: string;
  beverage_type: string;
  status: string;
  expected_label_data: any;
  label_images: LabelImage[];
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [application, setApplication] = useState<Application | null>(null);
  // Initialize loading to false - we'll set it to true only if needed (prevents flicker when navigating between screens)
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [imageZooms, setImageZooms] = useState<Record<number, number>>({});
  const [imagePans, setImagePans] = useState<Record<number, { x: number; y: number }>>({});
  const [isDragging, setIsDragging] = useState<Record<number, boolean>>({});
  const [dragStart, setDragStart] = useState<Record<number, { x: number; y: number }>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  // Batch navigation state
  const [batchApplications, setBatchApplications] = useState<number[] | null>(null);
  const [currentBatchIndex, setCurrentBatchIndex] = useState<number | null>(null);
  const [isInBatch, setIsInBatch] = useState(false);

  useEffect(() => {
    if (params.id) {
      // Only show loading screen if we're not navigating within a batch
      const inBatchMode =
        searchParams?.get('batch') === 'true' ||
        (typeof window !== 'undefined' && sessionStorage.getItem('batchApplications'));
      if (!inBatchMode && !application) {
        setLoading(true);
      }
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

  const fetchApplication = async () => {
    try {
      // Only show loading screen if we don't have application data and we're not in batch mode
      const inBatchMode =
        searchParams?.get('batch') === 'true' ||
        (typeof window !== 'undefined' && sessionStorage.getItem('batchApplications'));
      if (!application && !inBatchMode) {
        setLoading(true);
      }
      const response = await fetch(`/api/applications/${params.id}`);

      if (!response.ok) {
        // Application not found - handle batch navigation if in batch mode
        // Check sessionStorage directly in case state hasn't been set yet
        const storedBatchApps = sessionStorage.getItem('batchApplications');
        if (storedBatchApps) {
          try {
            const appIds = JSON.parse(storedBatchApps);
            if (Array.isArray(appIds) && appIds.length > 0) {
              // Remove invalid application from batch and try next
              const updatedBatch = appIds.filter((id: number) => id !== Number(params.id));
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
        throw new Error('Application not found');
      }

      const data = await response.json();
      setApplication(data.application);

      // Auto-trigger verification if not already verified
      if (data.application.label_images.length > 0) {
        const hasVerification = data.application.label_images.some(
          (img: LabelImage) => img.verification_result
        );
        if (!hasVerification) {
          triggerVerification();
        }
      }
    } catch (error) {
      console.error('Error fetching application:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerVerification = async () => {
    setVerifying(true);
    try {
      const response = await fetch(`/api/applications/${params.id}/verify`, {
        method: 'POST',
      });

      if (response.ok) {
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
      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert(
          'Network error: Unable to connect to the server. Please check your connection and try again.'
        );
      } else {
        alert('An unexpected error occurred during verification. Please try again.');
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleStatusUpdate = async (status: string, confirmed: boolean = false) => {
    // Check if approving with hard mismatches - require confirmation
    if (status === 'approved' && !confirmed) {
      const hasHardMismatch = Object.values(verificationResult).some(
        (result: any) => result?.type === 'hard_mismatch' || result?.type === 'not_found'
      );
      if (hasHardMismatch) {
        setPendingStatus(status);
        setShowConfirmDialog(true);
        return;
      }
    }

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
          if (isInBatch && batchApplications && currentBatchIndex !== null) {
            // Check if there's a next application in the batch
            if (currentBatchIndex < batchApplications.length - 1) {
              // Auto-navigate to next application
              const nextIndex = currentBatchIndex + 1;
              const nextAppId = batchApplications[nextIndex];
              sessionStorage.setItem('batchCurrentIndex', nextIndex.toString());
              router.push(`/review/${nextAppId}?batch=true`);
            } else {
              // Last application in batch - automatically return to dashboard
              exitBatch();
            }
          } else {
            // Not in batch mode - redirect to dashboard
            router.push('/dashboard');
          }
        }
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Error updating status');
    }
  };

  const confirmStatusUpdate = () => {
    if (pendingStatus) {
      handleStatusUpdate(pendingStatus, true);
      setShowConfirmDialog(false);
      setPendingStatus(null);
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

  // Only show loading screen if we're not navigating within a batch
  const inBatchMode =
    searchParams?.get('batch') === 'true' ||
    (typeof window !== 'undefined' && sessionStorage.getItem('batchApplications'));
  if (loading && !application && !inBatchMode) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading application...</div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Application not found</div>
      </div>
    );
  }

  // Use the first image's verification result (they should all be the same)
  const verificationResult = application.label_images[0]?.verification_result || {};

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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
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

        {verifying && (
          <Alert className="mb-4">
            <AlertDescription>Verifying application with AI...</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Label Images */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Label Images</h2>

            <div className="space-y-6">
              {application.label_images.map((img) => {
                const imageZoom = imageZooms[img.id] || 1;
                const imagePan = imagePans[img.id] || { x: 0, y: 0 };
                const isImageDragging = isDragging[img.id] || false;

                return (
                  <div key={img.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="mb-2 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize">{img.image_type}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newZoom = Math.max(0.5, imageZoom - 0.1);
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
                              [img.id]: Math.min(3, imageZoom + 0.1),
                            }));
                          }}
                        >
                          +
                        </Button>
                        {(imageZoom !== 1 || imagePan.x !== 0 || imagePan.y !== 0) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setImageZooms((prev) => ({ ...prev, [img.id]: 1 }));
                              setImagePans((prev) => ({ ...prev, [img.id]: { x: 0, y: 0 } }));
                            }}
                            title="Reset zoom and pan"
                          >
                            Reset
                          </Button>
                        )}
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

            {Object.keys(verificationResult).length === 0 ? (
              <div className="text-muted-foreground">
                No verification results yet. Click &quot;Verify&quot; to process.
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(verificationResult).map(([fieldName, result]: [string, any]) => (
                  <Alert
                    key={fieldName}
                    variant={
                      getFieldStatusVariant(result) === 'destructive' ? 'destructive' : 'default'
                    }
                    className="border-2"
                  >
                    <div className="flex items-start gap-2">
                      {getFieldStatusIcon(result)}
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">
                          {getFieldLabel(fieldName, application?.beverage_type)}
                        </div>
                        {result.type === 'not_applicable' ? (
                          <div className="text-sm mt-1 text-muted-foreground">
                            {result.expected || 'N/A - Not applicable'}
                          </div>
                        ) : (
                          <>
                            {(() => {
                              // Special handling for wine classType when expected is null
                              const isWineClassType =
                                (fieldName === 'classType' || fieldName === 'class_type') &&
                                (application?.beverage_type === 'wine' ||
                                  application?.beverage_type === 'WINE');

                              // Special handling for sulfite declaration when expected is null
                              const isSulfiteDeclaration =
                                (fieldName === 'sulfiteDeclaration' ||
                                  fieldName === 'sulfite_declaration') &&
                                (application?.beverage_type === 'wine' ||
                                  application?.beverage_type === 'WINE');

                              // For wine classType with null expected, show requirement statement after "Expected:"
                              if (isWineClassType && !result.expected) {
                                return (
                                  <div className="text-sm mt-1 text-foreground">
                                    <span className="font-medium">Expected:</span>{' '}
                                    <span className="text-foreground">
                                      A Class/Type designation is required whenever a Varietal is
                                      not listed on the application.
                                    </span>
                                  </div>
                                );
                              }

                              // For sulfite declaration with null expected, show requirement statement after "Expected:"
                              if (isSulfiteDeclaration && !result.expected) {
                                return (
                                  <div className="text-sm mt-1 text-foreground">
                                    <span className="font-medium">Expected:</span>{' '}
                                    <span className="text-foreground">
                                      Must appear if the product has 10 ppm or more (total) sulfur
                                      dioxide.
                                    </span>
                                  </div>
                                );
                              }

                              // Default display for other fields
                              if (result.expected || result.extracted) {
                                return (
                                  <div className="text-sm mt-1 text-foreground">
                                    <span className="font-medium">Expected:</span>{' '}
                                    <span className="text-foreground">
                                      {result.expected || 'None'}
                                    </span>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            {result.extracted &&
                              result.type !== 'not_found' &&
                              result.extracted !== 'Field not found' && (
                                <div className="text-sm text-foreground">
                                  <span className="font-medium">Extracted:</span>{' '}
                                  <span className="text-muted-foreground">{result.extracted}</span>
                                </div>
                              )}
                            {result.type === 'not_found' && (
                              <div className="text-sm text-destructive mt-1">
                                Field not found on label
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </Alert>
                ))}
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
                  className="flex-1"
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

      {/* Confirmation Dialog for Overriding Hard Mismatches */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Hard Mismatches?</DialogTitle>
            <DialogDescription>
              This application has hard mismatches or missing fields flagged by the verification
              system. Are you sure you want to approve it anyway?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              If you proceed, please ensure your review notes explain why you&apos;re overriding the
              verification results. Your professional judgment is the final authority.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmStatusUpdate} variant="default">
              Yes, Approve Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
