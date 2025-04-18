const { BlobServiceClient } = require("@azure/storage-blob");
const AZURE_STORAGE_CONNECTION_STRING = process.env.AzureWebJobsStorage;
const containerName = "sessions";

module.exports = async function (context, req) {
  const { sessionId, auteur, cible, degats } = req.body;

  if (!sessionId || !auteur || !cible || typeof degats !== "number") {
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
    const cibleOrdre = data.ordreTour?.find(e => e.pseudo === cible || e.nom === cible);
    const cibleEntite = cibleJoueur || cibleMonstre || cibleOrdre;

    if (!cibleEntite) {
      context.res = {
        status: 404,
        body: "Cible introuvable."
      };
      return;
    }

    const pvActuel = cibleEntite.pv || 0;
    const nouveauPV = Math.max(pvActuel - degats, 0);

// Met à jour les PV dans toutes les structures
if (cibleJoueur) {
  const joueur = data.joueurs.find(j => j.pseudo === cible);
  if (joueur) joueur.pv = nouveauPV;
}
if (cibleMonstre) {
  const monstre = data.monstres.find(m => m.nom === cible);
  if (monstre) monstre.pv = nouveauPV;
}
if (cibleOrdre) {
  const ordre = data.ordreTour.find(e => (e.pseudo || e.nom) === cible);
  if (ordre) ordre.pv = nouveauPV;
}

    if (!data.logCombat) data.logCombat = [];

    data.logCombat.push({
      type: "attaque",
      auteur,
      cible,
      degats,
      timestamp
    });

    if (nouveauPV === 0) {
      data.logCombat.push({
        type: "mort",
        auteur,
        cible,
        timestamp
      });
    
      if (cibleMonstre) {
        data.ordreTour = data.ordreTour?.filter(e => e.nom !== cible);
        data.monstres = data.monstres?.filter(m => m.nom !== cible);
        data.logCombat.push({
          type: "sortie_combat",
          auteur,
          cible,
          raison: "PV à 0",
          timestamp
        });
      }
      // 🏁 Fin de combat détectée ?
const tousJoueursMorts = data.joueurs.length > 0 && data.joueurs.every(j => j.pv === 0);
const tousMonstresMorts = data.monstres.length === 0;

if (tousJoueursMorts || tousMonstresMorts) {
  data.logCombat.push({
    type: "fin_combat",
    resultat: tousJoueursMorts ? "défaite" : "victoire",
    timestamp
  });
}
    }
    // 🛑 Retirer le joueur du tour si PV à 0
if (cibleJoueur && nouveauPV === 0) {
  data.ordreTour = data.ordreTour?.filter(e => e.pseudo !== cible);
}

    const updatedData = JSON.stringify(data, null, 2);
await blobClient.upload(updatedData, updatedData.length, { overwrite: true });


    context.res = {
      status: 200,
      body: {
        message: `${auteur} a infligé ${degats} dégâts à ${cible} (PV restants : ${nouveauPV})`,
        pv: nouveauPV
      }
    };

  } catch (err) {
    console.error("Erreur dans AttaqueJoueur:", err);
    context.res = {
      status: 500,
      body: "Erreur interne lors du traitement de l'attaque."
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
