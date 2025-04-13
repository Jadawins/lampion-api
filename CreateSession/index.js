// ✅ Étape 1 : Mise à jour de la fonction CreateSession dans Azure Functions (index.js)

const { v4: uuidv4 } = require("uuid");
const { BlobServiceClient } = require("@azure/storage-blob");

module.exports = async function (context, req) {
  const nomAventure = req.query.nomAventure || req.body?.nomAventure;

  if (!nomAventure) {
    context.res = {
      status: 400,
      body: "Le nom de l'aventure est requis."
    };
    return;
  }

  const sessionId = uuidv4().split("-")[0];
  const sessionData = {
    nomAventure: nomAventure,
    etat: "en_attente",
    joueurs: []
  };

  const AZURE_STORAGE_CONNECTION_STRING = process.env["AzureWebJobsStorage"];
  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient("sessions");
  const blockBlobClient = containerClient.getBlockBlobClient(`${sessionId}.json`);

  await blockBlobClient.upload(JSON.stringify(sessionData), Buffer.byteLength(JSON.stringify(sessionData)));

  context.res = {
    status: 200,
    body: {
      sessionId: sessionId,
      nomAventure: nomAventure
    }
  };
};
