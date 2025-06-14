import express from 'express';
import {
  mostraFormNuovoEvento,
  salvaNuovoEvento,
  mostraFormRicercaEvento,
  eseguiRicercaEvento,
  mostraFormModificaEvento,
  salvaModificaEvento,
  eliminaEvento  // ✅ AGGIUNTO: import eliminazione
} from '../controllers/eventiController.js';

const router = express.Router();

// ✅ Form nuovo evento
router.get('/nuovo', mostraFormNuovoEvento);
router.post('/nuovo', salvaNuovoEvento);

// ✅ CORRETTA: Ricerca eventi - stessa logica delle tipologiche
router.get('/ricerca', (req, res) => {
  // Se ci sono parametri di ricerca, esegui la ricerca
  if (Object.keys(req.query).length > 0 && (req.query.titolo || req.query.categoria || req.query.luogo)) {
    eseguiRicercaEvento(req, res);
  } else {
    // Altrimenti mostra il form vuoto
    mostraFormRicercaEvento(req, res);
  }
});

// ✅ Modifica evento
router.get('/:id/modifica', mostraFormModificaEvento);
router.post('/:id/modifica', salvaModificaEvento);

// ✅ Eliminazione evento
router.post('/:id/elimina', eliminaEvento);

export default router;