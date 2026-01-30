import { readFileSync } from 'fs';
import { join } from 'path';
import '../lib/migrations'; // Ensure migrations run
import db from '../lib/db';
import { applicationHelpers, labelImageHelpers } from '../lib/db-helpers';
import { BeverageType, OriginType } from '../lib/validation/types';
import type { ApplicationData } from '../lib/validation/types';

/**
 * Script to create 50 copies of the GALLO application for batch testing
 *
 * Usage: npx tsx scripts/create-batch-applications.ts
 */

const BATCH_SIZE = 50;
const APPLICANT_NAME = 'Latin American Traders LLC';

// Application data
const applicationData: Omit<ApplicationData, 'id' | 'labelImages'> = {
  ttbId: '25351001000005',
  beverageType: BeverageType.BEER,
  originType: OriginType.IMPORTED,
  brandName: 'GALLO',
  fancifulName: null,
  producerName: 'Latin American Traders LLC',
  producerAddress: {
    city: 'Doral',
    state: 'FL',
  },
  appellation: null,
  varietal: null,
  vintageDate: null,
  other: null,
};

async function createBatchApplications() {
  console.log(`Creating ${BATCH_SIZE} copies of GALLO application...`);

  // Read image files - try multiple locations
  const possiblePaths = [
    // Uploaded images from cursor
    join(
      process.cwd(),
      '.cursor',
      'projects',
      'Users-michaeltornaritis-Desktop-Treasury-Take-Home',
      'assets',
      'gallo_front-3f9e5f96-f1c8-41ee-919d-fa1edc493930.png'
    ),
    join(
      process.cwd(),
      '.cursor',
      'projects',
      'Users-michaeltornaritis-Desktop-Treasury-Take-Home',
      'assets',
      'gallo_back-9d3d692f-e4eb-4937-8919-38f9486a77fc.png'
    ),
    // Test labels directory
    join(process.cwd(), 'test_labels', 'beer_imported', 'gallo_front.jpeg'),
    join(process.cwd(), 'test_labels', 'beer_imported', 'gallo_back.jpeg'),
  ];

  let frontImagePath: string | null = null;
  let backImagePath: string | null = null;

  // Find front image
  for (const path of [possiblePaths[0], possiblePaths[2]]) {
    try {
      readFileSync(path);
      frontImagePath = path;
      break;
    } catch {
      // Try next path
    }
  }

  // Find back image
  for (const path of [possiblePaths[1], possiblePaths[3]]) {
    try {
      readFileSync(path);
      backImagePath = path;
      break;
    } catch {
      // Try next path
    }
  }

  if (!frontImagePath || !backImagePath) {
    console.error('Error: Could not find image files. Tried:');
    possiblePaths.forEach((p) => console.error(`  - ${p}`));
    process.exit(1);
  }

  let frontImageBuffer: Buffer;
  let backImageBuffer: Buffer;
  let frontMimeType: string;
  let backMimeType: string;

  try {
    frontImageBuffer = readFileSync(frontImagePath);
    backImageBuffer = readFileSync(backImagePath);
    console.log(`✓ Loaded front image from ${frontImagePath} (${frontImageBuffer.length} bytes)`);
    console.log(`✓ Loaded back image from ${backImagePath} (${backImageBuffer.length} bytes)`);

    // Determine mime type from extension
    frontMimeType = frontImagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    backMimeType = backImagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
  } catch (error) {
    console.error('Error reading image files:', error);
    process.exit(1);
  }

  const createdIds: number[] = [];

  // Create applications in a transaction-like manner
  for (let i = 0; i < BATCH_SIZE; i++) {
    try {
      // Create application
      const applicationDataJson = JSON.stringify(applicationData);
      const result = applicationHelpers.create(
        APPLICANT_NAME,
        applicationData.beverageType,
        applicationDataJson,
        null // assigned_agent_id
      );

      const applicationId = result.lastInsertRowid as number;
      createdIds.push(applicationId);

      // Create front label image
      labelImageHelpers.create(applicationId, 'front', frontImageBuffer, frontMimeType);

      // Create back label image
      labelImageHelpers.create(applicationId, 'back', backImageBuffer, backMimeType);

      // Image IDs will be updated after all images are created

      if ((i + 1) % 10 === 0) {
        console.log(`Created ${i + 1}/${BATCH_SIZE} applications...`);
      }
    } catch (error) {
      console.error(`Error creating application ${i + 1}:`, error);
      // Continue with next application
    }
  }

  // Get actual image IDs and update applications
  console.log('\nUpdating applications with correct image IDs...');
  for (const appId of createdIds) {
    const images = labelImageHelpers.findByApplicationId(appId);
    const imageIds = images.map((img) => String(img.id));

    const updatedApplicationData: ApplicationData = {
      ...applicationData,
      id: String(appId),
      labelImages: imageIds,
    };

    const updatedApplicationDataJson = JSON.stringify(updatedApplicationData);
    const updateStmt = db.prepare('UPDATE applications SET application_data = ? WHERE id = ?');
    updateStmt.run(updatedApplicationDataJson, appId);
  }

  console.log(`\n✓ Successfully created ${createdIds.length} applications`);
  console.log(`Application IDs: ${createdIds.join(', ')}`);
  console.log(`\nYou can now test batch verification with these applications.`);
}

// Run the script
createBatchApplications()
  .then(() => {
    console.log('\nScript completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
