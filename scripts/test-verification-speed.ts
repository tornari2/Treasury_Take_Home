// Test script to measure verification performance after optimizations
import '../lib/migrations';
import { applicationHelpers, labelImageHelpers } from '../lib/db-helpers';
import { extractLabelData } from '../lib/openai-service';

async function testVerificationSpeed() {
  console.log('🔍 Finding applications with images...\n');

  // Find all applications
  const applications = applicationHelpers.findAll();

  // Find an application with images
  let testApp = null;
  for (const app of applications) {
    const images = labelImageHelpers.findByApplicationId(app.id);
    if (images.length > 0) {
      testApp = app;
      console.log(`✓ Found application ${app.id}: ${app.applicant_name}`);
      console.log(`  Beverage Type: ${app.beverage_type}`);
      console.log(`  Images: ${images.length} (${images.map((img) => img.image_type).join(', ')})`);
      break;
    }
  }

  if (!testApp) {
    console.log('❌ No applications with images found in database.');
    console.log(
      '   Please create test applications first using scripts/create-batch-applications.ts'
    );
    process.exit(1);
  }

  const images = labelImageHelpers.findByApplicationId(testApp.id);
  const imageBuffers = images.map((img) => ({
    imageBuffer: img.image_data,
    mimeType: img.mime_type,
  }));

  console.log('\n🚀 Testing verification speed...\n');
  console.log('Running 3 tests to get average timing:\n');

  const times: number[] = [];

  for (let i = 1; i <= 3; i++) {
    try {
      const startTime = Date.now();
      const result = await extractLabelData(
        imageBuffers,
        testApp.beverage_type as 'spirits' | 'wine' | 'beer'
      );
      const endTime = Date.now();
      const duration = endTime - startTime;

      times.push(duration);
      console.log(`Test ${i}: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
      console.log(`  Extracted fields: ${Object.keys(result.extractedData).length}`);
      console.log(`  Processing time reported: ${result.processingTimeMs}ms\n`);
    } catch (error) {
      console.error(`❌ Test ${i} failed:`, error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Results:');
  console.log(`  Average: ${avgTime.toFixed(0)}ms (${(avgTime / 1000).toFixed(2)}s)`);
  console.log(`  Min: ${minTime}ms (${(minTime / 1000).toFixed(2)}s)`);
  console.log(`  Max: ${maxTime}ms (${(maxTime / 1000).toFixed(2)}s)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (avgTime < 5000) {
    console.log('✅ SUCCESS: Average time is under 5 seconds!');
  } else if (avgTime < 8000) {
    console.log('⚠️  WARNING: Average time is 5-8 seconds (target: <5s)');
  } else {
    console.log('❌ FAILED: Average time exceeds 8 seconds');
  }
}

testVerificationSpeed().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
