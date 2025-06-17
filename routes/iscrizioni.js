// frontend/routes/iscrizioni.js
import express from 'express';
import {
  mostraFormIscrizione,
  selezionaEvento,
  ricercaClienti,
  salvaIscrizione,
  mostraIscrittiEvento,
  exportExcelIscrittiEvento,
  exportPdfIscrittiEvento
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

// ✅ Mostra iscritti evento
router.get('/evento/:id_evento/iscritti', mostraIscrittiEvento);

// ✅ EXCEL - Due alias per stessa funzione
router.get('/evento/:id_evento/export', exportExcelIscrittiEvento);         // Originale per chiamate dirette
router.get('/evento/:id_evento/export-excel', exportExcelIscrittiEvento);   // Per template form

// ✅ Esporta PDF
router.get('/evento/:id_evento/export-pdf', exportPdfIscrittiEvento);

export default router;