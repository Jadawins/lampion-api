const express = require('express');
const { MongoClient } = require('mongodb');
const router = express.Router();

const mongoUri = 'mongodb://localhost:27017';
const dbName = 'lampion';
const collectionName = 'categories';

// Route GET pour récupérer les catégories
router.get('/', async (req, res) => {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const categories = await collection.find().toArray();
    res.status(200).json(categories);
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    await client.close();
  }
});

module.exports = router;