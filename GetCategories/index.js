const { MongoClient } = require('mongodb');
const express = require('express');
const router = express.Router();

const client = new MongoClient(process.env.MONGO_URI);
const dbName = 'myrpgtable';
const collectionName = 'categories';

// Route GET pour récupérer les catégories
router.get('/', async (req, res) => {
  console.log('>> ROUTE /api/GetCategories EXECUTED <<');
  console.log('DEBUG MONGO_URI in Route:', process.env.MONGO_URI);

  const client = new MongoClient(process.env.MONGO_URI);
  try {
    await client.connect();
    console.log('>> Connexion réussie <<');
    const db = client.db('myrpgtable');
    const collection = db.collection('categories');
    const categories = await collection.find().toArray();
    console.log('>> Catégories récupérées <<', categories);
    res.status(200).json(categories);
  } catch (error) {
    console.error('>> Erreur capturée :', JSON.stringify(error, null, 2));
    res.status(500).json({ error: error.message });
  } finally {
    await client.close();
    console.log('>> Client Mongo fermé <<');
  }
});

module.exports = router;
