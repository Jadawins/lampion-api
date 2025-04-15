const { BlobServiceClient } = require("@azure/storage-blob");

const connectionString = process.env.AzureWebJobsStorage;
const containerName = "sessions";

module.exports = async function (context, req) {
  context.log("🔁 Requête reçue pour enregistrer l'ordre de tour");

  const { sessionId, ordreTour, indexTour } = req.body || {};

  if (!sessionId || !Array.isArray(ordreTour) || typeof indexTour !== "number") {
    context.res = {
      status: 400,
      body: { error: "Requête invalide : sessionId, ordreTour (array) et indexTour (number) requis." }
    };
    return;
  }

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobName = `${sessionId}.json`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    const sessionContent = await streamToString(downloadBlockBlobResponse.readableStreamBody);
    const sessionData = JSON.parse(sessionContent);

    sessionData.ordreTour = ordreTour;
    sessionData.indexTour = indexTour;

    await blockBlobClient.upload(
      JSON.stringify(sessionData),
      Buffer.byteLength(JSON.stringify(sessionData)),
      { overwrite: true }
    );

    context.res = {
      status: 200,
      body: { message: "Ordre de tour mis à jour avec succès" }
    };
  } catch (err) {
    context.log("❌ Erreur dans SetOrdre :", err.message);
    context.res = {
      status: 500,
      body: { error: "Erreur serveur lors de l’enregistrement de l’ordre." }
    };
  }
};

async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => chunks.push(data.toString()));
    readableStream.on("end", () => resolve(chunks.join("")));
    readableStream.on("error", reject);
  });
}
