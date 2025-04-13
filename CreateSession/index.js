const { v4: uuidv4 } = require("uuid");

module.exports = async function (context, req) {
  context.log("🔍 Requête reçue (méthode POST)");
  context.log("🌐 Headers :", req.headers);
  context.log("📦 Body brut :", req.body);

  // Essaye de lire nomAventure depuis le body
  let nomAventure = null;
  if (req.body && typeof req.body === "object") {
    nomAventure = req.body.nomAventure;
  }

  // Fallback depuis les query params
  if (!nomAventure && req.query?.nomAventure) {
    nomAventure = req.query.nomAventure;
  }

  if (!nomAventure) {
    context.log("❌ nomAventure manquant !");
    context.res = {
      status: 400,
      headers: {
        "Content-Type": "application/json"
      },
      body: {
        error: "Le nom de l'aventure est requis (et non trouvé dans req.body ou req.query)."
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

  // TODO : ajouter la logique de stockage ici si nécessaire (Blob, etc.)

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
