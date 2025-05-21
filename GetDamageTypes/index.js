const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';

// GET /api/GetDamageTypes
router.get('/api/GetDamageTypes', async (req, res) => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    return res.status(500).json({ error: 'MONGO_URI non défini dans les variables d’environnement' });
  }

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db("myrpgtable");
    const collection = db.collection("types_dommage");

    const result = await collection.find({}, { projection: { _id: 0 } }).toArray();
    res.status(200).json(result);
  } catch (err) {
    console.error("Erreur API GetDamageTypes:", err);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des types de dégâts" });
  } finally {
    await client.close();
  }
});

module.exports = router;