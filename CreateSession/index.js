const crypto = require('crypto');
const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
    // Connexion à Azure Blob Storage
    const AZURE_STORAGE_CONNECTION_STRING = process.env.AzureWebJobsStorage;
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient("sessions");

    // Génération d'un ID de session unique
    const sessionId = crypto.randomBytes(4).toString('hex'); // Exemple : 'a3b4c7f1'

    // Création du blob pour la session avec un fichier JSON vide (initial)
    const blockBlobClient = containerClient.getBlockBlobClient(`${sessionId}.json`);
    const initialData = { joueurs: [] };  // Session vide avec la liste des joueurs

    // Uploader le fichier blob de session dans Azure
    await blockBlobClient.upload(JSON.stringify(initialData), Buffer.byteLength(JSON.stringify(initialData)));

    // Réponse au MJ avec l'ID de la session
    context.res = {
        status: 200,
        body: {
            message: "Session créée avec succès.",
            sessionId: sessionId  // L'ID que le MJ peut partager avec les joueurs
        },
        headers: {
            "Content-Type": "application/json"
        }
    };
};
