// Azure Function : SoinJoueur
// Objectif : appliquer un soin à une cible (joueur ou monstre) et enregistrer l'action dans logCombat

const { BlobServiceClient } = require("@azure/storage-blob");
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = "sessions"; // Nom du conteneur Blob

module.exports = async function (context, req) {
  const { sessionId, auteur, cible, soin } = req.body;

  if (!sessionId || !auteur || !cible || typeof soin !== "number") {
    context.res = {
      status: 400,
      body: "Paramètres manquants ou invalides."
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

    const cibleJoueur = data.joueurs?.find(j => j.pseudo === cible);
    const cibleMonstre = data.monstres?.find(m => m.nom === cible);

    if (!cibleJoueur && !cibleMonstre) {
      context.res = {
        status: 404,
        body: "Cible introuvable."
      };
      return;
    }

    const cibleEntite = cibleJoueur || cibleMonstre;
    const pvMax = cibleEntite.pvMax || cibleEntite.pv || 100; // par défaut 100 si non défini
    const pvActuel = cibleEntite.pv || 0;
    const nouveauPV = Math.min(pvActuel + soin, pvMax);

    cibleEntite.pv = nouveauPV;

    if (!data.logCombat) data.logCombat = [];
    data.logCombat.push({
      type: "soin",
      auteur,
      cible,
      valeur: soin,
      timestamp
    });

    const updatedData = JSON.stringify(data, null, 2);
    await blobClient.upload(updatedData, updatedData.length, { overwrite: true });

    context.res = {
      status: 200,
      body: {
        message: `Soin appliqué à ${cible} : ${soin} PV (nouveaux PV : ${nouveauPV})`,
        pv: nouveauPV
      }
    };

  } catch (err) {
    console.error("Erreur dans SoinJoueur:", err);
    context.res = {
      status: 500,
      body: "Erreur interne lors du traitement du soin."
    };
  }
};

// Utilitaire pour lire le contenu du blob
async function streamToText(readable) {
  readable.setEncoding("utf8");
  let data = "";
  for await (const chunk of readable) {
    data += chunk;
  }
  return data;
}
