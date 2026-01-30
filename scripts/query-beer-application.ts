import { applicationHelpers, labelImageHelpers } from "../lib/db-helpers";

// Find first beer application
const applications = applicationHelpers.findAll();
const beerApp = applications.find((app) => app.beverage_type === "beer");

if (!beerApp) {
  console.log("No beer application found in database.");
  process.exit(1);
}

console.log("=".repeat(80));
console.log("BEER APPLICATION RECORD");
console.log("=".repeat(80));
console.log("\n📋 DATABASE TABLE FIELDS:\n");

console.log(`ID: ${beerApp.id}`);
console.log(`Applicant Name: ${beerApp.applicant_name}`);
console.log(`Beverage Type: ${beerApp.beverage_type}`);
console.log(`Status: ${beerApp.status}`);
console.log(`Assigned Agent ID: ${beerApp.assigned_agent_id || "null"}`);
console.log(`Created At: ${beerApp.created_at}`);
console.log(`Reviewed At: ${beerApp.reviewed_at || "null"}`);
console.log(`Review Notes: ${beerApp.review_notes || "null"}`);

console.log("\n📦 APPLICATION DATA (JSON):\n");

// Parse application_data
const applicationDataField =
  (beerApp as any).application_data || (beerApp as any).expected_label_data;
const applicationData = applicationDataField
  ? JSON.parse(applicationDataField)
  : null;

if (applicationData) {
  console.log("Application Data Fields:");
  console.log("-".repeat(80));
  console.log(`  ID: ${applicationData.id || "null"}`);
  console.log(`  TTB ID: ${applicationData.ttbId || "null"}`);
  console.log(`  Beverage Type: ${applicationData.beverageType || "null"}`);
  console.log(`  Origin Type: ${applicationData.originType || "null"}`);
  console.log(`  Brand Name: ${applicationData.brandName || "null"}`);
  console.log(`  Fanciful Name: ${applicationData.fancifulName || "null"}`);
  console.log(`  Producer Name: ${applicationData.producerName || "null"}`);
  if (applicationData.producerAddress) {
    console.log(`  Producer Address:`);
    console.log(`    City: ${applicationData.producerAddress.city || "null"}`);
    console.log(
      `    State: ${applicationData.producerAddress.state || "null"}`,
    );
  } else {
    console.log(`  Producer Address: null`);
  }
  console.log(`  Appellation: ${applicationData.appellation || "null"}`);
  console.log(`  Varietal: ${applicationData.varietal || "null"}`);
  console.log(`  Vintage Date: ${applicationData.vintageDate || "null"}`);
  console.log(`  Other: ${applicationData.other || "null"}`);
  console.log(
    `  Label Images: ${applicationData.labelImages ? applicationData.labelImages.length : 0} image(s)`,
  );

  if (applicationData.labelImages && applicationData.labelImages.length > 0) {
    console.log(`    Image URLs/Types:`);
    applicationData.labelImages.forEach((img: string, idx: number) => {
      const preview = img.length > 60 ? img.substring(0, 60) + "..." : img;
      console.log(`      [${idx + 1}] ${preview}`);
    });
  }
} else {
  console.log("No application data found (null or empty)");
}

console.log("\n🖼️  LABEL IMAGES:\n");

const labelImages = labelImageHelpers.findByApplicationId(beerApp.id);
if (labelImages.length > 0) {
  labelImages.forEach((img, idx) => {
    console.log(`Image ${idx + 1}:`);
    console.log(`  ID: ${img.id}`);
    console.log(`  Image Type: ${img.image_type}`);
    console.log(`  MIME Type: ${img.mime_type}`);
    console.log(`  Confidence Score: ${img.confidence_score || "null"}`);
    console.log(`  Has Extracted Data: ${img.extracted_data ? "Yes" : "No"}`);
    console.log(
      `  Has Verification Result: ${img.verification_result ? "Yes" : "No"}`,
    );
    if (img.extracted_data) {
      try {
        const extracted = JSON.parse(img.extracted_data);
        console.log(
          `  Extracted Data Keys: ${Object.keys(extracted).join(", ")}`,
        );
      } catch (e) {
        console.log(`  Extracted Data: (parse error)`);
      }
    }
    console.log("");
  });
} else {
  console.log("No label images found for this application.");
}

console.log("=".repeat(80));
console.log("\n✅ Query complete!");
