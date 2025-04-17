const { BlobServiceClient } = require("@azure/storage-blob");
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = "sessions";

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
    console.log("📥 Paramètres reçus :", { sessionId, auteur, cible, soin });

    const blobClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING)
      .getContainerClient(containerName)
      .getBlockBlobClient(`${sessionId}.json`);

    console.log("📦 Lecture du blob JSON...");
    const download = await blobClient.download(0);
    const content = await streamToText(download.readableStreamBody);
    const data = JSON.parse(content);
    console.log("📄 Contenu JSON lu avec succès");

    const timestamp = new Date().toISOString();

    const cibleJoueur = data.joueurs?.find(j => j.pseudo === cible);
    const cibleMonstre = data.monstres?.find(m => m.nom === cible);
    const cibleOrdre = data.ordreTour?.find(e => e.pseudo === cible || e.nom === cible);
    console.log("🎯 Cible trouvée dans :", {
      joueur: !!cibleJoueur,
      monstre: !!cibleMonstre,
      ordre: !!cibleOrdre
    });

    if (!cibleJoueur && !cibleMonstre && !cibleOrdre) {
      context.res = {
        status: 404,
        body: "Cible introuvable."
      };
      return;
    }

    const cibleEntite = cibleJoueur || cibleMonstre || cibleOrdre;
    const pvMax = cibleEntite.pvMax || cibleEntite.pv || 100;
    const pvActuel = cibleEntite.pv || 0;
    const nouveauPV = Math.min(pvActuel + soin, pvMax);

    if (cibleJoueur) cibleJoueur.pv = nouveauPV;
    if (cibleMonstre) cibleMonstre.pv = nouveauPV;
    if (cibleOrdre) cibleOrdre.pv = nouveauPV;

    if (!data.logCombat) data.logCombat = [];
    data.logCombat.push({
      type: "soin",
      auteur,
      cible,
      valeur: soin,
      timestamp
    });

    const updatedData = JSON.stringify(data, null, 2);
    console.log("💾 Sauvegarde du fichier...", updatedData.length);

    await blobClient.upload(updatedData, Buffer.byteLength(updatedData), { overwrite: true });

    context.res = {
      status: 200,
      body: {
        message: `Soin appliqué à ${cible} : ${soin} PV (nouveaux PV : ${nouveauPV})`,
        pv: nouveauPV
      }
    };

  } catch (err) {
    console.error("🔥 Erreur attrapée :", err.message);
    console.error(err.stack);
    context.res = {
      status: 500,
      body: "Erreur interne lors du traitement du soin."
    };
  }
};

// 🔧 Utilitaire : Convertir stream en texte
async function streamToText(readable) {
  readable.setEncoding("utf8");
  let data = "";
  for await (const chunk of readable) {
    data += chunk;
  }
  return data;
}
