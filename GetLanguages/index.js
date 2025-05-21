require('dotenv').config();
const { MongoClient } = require('mongodb');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  console.log('>> ROUTE /api/GetLanguages EXECUTED <<');
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    const db = client.db('myrpgtable');
    const langues = await db.collection('langues').find().toArray();
    res.status(200).json(langues);
  } catch (error) {
    console.error('Erreur GetLanguages :', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
});

module.exports = router;