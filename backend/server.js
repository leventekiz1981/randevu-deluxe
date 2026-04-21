require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware (Vorverarbeitung jeder Anfrage) ──────────────────────
app.use(cors());                        // Frontend darf mit Backend sprechen
app.use(express.json());                // Anfragen im JSON-Format verstehen

// ── Routen (Abteilungen des Servers) ───────────────────────────────
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/salons',       require('./routes/salons'));
app.use('/api/customers',    require('./routes/customers'));
app.use('/api/wa-logs',      require('./routes/wa-logs'));

// ── Startseite des Servers (nur zum Testen) ─────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    app: 'Randevu-Deluxe API',
    version: '1.0.0'
  });
});

// ── 404 Fehler (wenn eine Route nicht existiert) ────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Diese Route existiert nicht.' });
});

// ── Server starten ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✓ Randevu-Deluxe Server läuft auf Port ${PORT}`);
  console.log(`✓ Öffne: http://localhost:${PORT}`);
});
