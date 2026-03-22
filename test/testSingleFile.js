const BASE_URL = "https://zoom-download-worker.ruoshuim.workers.dev";

async function testSingleFile() {
  console.log("Uploading file...");

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: JSON.stringify({ hello: "world", time: Date.now() }),
      filename: "test.json",
      type: "application/json",
    }),
  });

  const data = await res.json();
  console.log("Upload response:", data);

  console.log("Downloading file...");

  const fileRes = await fetch(data.url);
  const text = await fileRes.text();

  console.log("Downloaded content:");
  console.log(text);
}

testSingleFile().catch(console.error);