const { BlobServiceClient } = require("@azure/storage-blob");

const connectionString = process.env.AzureWebJobsStorage;
const containerName = "sessions";

module.exports = async function (context, req) {
  const { sessionId, pseudo, initiative, pv, pvMax } = req.body || {};

  if (typeof pvMax === "number" && typeof pv === "number" && pv > pvMax) {
    context.res = {
      status: 400,
      body: { error: `Les PV (${pv}) ne peuvent pas dépasser les PV max (${pvMax}).` }
    };
    return;
  }

  if (!sessionId || !pseudo || typeof initiative !== "number" || typeof pv !== "number") {
    context.res = {
      status: 400,
      body: { error: "sessionId, pseudo, initiative et pv sont requis et doivent être valides." }
    };
    return;
  }

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobName = `${sessionId}.json`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const downloadResponse = await blockBlobClient.download(0);
    const existingContent = await streamToString(downloadResponse.readableStreamBody);
    const sessionData = JSON.parse(existingContent);

    if (!sessionData.joueurs || !Array.isArray(sessionData.joueurs)) {
      sessionData.joueurs = [];
    }

    let joueur = sessionData.joueurs.find(j => j.pseudo === pseudo);

    if (joueur) {
      joueur.initiative = initiative;
      joueur.pv = pv;
      if (typeof pvMax === "number") {
        joueur.pvMax = pvMax;
      }
    } else {
      const newJoueur = {
        pseudo,
        initiative,
        pv,
        ...(typeof pvMax === "number" ? { pvMax } : {})
      };
      sessionData.joueurs.push(newJoueur);
    }

    const updatedJson = JSON.stringify(sessionData);
    await blockBlobClient.upload(updatedJson, Buffer.byteLength(updatedJson), { overwrite: true });

    context.res = {
      status: 200,
      body: { message: "Initiative et PV mis à jour", pseudo, initiative, pv }
    };
  } catch (err) {
    context.log("❌ Erreur SetInitiative :", err.message);
    context.res = {
      status: 500,
      body: { error: "Erreur lors de la mise à jour des données." }
    };
  }
};

async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (d) => chunks.push(d.toString()));
    readableStream.on("end", () => resolve(chunks.join("")));
    readableStream.on("error", reject);
  });
}
