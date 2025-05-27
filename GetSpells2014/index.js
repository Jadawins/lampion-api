const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');
require('dotenv').config();

router.get('/', async (req, res) => {
  const mongoUri = process.env.MONGO_URI;
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db("myrpgtable");
    const collection = db.collection("2014_spells");

    const spells = await collection.find({}, { projection: { _id: 0 } }).toArray();
    res.status(200).json(spells);
  } catch (err) {
    console.error("❌ Erreur API GetSpells2014 :", err);
    res.status(500).json({ error: "Erreur lors de la récupération des sorts" });
  } finally {
    await client.close();
  }
});

module.exports = router;
