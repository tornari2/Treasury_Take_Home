import '../lib/migrations';
import { applicationHelpers, labelImageHelpers } from '../lib/db-helpers';

// Verify the first few applications were created correctly
const appIds = [15, 16, 17];

console.log('Verifying batch applications...\n');

for (const appId of appIds) {
  const app = applicationHelpers.findById(appId);
  if (!app) {
    console.log(`❌ Application ${appId} not found`);
    continue;
  }

  const appData = JSON.parse(app.application_data);
  const images = labelImageHelpers.findByApplicationId(appId);

  console.log(`Application ${appId}:`);
  console.log(`  Brand: ${appData.brandName}`);
  console.log(`  Beverage Type: ${appData.beverageType}`);
  console.log(`  Origin Type: ${appData.originType}`);
  console.log(`  Producer: ${appData.producerName}`);
  console.log(`  City/State: ${appData.producerAddress.city}, ${appData.producerAddress.state}`);
  console.log(`  Images: ${images.length} (${images.map((img) => img.image_type).join(', ')})`);
  console.log(`  Image IDs in appData: ${appData.labelImages.join(', ')}`);
  console.log('');
}

console.log('✓ Verification complete');
