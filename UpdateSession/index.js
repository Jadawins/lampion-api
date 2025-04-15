const { BlobServiceClient } = require("@azure/storage-blob");

const connectionString = process.env.AzureWebJobsStorage;
const containerName = "sessions";

module.exports = async function (context, req) {
  context.log("🔄 Requête reçue pour mise à jour de session");

  const { sessionId, sessionActive, joueurs } = req.body || {};

  if (!sessionId) {
    context.res = {
      status: 400,
      body: { error: "sessionId requis" }
    };
    return;
  }

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobName = `${sessionId}.json`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    const downloaded = await streamToString(downloadBlockBlobResponse.readableStreamBody);
    const sessionData = JSON.parse(downloaded);

    sessionData.sessionActive = sessionActive ?? true; // On le met à true si non précisé
    if (Array.isArray(joueurs)) {
      sessionData.joueurs = joueurs;
    }

    const updatedContent = JSON.stringify(sessionData);
    await blockBlobClient.upload(updatedContent, Buffer.byteLength(updatedContent), { overwrite: true });

    context.res = {
      status: 200,
      body: { message: "Session mise à jour", sessionId }
    };
  } catch (err) {
    context.log("❌ Erreur UpdateSession :", err.message);
    context.res = {
      status: 500,
      body: { error: "Erreur lors de la mise à jour de la session." }
    };
  }
};

// 🔧 Utilitaire : transformer stream en string
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => chunks.push(data.toString()));
    readableStream.on("end", () => resolve(chunks.join("")));
    readableStream.on("error", reject);
  });
}
