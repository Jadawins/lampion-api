// ✅ Fonction Azure JoinSession mise à jour
// ➕ Ajoute un joueur à une session existante
const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");

const connectionString = process.env.AzureWebJobsStorage;
const containerName = "sessions";

module.exports = async function (context, req) {
  let body = req.body;
  if (!body || typeof body !== "object") {
    try {
      body = JSON.parse(req.rawBody);
    } catch (e) {
      context.res = { status: 400, body: "Requête invalide (JSON mal formé)." };
      return;
    }
  }

  const sessionId = body.sessionId;
  const pseudo = body.pseudo;

  if (!sessionId || !pseudo) {
    context.res = { status: 400, body: "sessionId ou pseudo manquant." };
    return;
  }

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(`${sessionId}.json`);

    const downloadBlockBlob = await blobClient.downloadToBuffer();
    const jsonData = JSON.parse(downloadBlockBlob.toString());

    if (!jsonData || !Array.isArray(jsonData.joueurs)) {
      context.res = { status: 404, body: "Session introuvable ou corrompue." };
      return;
    }

    // Vérifie si le pseudo existe déjà
    const existeDeja = jsonData.joueurs.some(j => j.pseudo.toLowerCase() === pseudo.toLowerCase());
    if (existeDeja) {
      context.res = { status: 200, body: "Joueur déjà inscrit." };
      return;
    }

    const joueur = {
      pseudo,
      id: uuidv4(),
      initiative: 0
    };

    jsonData.joueurs.push(joueur);
    const updatedContent = JSON.stringify(jsonData);

    await blobClient.upload(updatedContent, Buffer.byteLength(updatedContent), { overwrite: true });

    context.res = {
      status: 200,
      body: {
        message: `✅ ${pseudo} a rejoint la session !`,
        joueur
      }
    };
  } catch (err) {
    context.res = {
      status: 500,
      body: `❌ Erreur interne : ${err.message}`
    };
  }
};
