const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");

module.exports = async function (context, req) {
    const sessionName = req.body.sessionName;
    const pseudo = req.body.pseudo;

    if (!sessionName || !pseudo) {
        context.res = {
            status: 400,
            body: "Les champs 'sessionName' et 'pseudo' sont requis."
        };
        return;
    }

    const AZURE_STORAGE_CONNECTION_STRING = process.env.AzureWebJobsStorage;
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient("sessions");

    const blobName = `${sessionName}.json`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    let sessionData = { joueurs: [] };

    try {
        const downloadBlockBlobResponse = await blockBlobClient.download();
        const downloaded = await streamToString(downloadBlockBlobResponse.readableStreamBody);
        sessionData = JSON.parse(downloaded);
    } catch (err) {
        // Fichier inexistant → pas de souci, on démarre une nouvelle session
    }

    const joueurExiste = sessionData.joueurs.some(j => j.pseudo.toLowerCase() === pseudo.toLowerCase());

    if (joueurExiste) {
        context.res = {
            status: 409,
            body: { message: `Le pseudo '${pseudo}' est déjà utilisé dans cette session.` }
        };
        return;
    }

    sessionData.joueurs.push({ pseudo, id: uuidv4() });

    const uploadContent = JSON.stringify(sessionData);
    await blockBlobClient.upload(uploadContent, Buffer.byteLength(uploadContent), { overwrite: true });

    context.res = {
        status: 200,
        body: {
            message: `Bienvenue ${pseudo}, tu as rejoint la session '${sessionName}'.`
        }
    };
};

async function streamToString(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", data => chunks.push(data.toString()));
        readableStream.on("end", () => resolve(chunks.join("")));
        readableStream.on("error", reject);
    });
}
