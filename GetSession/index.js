const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
  const connectionString = process.env.AzureWebJobsStorage;
  const sessionId = req.params.sessionId; // récupéré depuis l'URL

  if (!sessionId) {
    context.res = {
      status: 400,
      body: { message: "L'ID de session est manquant" },
      headers: { "Content-Type": "application/json" }
    };
    return;
  }

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient("sessions");
    const blobClient = containerClient.getBlobClient(`${sessionId}.json`);

    const exists = await blobClient.exists();
    if (!exists) {
      context.res = {
        status: 404,
        body: { message: "Session introuvable" },
        headers: { "Content-Type": "application/json" }
      };
      return;
    }

    const downloadBlockBlobResponse = await blobClient.download();
    const downloaded = await streamToText(downloadBlockBlobResponse.readableStreamBody);

    context.res = {
      status: 200,
      body: JSON.parse(downloaded),
      headers: { "Content-Type": "application/json" }
    };
  } catch (err) {
    context.log("Erreur dans GetSession:", err.message);
    context.res = {
      status: 500,
      body: { message: "Erreur serveur", error: err.message },
      headers: { "Content-Type": "application/json" }
    };
  }
};

async function streamToText(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on("data", (data) => {
      chunks.push(data.toString());
    });
    readable.on("end", () => {
      resolve(chunks.join(""));
    });
    readable.on("error", reject);
  });
}
