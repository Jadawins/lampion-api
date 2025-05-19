const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  console.log('>> ROUTE /api/GetCategories EXECUTED <<');
  res.json({ success: true, message: 'La route fonctionne, sans Mongo' });
});

module.exports = router;
