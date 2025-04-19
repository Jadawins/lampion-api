// ✅ FinCombat/index.js – historisation des combats

const { BlobServiceClient } = require("@azure/storage-blob");
const AZURE_STORAGE_CONNECTION_STRING = process.env.AzureWebJobsStorage;
const containerName = "sessions";

module.exports = async function (context, req) {
  const { sessionId } = req.body;

  if (!sessionId) {
    context.res = {
      status: 400,
      body: "sessionId manquant."
    };
    return;
  }

  try {
    const blobClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING)
      .getContainerClient(containerName)
      .getBlockBlobClient(`${sessionId}.json`);

    const download = await blobClient.download(0);
    const content = await streamToText(download.readableStreamBody);
    const data = JSON.parse(content);

    const timestamp = new Date().toISOString();

    // Ajout automatique d’un tag "Combat 1", "Combat 2", etc.
const combatIndex = (data.combats?.length || 0) + 1;

const combat = {
  id: `Combat ${combatIndex}`,
  joueurs: data.joueurs || [],
  monstres: data.monstres || [],
  ordreTour: data.ordreTour || [],
  indexTour: data.indexTour ?? 0,
  logCombat: data.logCombat || [],
  resultat: data.logCombat?.find(e => e.type === "fin_combat")?.resultat || "inconnu",
  timestampFin: timestamp
};

data.combats = data.combats || [];
data.combats.push(combat);

    // Réinitialisation pour prochain combat
    data.monstres = [];
    data.ordreTour = [];
    data.indexTour = 0;
    data.logCombat = [];
    data.combatEnCours = false;

    const updated = JSON.stringify(data, null, 2);
    await blobClient.upload(updated, updated.length, { overwrite: true });

    context.res = {
      status: 200,
      body: "Combat terminé et historisé."
    };

  } catch (err) {
    console.error("Erreur FinCombat:", err);
    context.res = {
      status: 500,
      body: "Erreur serveur dans FinCombat."
    };
  }
};

async function streamToText(readable) {
  readable.setEncoding("utf8");
  let data = "";
  for await (const chunk of readable) {
    data += chunk;
  }
  return data;
}
