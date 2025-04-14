// ✅ index.js – version finale avec enregistrement JSON dans Azure Blob
const { v4: uuidv4 } = require("uuid");
const { BlobServiceClient } = require("@azure/storage-blob");

const connectionString = process.env.AzureWebJobsStorage;
const containerName = "sessions";

module.exports = async function (context, req) {
  context.log("🔍 Requête reçue (méthode POST)");
  context.log("🌐 Headers :", req.headers);
  context.log("📦 Body brut :", req.body);

  let body = req.body;
  if (!body || typeof body !== "object") {
    try {
      body = JSON.parse(req.rawBody);
    } catch (e) {
      context.log("❌ Erreur parsing JSON manuel :", e);
    }
  }

  let nomAventure = body?.nomAventure || req.query?.nomAventure;

  if (!nomAventure) {
    context.log("❌ nomAventure manquant !");
    context.res = {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: { error: "Le nom de l'aventure est requis." }
    };
    return;
  }

  const sessionId = uuidv4().split("-")[0];
  const sessionData = {
    sessionId,
    nomAventure,
    sessionActive: false,
    joueurs: []
  };

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobName = `${sessionId}.json`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const jsonContent = JSON.stringify(sessionData);
    await blockBlobClient.upload(jsonContent, Buffer.byteLength(jsonContent));

    context.log(`✅ Fichier ${blobName} enregistré dans le container '${containerName}'`);
  } catch (e) {
    context.log("❌ Erreur lors de l’enregistrement dans le blob :", e.message);
    context.res = {
      status: 500,
      body: { error: "Erreur lors de l’enregistrement de la session." }
    };
    return;
  }

  context.res = {
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: {
      sessionId,
      nomAventure
    }
  };
};
