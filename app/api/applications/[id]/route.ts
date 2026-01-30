import { NextRequest, NextResponse } from 'next/server';
import { applicationHelpers, labelImageHelpers } from '@/lib/db-helpers';
import { ApplicationData, BeverageType, OriginType } from '@/lib/validation/types';
import type { ImageType } from '@/types/database';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const applicationId = parseInt(params.id);

    if (isNaN(applicationId)) {
      return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 });
    }

    const application = applicationHelpers.findById(applicationId);

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Get label images for this application
    const labelImages = labelImageHelpers.findByApplicationId(applicationId);

    // Parse JSON fields and convert image data to base64 for frontend
    const applicationDataField =
      (application as any).application_data || (application as any).expected_label_data;
    const parsedApplication = {
      ...application,
      application_data: applicationDataField ? JSON.parse(applicationDataField) : null,
      // Keep expected_label_data for backward compatibility during migration
      expected_label_data: applicationDataField ? JSON.parse(applicationDataField) : null,
      label_images: labelImages.map((img) => ({
        ...img,
        image_data_base64: img.image_data.toString('base64'),
        extracted_data: img.extracted_data ? JSON.parse(img.extracted_data) : null,
        verification_result: img.verification_result ? JSON.parse(img.verification_result) : null,
      })),
    };

    // Skip audit logging since authentication is removed

    return NextResponse.json({ application: parsedApplication });
  } catch (error) {
    console.error('Get application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const applicationId = parseInt(params.id);

    if (isNaN(applicationId)) {
      return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 });
    }

    const application = applicationHelpers.findById(applicationId);

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const body = await request.json();
    const { status, review_notes } = body;

    if (status && !['pending', 'approved', 'rejected'].includes(status)) {
      // needs_review is no longer a valid status - treat as invalid
      if (status === 'needs_review') {
        return NextResponse.json(
          { error: 'needs_review status is no longer supported. Use pending instead.' },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update application
    if (status) {
      applicationHelpers.updateStatus(applicationId, status, review_notes || null);

      // Skip audit logging since authentication is removed
    }

    const updatedApplication = applicationHelpers.findById(applicationId);

    const applicationDataField =
      (updatedApplication as any).application_data ||
      (updatedApplication as any).expected_label_data;
    return NextResponse.json({
      application: {
        ...updatedApplication,
        application_data: applicationDataField ? JSON.parse(applicationDataField) : null,
        // Keep expected_label_data for backward compatibility during migration
        expected_label_data: applicationDataField ? JSON.parse(applicationDataField) : null,
      },
    });
  } catch (error) {
    console.error('Update application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const applicationId = parseInt(params.id);

    if (isNaN(applicationId)) {
      return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 });
    }

    const application = applicationHelpers.findById(applicationId);

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Parse multipart/form-data
    const formData = await request.formData();
    const applicationDataJson = formData.get('applicationData') as string;

    if (!applicationDataJson) {
      return NextResponse.json({ error: 'Application data is required' }, { status: 400 });
    }

    // Parse and validate ApplicationData
    let applicationData: Omit<ApplicationData, 'id' | 'labelImages'>;
    try {
      applicationData = JSON.parse(applicationDataJson);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid application data format' }, { status: 400 });
    }

    // Validate required fields (same as POST)
    if (
      !applicationData.beverageType ||
      !Object.values(BeverageType).includes(applicationData.beverageType)
    ) {
      return NextResponse.json({ error: 'Invalid beverage type' }, { status: 400 });
    }

    if (
      !applicationData.originType ||
      !Object.values(OriginType).includes(applicationData.originType)
    ) {
      return NextResponse.json({ error: 'Invalid origin type' }, { status: 400 });
    }

    if (!applicationData.brandName?.trim()) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    if (!applicationData.producerName?.trim()) {
      const fieldLabel =
        applicationData.originType === 'imported' ? 'Importer name' : 'Producer name';
      return NextResponse.json({ error: `${fieldLabel} is required` }, { status: 400 });
    }

    if (
      !applicationData.producerAddress?.city?.trim() ||
      !applicationData.producerAddress?.state?.trim()
    ) {
      const fieldLabel =
        applicationData.originType === 'imported' ? 'Importer address' : 'Producer address';
      return NextResponse.json(
        { error: `${fieldLabel} (city and state) is required` },
        { status: 400 }
      );
    }

    // Update application_data
    const applicationDataString = JSON.stringify(applicationData);
    const updateStmt = db.prepare('UPDATE applications SET application_data = ? WHERE id = ?');
    updateStmt.run(applicationDataString, applicationId);

    // Update applicant_name if producer name changed
    if (applicationData.producerName.trim() !== application.applicant_name) {
      const updateNameStmt = db.prepare('UPDATE applications SET applicant_name = ? WHERE id = ?');
      updateNameStmt.run(applicationData.producerName.trim(), applicationId);
    }

    // Update beverage_type if changed
    if (applicationData.beverageType !== application.beverage_type) {
      const updateTypeStmt = db.prepare('UPDATE applications SET beverage_type = ? WHERE id = ?');
      updateTypeStmt.run(applicationData.beverageType, applicationId);
    }

    // Handle images if provided
    const imageFiles = formData.getAll('images') as File[];
    const imageTypeValues = formData.getAll('imageTypes');

    if (imageFiles.length > 0) {
      // Validate image types match image files
      if (imageTypeValues.length !== imageFiles.length) {
        return NextResponse.json(
          { error: 'Image type must be specified for each image' },
          { status: 400 }
        );
      }

      // Validate and collect image types
      const imageTypes: ImageType[] = [];
      for (const typeValue of imageTypeValues) {
        const type = String(typeValue) as ImageType;
        if (!['front', 'back', 'side', 'neck', 'other'].includes(type)) {
          return NextResponse.json({ error: 'Invalid image type' }, { status: 400 });
        }
        imageTypes.push(type);
      }

      // Validate image files
      for (const file of imageFiles) {
        if (!(file instanceof File)) {
          return NextResponse.json({ error: 'Invalid file format' }, { status: 400 });
        }

        if (!file.type.startsWith('image/')) {
          return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
        }

        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json({ error: 'Image size must be less than 10MB' }, { status: 400 });
        }
      }

      // Delete existing images
      const existingImages = labelImageHelpers.findByApplicationId(applicationId);
      for (const image of existingImages) {
        labelImageHelpers.delete(image.id);
      }

      // Add new images
      const imageIds: number[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const imageType = imageTypes[i];

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = file.type || 'image/jpeg';

        const imageResult = labelImageHelpers.create(applicationId, imageType, buffer, mimeType);
        imageIds.push(imageResult.lastInsertRowid as number);
      }

      // Update ApplicationData with image IDs
      const updatedApplicationData: ApplicationData = {
        ...applicationData,
        id: String(applicationId),
        labelImages: imageIds.map((id) => String(id)),
      };

      const updatedApplicationDataString = JSON.stringify(updatedApplicationData);
      const finalUpdateStmt = db.prepare('UPDATE applications SET application_data = ? WHERE id = ?');
      finalUpdateStmt.run(updatedApplicationDataString, applicationId);
    }

    // Fetch the updated application
    const updatedApplication = applicationHelpers.findById(applicationId);
    if (!updatedApplication) {
      return NextResponse.json(
        { error: 'Failed to retrieve updated application' },
        { status: 500 }
      );
    }

    // Parse JSON fields for response
    const applicationDataField =
      (updatedApplication as any).application_data ||
      (updatedApplication as any).expected_label_data;
    const parsedApplication = {
      ...updatedApplication,
      application_data: applicationDataField ? JSON.parse(applicationDataField) : null,
      expected_label_data: applicationDataField ? JSON.parse(applicationDataField) : null,
    };

    return NextResponse.json(
      {
        application: parsedApplication,
        message: 'Application updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const applicationId = parseInt(params.id);

    if (isNaN(applicationId)) {
      return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 });
    }

    const application = applicationHelpers.findById(applicationId);

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Delete associated label images first (cascade delete)
    const labelImages = labelImageHelpers.findByApplicationId(applicationId);
    for (const image of labelImages) {
      labelImageHelpers.delete(image.id);
    }

    // Delete the application
    applicationHelpers.delete(applicationId);

    // Skip audit logging since authentication is removed

    return NextResponse.json({ message: 'Application removed successfully' });
  } catch (error) {
    console.error('Remove application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
