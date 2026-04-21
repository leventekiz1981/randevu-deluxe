const express = require('express');
const router = express.Router();

// Platzhalter — wird später ausgebaut
router.get('/', (req, res) => {
  res.json({ message: 'Customers Route aktiv' });
});

module.exports = router;
