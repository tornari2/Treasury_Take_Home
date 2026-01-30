const [major] = process.versions.node.split('.').map(Number);

if (Number.isNaN(major)) {
  process.exit(0);
}

if (major >= 22) {
  console.error(
    [
      'Unsupported Node.js version detected.',
      `Current: v${process.versions.node}`,
      'Required: >=18 <22',
      'Next dev server will produce broken chunks on Node 22.',
      'Please switch to Node 20 or 18 and re-run: npm run dev',
    ].join('\n')
  );
  process.exit(1);
}
