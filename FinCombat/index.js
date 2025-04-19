const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
  const sessionId = req.body?.sessionId;
  if (!sessionId) {
    context.res = {
      status: 400,
      body: "Paramètre sessionId manquant."
    };
    return;
  }

  try {
    const AZURE_STORAGE_CONNECTION_STRING = process.env["AzureWebJobsStorage"];
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient("sessions");
    const blockBlobClient = containerClient.getBlockBlobClient(`${sessionId}.json`);

    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    const content = await streamToString(downloadBlockBlobResponse.readableStreamBody);
    const data = JSON.parse(content);

    data.combatEnCours = false;

    await blockBlobClient.upload(JSON.stringify(data), Buffer.byteLength(JSON.stringify(data)), {
      blobHTTPHeaders: { blobContentType: "application/json" }
    });

    context.res = {
      status: 200,
      body: `Combat terminé pour la session ${sessionId}`
    };
  } catch (err) {
    context.log.error("Erreur FinCombat:", err.message);
    context.res = {
      status: 500,
      body: "Erreur lors de la mise à jour du fichier de session."
    };
  }
};

// Fonction utilitaire pour convertir un stream en string
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", data => chunks.push(data.toString()));
    readableStream.on("end", () => resolve(chunks.join("")));
    readableStream.on("error", reject);
  });
}
