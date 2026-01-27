'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

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
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [selectedImageType, setSelectedImageType] = useState<string>('front');
  const [reviewNotes, setReviewNotes] = useState('');
  const [imageZoom, setImageZoom] = useState(1);

  useEffect(() => {
    if (params.id) {
      fetchApplication();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/applications/${params.id}`);
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
        alert('Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert('Error during verification');
    } finally {
      setVerifying(false);
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
        if (status === 'approved' || status === 'rejected') {
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

  const getFieldStatusColor = (result: any) => {
    if (!result) return 'bg-gray-100';
    switch (result.type) {
      case 'match':
        return 'bg-green-100 border-green-300';
      case 'soft_mismatch':
        return 'bg-yellow-100 border-yellow-300';
      case 'hard_mismatch':
        return 'bg-red-100 border-red-300';
      case 'not_found':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-gray-100';
    }
  };

  const getFieldStatusIcon = (result: any) => {
    if (!result) return '❓';
    switch (result.type) {
      case 'match':
        return '✅';
      case 'soft_mismatch':
        return '⚠️';
      case 'hard_mismatch':
        return '❌';
      case 'not_found':
        return '❌';
      default:
        return '❓';
    }
  };

  if (loading) {
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

  const currentImage = application.label_images.find((img) => img.image_type === selectedImageType);

  const verificationResult = currentImage?.verification_result || {};

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Review Application #{application.id}</h1>
          <p className="text-gray-600 mt-2">{application.applicant_name}</p>
        </div>

        {verifying && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-800">Verifying application with AI...</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Label Images */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Label Images</h2>

            <div className="mb-4 flex gap-2">
              {application.label_images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageType(img.image_type)}
                  className={`px-4 py-2 rounded ${
                    selectedImageType === img.image_type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {img.image_type}
                </button>
              ))}
            </div>

            {currentImage && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="mb-2 flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Confidence:{' '}
                    {currentImage.confidence_score
                      ? `${(currentImage.confidence_score * 100).toFixed(1)}%`
                      : 'N/A'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setImageZoom(Math.max(0.5, imageZoom - 0.1))}
                      className="px-2 py-1 bg-gray-200 rounded"
                    >
                      -
                    </button>
                    <span className="text-sm">{Math.round(imageZoom * 100)}%</span>
                    <button
                      onClick={() => setImageZoom(Math.min(2, imageZoom + 0.1))}
                      className="px-2 py-1 bg-gray-200 rounded"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="overflow-auto border rounded">
                  {currentImage.image_data_base64 && (
                    <img
                      src={`data:${currentImage.mime_type};base64,${currentImage.image_data_base64}`}
                      alt={currentImage.image_type}
                      style={{ transform: `scale(${imageZoom})`, transformOrigin: 'top left' }}
                      className="max-w-full"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Verification Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Verification Results</h2>

            {Object.keys(verificationResult).length === 0 ? (
              <div className="text-gray-500">
                No verification results yet. Click &quot;Verify&quot; to process.
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(verificationResult).map(([fieldName, result]: [string, any]) => (
                  <div
                    key={fieldName}
                    className={`p-3 border-2 rounded ${getFieldStatusColor(result)}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xl">{getFieldStatusIcon(result)}</span>
                      <div className="flex-1">
                        <div className="font-semibold capitalize">
                          {fieldName.replace(/_/g, ' ')}
                        </div>
                        {result.expected && (
                          <div className="text-sm mt-1">
                            <span className="font-medium">Expected:</span> {result.expected}
                          </div>
                        )}
                        {result.extracted && (
                          <div className="text-sm">
                            <span className="font-medium">Extracted:</span> {result.extracted}
                          </div>
                        )}
                        {result.type === 'not_found' && (
                          <div className="text-sm text-red-600 mt-1">Field not found on label</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review Notes</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Add notes about this review..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleStatusUpdate('approved')}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleStatusUpdate('rejected')}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleStatusUpdate('needs_review')}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  Flag for Review
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
