const { BlobServiceClient } = require("@azure/storage-blob");

module.exports = async function (context, req) {
    const sessionId = req.params.sessionId;

    if (!sessionId) {
        context.res = {
            status: 400,
            body: "L'ID de session est requis."
        };
        return;
    }

    try {
        const AZURE_STORAGE_CONNECTION_STRING = process.env.AzureWebJobsStorage;
        const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
        const containerClient = blobServiceClient.getContainerClient("sessions");
        const blobClient = containerClient.getBlockBlobClient(`${sessionId}.json`);

        const downloadBlockBlobResponse = await blobClient.download();
        const content = await streamToString(downloadBlockBlobResponse.readableStreamBody);

        context.res = {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.parse(content)
        };
    } catch (err) {
        context.res = {
            status: 500,
            body: `❌ Impossible de récupérer la session ${sessionId}.\n${err.message}`
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
