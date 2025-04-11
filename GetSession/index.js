const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
    const sessionId = context.bindingData.sessionId;

    if (!sessionId) {
        context.res = {
            status: 400,
            body: "L'ID de session est requis dans l'URL."
        };
        return;
    }

    const AZURE_STORAGE_CONNECTION_STRING = process.env.AzureWebJobsStorage;
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient("sessions");

    const blobName = `${sessionId}.json`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    try {
        const downloadBlockBlobResponse = await blockBlobClient.download();
        const content = await streamToString(downloadBlockBlobResponse.readableStreamBody);

        context.res = {
            status: 200,
            body: JSON.parse(content),
            headers: {
                "Content-Type": "application/json"
            }
        };
    } catch (error) {
        context.res = {
            status: 404,
            body: "Session introuvable ou erreur de lecture."
        };
    }
};

// Convertit un stream blob en string
async function streamToString(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => chunks.push(data.toString()));
        readableStream.on("end", () => resolve(chunks.join("")));
        readableStream.on("error", reject);
    });
}
