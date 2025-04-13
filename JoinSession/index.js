// ✅ Fonction Azure JoinSession mise à jour
// ➕ Ajoute un joueur à une session existante
module.exports = async function (context, req) {
    const sessionId = context.bindingData.sessionId;
    const pseudo = req.query.pseudo;
    const blobClient = require("../common/blobClient");
  
    if (!sessionId || !pseudo) {
      context.res = { status: 400, body: "Missing sessionId or pseudo" };
      return;
    }
  
    try {
      // ✉️ Récupération du fichier JSON de la session
      const jsonData = await blobClient.readJson(`${sessionId}.json`);
  
      if (!jsonData || !jsonData.joueurs) {
        context.res = { status: 404, body: "Session not found or corrupted." };
        return;
      }
  
      // ❌ Vérifie si le pseudo est déjà présent
      const existeDeja = jsonData.joueurs.some(j => j.pseudo.toLowerCase() === pseudo.toLowerCase());
      if (existeDeja) {
        context.res = { status: 200, body: "Joueur déjà inscrit." };
        return;
      }
  
      // ➕ Ajoute le joueur
      const joueur = {
        pseudo,
        id: crypto.randomUUID(),
        initiative: 0 // Par défaut en attente du MJ
      };
      jsonData.joueurs.push(joueur);
  
      // ✏️ Sauvegarde le JSON mis à jour
      await blobClient.writeJson(`${sessionId}.json`, jsonData);
  
      context.res = {
        status: 200,
        body: {
          message: `Joueur ${pseudo} ajouté à la session ${sessionId}.`,
          joueur
        }
      };
    } catch (err) {
      context.res = { status: 500, body: `Erreur interne: ${err.message}` };
    }
  };