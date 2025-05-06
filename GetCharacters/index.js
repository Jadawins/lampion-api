const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

module.exports = async function (context, req) {
  try {
    const userId = req.query.userId;
    console.log("Requête pour userId :", userId);

    if (!userId) {
      context.res = {
        status: 400,
        body: "Paramètre userId requis"
      };
      return;
    }

    await client.connect();
    const db = client.db("lampion");

    const characters = await db
      .collection("characters")
      .find({ userId })
      .toArray();

    context.res = {
      status: 200,
      body: characters
    };
  } catch (error) {
    console.error("Erreur récupération personnages :", error);
    context.res = {
      status: 500,
      body: "Erreur interne"
    };
  } finally {
    await client.close();
  }
};
