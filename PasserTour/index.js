const { BlobServiceClient } = require("@azure/storage-blob");

const connectionString = process.env.AzureWebJobsStorage;
const containerName = "sessions";

module.exports = async function (context, req) {
  const { sessionId } = req.body || {};

  if (!sessionId) {
    context.res = {
      status: 400,
      body: { error: "sessionId requis." }
    };
    return;
  }

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(`${sessionId}.json`);

    const blob = await blobClient.download(0);
    const content = await streamToString(blob.readableStreamBody);
    const data = JSON.parse(content);

    const ordre = data.ordreTour || [];
    let index = data.indexTour ?? 0;

    index = (index + 1) % ordre.length;
    data.indexTour = index;

    // ✅ Ajouter un log uniquement si fourni
    if (!data.logCombat) data.logCombat = [];
    if (req.body?.log) {
      data.logCombat.push({
        ...req.body.log,
        timestamp: new Date().toISOString()
      });
    }

    await blobClient.upload(JSON.stringify(data), Buffer.byteLength(JSON.stringify(data)), {
      overwrite: true
    });

    context.res = {
      status: 200,
      body: { message: "Tour passé avec succès", indexTour: index }
    };
  } catch (err) {
    context.log("Erreur PasserTour:", err.message);
    context.res = {
      status: 500,
      body: { error: "Erreur lors de l'enregistrement du tour." }
    };
  }
};

async function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (d) => chunks.push(d.toString()));
    stream.on("end", () => resolve(chunks.join("")));
    stream.on("error", reject);
  });
}
