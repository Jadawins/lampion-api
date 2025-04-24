const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");

const uri = process.env.MONGO_URI; // à définir dans les paramètres d'application Azure
const client = new MongoClient(uri);
const dbName = "lampion";

module.exports = async function (context, req) {
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection("users");

  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    context.res = {
      status: 400,
      body: { error: "Champs manquants" }
    };
    return;
  }

  const existing = await users.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    context.res = {
      status: 409,
      body: { error: "Utilisateur déjà existant" }
    };
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  await users.insertOne({
    username,
    email,
    passwordHash: hash,
    personnages: []
  });

  context.res = {
    status: 201,
    body: { message: "Utilisateur créé avec succès" }
  };
};
