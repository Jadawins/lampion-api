const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

module.exports = async function (context, req) {
  try {
    const { userId, character } = req.body;

    if (!userId) {
      context.res = {
        status: 400,
        body: "Le champ 'userId' est requis."
      };
      return;
    }

    // character peut être vide ou partiel au départ
    const newCharacter = {
      userId,
      ...character,
      createdAt: new Date()
    };

    await client.connect();
    const db = client.db("lampion");
    const result = await db.collection("characters").insertOne(newCharacter);

    context.res = {
      status: 201,
      body: {
        message: "Personnage créé avec succès",
        characterId: result.insertedId
      }
    };
  } catch (error) {
    console.error("Erreur création personnage :", error);
    context.res = {
      status: 500,
      body: "Erreur interne lors de la création du personnage."
    };
  } finally {
    await client.close();
  }
};