require('dotenv').config();
const { MongoClient } = require('mongodb');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  console.log('>> ROUTE /api/GetSkills EXECUTED <<');
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    const db = client.db('myrpgtable');
    const competences = await db.collection('competences').find().toArray();
    res.status(200).json(competences);
  } catch (error) {
    console.error('Erreur GetSkills :', error);
    res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
});

module.exports = router;
