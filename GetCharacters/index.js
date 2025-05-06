const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;

module.exports = async function (context, req) {
  try {
    const userId = req.query.userId || req.body?.userId;
    if (!userId) {
      context.res = {
        status: 400,
        body: "Paramètre userId requis"
      };
      return;
    }

    const client = new MongoClient(uri);
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
  } catch (err) {
    console.error("❌ Erreur MongoDB :", err.message);
    context.res = {
      status: 500,
      body: "Erreur MongoDB : " + err.message
    };
  }
};
