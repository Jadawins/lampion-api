// ✅ Azure Function: ListerSessions – retourne les 5 dernières sessions par nomAventure
const { BlobServiceClient } = require("@azure/storage-blob");
const AZURE_STORAGE_CONNECTION_STRING = process.env["AzureWebJobsStorage"];
const containerName = "sessions";

module.exports = async function (context, req) {
  const result = [];

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    for await (const blob of containerClient.listBlobsFlat()) {
      if (!blob.name.endsWith(".json")) continue;

      const sessionId = blob.name.replace(".json", "");
      const blobClient = containerClient.getBlobClient(blob.name);
      const downloadBlockBlobResponse = await blobClient.download();
      const content = await streamToString(downloadBlockBlobResponse.readableStreamBody);
      const data = JSON.parse(content);

      const nomAventure = data.nomAventure || "(sans nom)";
      const combats = data.combats || [];
      const dernierCombat = combats[combats.length - 1];
      const timestampFin = dernierCombat?.timestampFin || blob.properties.lastModified || null;

      result.push({ sessionId, nomAventure, timestampFin });
    }

    // Trier par date décroissante
    result.sort((a, b) => new Date(b.timestampFin) - new Date(a.timestampFin));

    context.res = {
      status: 200,
      body: result.slice(0, 5)
    };

  } catch (err) {
    context.log("❌ Erreur ListerSessions:", err.message);
    context.res = {
      status: 500,
      body: { error: "Erreur serveur." }
    };
  }
};

async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (d) => chunks.push(d.toString()));
    readableStream.on("end", () => resolve(chunks.join("")));
    readableStream.on("error", reject);
  });
}
