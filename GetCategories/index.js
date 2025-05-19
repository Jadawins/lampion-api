require('dotenv').config();
const { MongoClient } = require('mongodb');
const express = require('express');
const router = express.Router();

const client = new MongoClient(process.env.MONGO_URI);
const dbName = 'myrpgtable';
const collectionName = 'categories';

// Route GET pour récupérer les catégories
router.get('/', async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const categories = await collection.find().toArray();
    res.status(200).json(categories);
  } catch (error) {
  console.error('Erreur lors de la récupération des catégories :', error.message, error.stack);
  res.status(500).json({ error: error.message });
  } finally {
    // Pas besoin de fermer ici si tu utilises un client partagé
  }
});

module.exports = router;
