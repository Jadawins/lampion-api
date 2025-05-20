const { MongoClient } = require('mongodb');

module.exports = async function (req, res) {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('myrpgtable');
    const collection = db.collection('caracteristiques');

    const data = await collection.find().toArray();

    // On retourne uniquement l'essentiel
    const stats = data.map(c => ({
      index: c.index,
      name: c.name?.full_name || c.index
    }));

    res.status(200).json(stats);
  } catch (err) {
    console.error("Erreur API GetStats:", err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    await client.close();
  }
};

module.exports = router;