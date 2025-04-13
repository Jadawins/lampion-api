const { v4: uuidv4 } = require("uuid");
const { BlobServiceClient } = require("@azure/storage-blob");

module.exports = async function (context, req) {
  const nomAventure = req.query.nomAventure || req.body?.nomAventure;

  if (!nomAventure) {
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
    nomAventure: nomAventure,
    etat: "en_attente",
    joueurs: []
  };

  // ... logique de stockage ici (blob, base, etc.)

  context.res = {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      sessionId: sessionId,
      nomAventure: nomAventure
    }
  };
};
