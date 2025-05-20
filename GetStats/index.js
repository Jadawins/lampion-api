const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';

router.get('/', async (req, res) => {
  console.log('DEBUG MONGO_URI:', uri);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('myrpgtable');
    const collection = db.collection('caracteristiques');

    const data = await collection.find().toArray();

    const stats = data.map(c => ({
      index: c.index,
      name: c.name?.full_name || c.index
    }));

    res.status(200).json(stats);
  } catch (err) {
    console.error('❌ Erreur API GetStats:', err.message);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  } finally {
    await client.close();
  }
});

module.exports = router;
