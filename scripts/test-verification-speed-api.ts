// Test script to measure verification performance via API endpoint
// This tests the actual API endpoint which properly uses environment variables

async function testVerificationSpeed() {
  const API_BASE = 'http://localhost:3000';

  console.log('🔍 Finding applications with images...\n');

  // Get all applications
  const appsResponse = await fetch(`${API_BASE}/api/applications`);
  if (!appsResponse.ok) {
    console.error('❌ Failed to fetch applications');
    process.exit(1);
  }

  const appsData = await appsResponse.json();
  const applications = appsData.applications || [];

  // Find an application with images
  let testAppId = null;
  for (const app of applications) {
    const appResponse = await fetch(`${API_BASE}/api/applications/${app.id}`);
    if (appResponse.ok) {
      const appData = await appResponse.json();
      if (appData.application?.label_images?.length > 0) {
        testAppId = app.id;
        console.log(`✓ Found application ${app.id}: ${app.applicant_name || 'Unknown'}`);
        console.log(`  Beverage Type: ${app.beverage_type}`);
        console.log(`  Images: ${appData.application.label_images.length}`);
        break;
      }
    }
  }

  if (!testAppId) {
    console.log('❌ No applications with images found.');
    console.log(
      '   Please create test applications first using scripts/create-batch-applications.ts'
    );
    process.exit(1);
  }

  console.log('\n🚀 Testing verification speed...\n');
  console.log('Running 3 tests to get average timing:\n');

  const times: number[] = [];

  for (let i = 1; i <= 3; i++) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${API_BASE}/api/applications/${testAppId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`API error: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      times.push(duration);

      console.log(`Test ${i}: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
      console.log(`  API reported processing time: ${result.processing_time_ms}ms`);
      console.log(`  Overall status: ${result.overall_status}\n`);
    } catch (error) {
      console.error(`❌ Test ${i} failed:`, error instanceof Error ? error.message : error);
      if (i === 1) {
        // Exit on first failure to avoid wasting API calls
        process.exit(1);
      }
    }
  }

  if (times.length === 0) {
    console.error('❌ All tests failed');
    process.exit(1);
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
    console.log('   The optimizations helped but may need more work.');
  } else {
    console.log('❌ FAILED: Average time exceeds 8 seconds');
    console.log('   The optimizations may not have had the expected impact.');
  }

  console.log(
    '\n💡 Note: These optimizations (temperature: 0, max_tokens: 1500, prompt reorganization)'
  );
  console.log(
    '   should provide 15-25% improvement. Further optimizations may be needed for <5s target.'
  );
}

testVerificationSpeed().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
