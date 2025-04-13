const { BlobServiceClient } = require("@azure/storage-blob");

module.exports = async function (context, req) {
  const sessionId = context.bindingData.sessionId;

  if (!sessionId) {
    context.res = {
      status: 400,
      body: "ID de session manquant"
    };
    return;
  }

  try {
    const AZURE_STORAGE_CONNECTION_STRING = process.env["AzureWebJobsStorage"];
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient("sessions");
    const blobClient = containerClient.getBlobClient(`${sessionId}.json`);

    const downloadBlockBlobResponse = await blobClient.download();
    const downloaded = await streamToString(downloadBlockBlobResponse.readableStreamBody);
    const sessionData = JSON.parse(downloaded);

    context.res = {
      status: 200,
      body: sessionData
    };
  } catch (err) {
    context.res = {
      status: 404,
      body: "Session introuvable"
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
