// frontend/routes/iscrizioni.js
import express from 'express';
import {
  mostraFormIscrizione,
  selezionaEvento,
  ricercaClienti,
  salvaIscrizione,
  mostraIscrittiEvento,
  exportExcelIscrittiEvento,
  exportPdfIscrittiEvento // ✅ aggiunto per PDF
} from '../controllers/iscrizioniController.js';

const router = express.Router();

// ✅ Mostra pagina principale con selezione evento e ricerca cliente
router.get('/', mostraFormIscrizione);

// ✅ Salva selezione evento (menu a tendina)
router.post('/seleziona-evento', selezionaEvento);

// ✅ Ricerca clienti in base ai campi del form
router.get('/ricerca-cliente', ricercaClienti);


// ✅ Salva l'iscrizione (cliente → evento)
router.post('/', salvaIscrizione);

router.get('/evento/:id_evento/iscritti', mostraIscrittiEvento);

router.get('/evento/:id_evento/export', exportExcelIscrittiEvento);

// ✅ Esporta PDF
router.get('/evento/:id_evento/export-pdf', exportPdfIscrittiEvento);

export default router;
