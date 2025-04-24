const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const dbName = "lampion";

module.exports = async function (context, req) {
  const { email, password } = req.body;

  if (!email || !password) {
    context.res = {
      status: 400,
      body: { error: "Champs manquants" }
    };
    return;
  }

  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection("users");

    const user = await users.findOne({ email });

    if (!user) {
      context.res = {
        status: 401,
        body: { error: "Utilisateur non trouvé" }
      };
      return;
    }

    const match = await bcrypt.compare(password, user.passwordHash);

    if (!match) {
      context.res = {
        status: 401,
        body: { error: "Mot de passe incorrect" }
      };
    } else {
      context.res = {
        status: 200,
        body: { message: "Connexion réussie", userId: user._id }
      };
    }
  } catch (err) {
    context.log("❌ Erreur :", err);
    context.res = {
      status: 500,
      body: { error: "Erreur serveur", details: err.message }
    };
  }
};
