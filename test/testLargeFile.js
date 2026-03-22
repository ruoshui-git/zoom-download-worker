const BASE_URL = "https://zoom-download-worker.ruoshuim.workers.dev";

function generateLargeJSON(count = 5000) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: `User_${i}`,
    timestamp: Date.now(),
  }));
}

async function testLargeFile() {
  const bigData = generateLargeJSON(5000);

  console.log("Uploading large JSON...");

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: JSON.stringify(bigData),
      filename: "large.json",
      type: "application/json",
    }),
  });

  const { url } = await res.json();
  console.log("Download URL:", url);

  console.log("Downloading...");

  const fileRes = await fetch(url);
  const text = await fileRes.text();

  console.log(`Downloaded size: ${text.length} chars`);
}

testLargeFile().catch(console.error);