module.exports = async function (context, req) {
    try {
      context.log("📥 Reçu :", req.body);
  
      const { username, email, password } = req.body;
  
      if (!username || !email || !password) {
        context.res = {
          status: 400,
          body: { error: "Champs manquants" }
        };
        return;
      }
  
      const db = await require("../db")(); // <- assure-toi que ça marche bien
      const users = db.collection("users");
  
      const existing = await users.findOne({ $or: [{ username }, { email }] });
      if (existing) {
        context.res = {
          status: 409,
          body: { error: "Utilisateur déjà existant" }
        };
        return;
      }
  
      const bcrypt = require("bcrypt");
      const hash = await bcrypt.hash(password, 10);
  
      await users.insertOne({ username, email, passwordHash: hash, personnages: [] });
  
      context.res = {
        status: 201,
        body: { message: "Utilisateur créé avec succès" }
      };
  
    } catch (error) {
      context.log("❌ Erreur :", error);
      context.res = {
        status: 500,
        body: { error: "Erreur serveur", details: error.message }
      };
    }
  };
  