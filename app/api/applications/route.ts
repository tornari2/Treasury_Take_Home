import { NextRequest, NextResponse } from 'next/server';
import { applicationHelpers, labelImageHelpers } from '@/lib/db-helpers';
import { ApplicationData, BeverageType, OriginType } from '@/lib/validation/types';
import type { ImageType } from '@/types/database';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Skip audit logging since authentication is removed

    let applications;
    if (status) {
      applications = applicationHelpers.findByStatus(status);
    } else {
      applications = applicationHelpers.findAll();
    }

    // Parse JSON fields
    const parsedApplications = applications.map((app) => {
      const applicationDataField =
        (app as any).application_data || (app as any).expected_label_data;
      return {
        ...app,
        application_data: applicationDataField ? JSON.parse(applicationDataField) : null,
        // Keep expected_label_data for backward compatibility during migration
        expected_label_data: applicationDataField ? JSON.parse(applicationDataField) : null,
      };
    });

    return NextResponse.json({
      applications: parsedApplications,
      count: parsedApplications.length,
    });
  } catch (error) {
    console.error('Get applications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Validate required fields
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

    // Validate wine-specific fields
    if (applicationData.beverageType === BeverageType.WINE) {
      // Wine fields are optional, but if provided they should be strings
      if (
        applicationData.appellation !== null &&
        applicationData.appellation !== undefined &&
        typeof applicationData.appellation !== 'string'
      ) {
        return NextResponse.json({ error: 'Invalid appellation format' }, { status: 400 });
      }
      if (
        applicationData.varietal !== null &&
        applicationData.varietal !== undefined &&
        typeof applicationData.varietal !== 'string'
      ) {
        return NextResponse.json({ error: 'Invalid varietal format' }, { status: 400 });
      }
      if (
        applicationData.vintageDate !== null &&
        applicationData.vintageDate !== undefined &&
        typeof applicationData.vintageDate !== 'string'
      ) {
        return NextResponse.json({ error: 'Invalid vintage date format' }, { status: 400 });
      }
    } else {
      // Clear wine fields for non-wine beverages
      applicationData.appellation = null;
      applicationData.varietal = null;
      applicationData.vintageDate = null;
    }

    // Get images from form data
    const imageFiles = formData.getAll('images') as File[];
    const imageTypeValues = formData.getAll('imageTypes');

    if (imageFiles.length === 0) {
      return NextResponse.json({ error: 'At least one image is required' }, { status: 400 });
    }

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

      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image size must be less than 10MB' }, { status: 400 });
      }
    }

    // Create application record
    // Use producerName as applicant_name since form only includes ApplicationData fields
    const applicationDataWithImages: ApplicationData = {
      ...applicationData,
      id: '', // Will be set after creation
      labelImages: [], // Will be populated with image IDs
    };

    const applicationDataString = JSON.stringify(applicationDataWithImages);
    const result = applicationHelpers.create(
      applicationData.producerName.trim(),
      applicationData.beverageType,
      applicationDataString,
      null // No assigned agent initially
    );

    const applicationId = result.lastInsertRowid as number;

    // Process and store images
    const imageIds: number[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const imageType = imageTypes[i];

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Get mime type
      const mimeType = file.type || 'image/jpeg';

      // Store image in database
      const imageResult = labelImageHelpers.create(applicationId, imageType, buffer, mimeType);
      imageIds.push(imageResult.lastInsertRowid as number);
    }

    // Update ApplicationData with image IDs
    const updatedApplicationData: ApplicationData = {
      ...applicationDataWithImages,
      id: String(applicationId),
      labelImages: imageIds.map((id) => String(id)),
    };

    // Update application record with image IDs
    const updatedApplicationDataString = JSON.stringify(updatedApplicationData);
    const updateStmt = db.prepare('UPDATE applications SET application_data = ? WHERE id = ?');
    updateStmt.run(updatedApplicationDataString, applicationId);

    // Skip audit logging since authentication is removed

    // Fetch the created application
    const createdApplication = applicationHelpers.findById(applicationId);
    if (!createdApplication) {
      return NextResponse.json(
        { error: 'Failed to retrieve created application' },
        { status: 500 }
      );
    }

    // Parse JSON fields for response
    const applicationDataField =
      (createdApplication as any).application_data ||
      (createdApplication as any).expected_label_data;
    const parsedApplication = {
      ...createdApplication,
      application_data: applicationDataField ? JSON.parse(applicationDataField) : null,
      expected_label_data: applicationDataField ? JSON.parse(applicationDataField) : null,
    };

    return NextResponse.json(
      {
        application: parsedApplication,
        message: 'Application created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
