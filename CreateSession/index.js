// ✅ index.js – Version corrigée pour parser le JSON brut si req.body est undefined
const { v4: uuidv4 } = require("uuid");
const { BlobServiceClient } = require("@azure/storage-blob");

module.exports = async function (context, req) {
  context.log("🔍 Requête reçue (méthode POST)");
  context.log("🌐 Headers :", req.headers);
  context.log("📦 Body brut :", req.body);

  let body = req.body;

  // 🔧 Si Azure ne parse pas automatiquement, on le fait à la main
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
      headers: {
        "Content-Type": "application/json"
      },
      body: {
        error: "Le nom de l'aventure est requis."
      }
    };
    return;
  }

  const sessionId = uuidv4().split("-")[0];
  const sessionData = {
    nomAventure,
    etat: "en_attente",
    joueurs: []
  };

  context.log("✅ Session générée :", sessionId);
  context.log("📝 Données session :", sessionData);

  // TODO : Ajouter la logique de stockage ici (Blob, BDD, etc.)

  context.res = {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      sessionId,
      nomAventure
    }
  };
};
