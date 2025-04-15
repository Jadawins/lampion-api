const { BlobServiceClient } = require("@azure/storage-blob");

module.exports = async function (context, req) {
  const sessionId = context.bindingData.sessionId;

  if (!sessionId) {
    context.res = {
      status: 400,
      body: "sessionId manquant"
    };
    return;
  }

  try {
    const AZURE_STORAGE_CONNECTION_STRING = process.env.AzureWebJobsStorage;
    const containerName = "sessions"; // à adapter selon ton blob
    const blobName = `${sessionId}.json`;

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);

    const downloadBlockBlobResponse = await blobClient.download();
    const downloaded = await streamToString(downloadBlockBlobResponse.readableStreamBody);
    const sessionData = JSON.parse(downloaded);

    const ordreTour = sessionData.ordreTour || [];
    const indexTour = sessionData.indexTour ?? 0;

    context.res = {
      status: 200,
      body: {
        ordreTour,
        indexTour
      }
    };
  } catch (error) {
    context.log("Erreur dans GetOrdre :", error.message);
    context.res = {
      status: 500,
      body: "Erreur lors de la récupération de l'ordre de tour"
    };
  }
};

async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
      chunks.push(data.toString());
    });
    readableStream.on("end", () => {
      resolve(chunks.join(""));
    });
    readableStream.on("error", reject);
  });
}
