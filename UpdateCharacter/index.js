const { MongoClient, ObjectId } = require("mongodb");

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

module.exports = async function (context, req) {
  try {
    const characterId = context.bindingData.id;
    const updates = req.body;

    if (!characterId || !updates) {
      context.res = {
        status: 400,
        body: "characterId et données à mettre à jour requis"
      };
      return;
    }

    await client.connect();
    const db = client.db("lampion");

    const result = await db.collection("characters").updateOne(
      { _id: new ObjectId(characterId) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      context.res = {
        status: 404,
        body: "Personnage non trouvé"
      };
      return;
    }

    context.res = {
      status: 200,
      body: "Personnage mis à jour avec succès"
    };
  } catch (error) {
    console.error("Erreur de mise à jour :", error);
    context.res = {
      status: 500,
      body: "Erreur interne"
    };
  } finally {
    await client.close();
  }
};
