const crypto = require('crypto');
const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
    try {
        const AZURE_STORAGE_CONNECTION_STRING = process.env.AzureWebJobsStorage;
        const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
        const containerClient = blobServiceClient.getContainerClient("sessions");

        const sessionId = crypto.randomBytes(4).toString('hex');
        const blockBlobClient = containerClient.getBlockBlobClient(`${sessionId}.json`);
        const initialData = { joueurs: [] };

        await blockBlobClient.upload(
            JSON.stringify(initialData),
            Buffer.byteLength(JSON.stringify(initialData))
        );

        context.res = {
            status: 200,
            body: {
                message: "Session créée avec succès.",
                sessionId: sessionId
            },
            headers: {
                "Content-Type": "application/json"
            }
        };
    } catch (error) {
        context.log.error("Erreur dans CreateSession:", error.message);
        context.res = {
            status: 500,
            body: {
                message: "Erreur lors de la création de la session.",
                details: error.message
            }
        };
    }
};
