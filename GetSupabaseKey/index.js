const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const key = process.env.VITE_SUPABASE_KEY;
  const url = process.env.VITE_SUPABASE_URL;

  if (!key || !url) {
    return res.status(500).send("Clé ou URL Supabase manquante dans les variables d'environnement.");
  }

  res.status(200).json({
    key: key,
    url: url
  });
});

module.exports = router;
