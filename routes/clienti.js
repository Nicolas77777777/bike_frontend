import express from 'express';
import {
  showFormNuovo,
  salvaNuovoCliente,
  showFormRicerca,
  eseguiRicerca,
  mostraListaCompleta,    // ✅ NUOVO: Lista completa
  mostraStatistiche,      // ✅ NUOVO: Statistiche
  mostraModifica,
  salvaModifica,
  eliminaCliente

} from '../controllers/clientiController.js';

const router = express.Router();

// Route per nuovo cliente
router.get('/nuovo', showFormNuovo);
router.post('/nuovo', salvaNuovoCliente);

// Route per ricerca clienti
router.get('/form', showFormRicerca);        // Mostra il form di ricerca
router.get('/ricerca', eseguiRicerca);       // Esegue la ricerca
router.get('/risultati', eseguiRicerca);     // Per compatibilità

// ✅ NUOVO: Route per lista completa clienti
router.get('/lista', mostraListaCompleta);

// ✅ NUOVO: Route per statistiche clienti
router.get('/statistiche', mostraStatistiche);

// Route per modifica cliente
router.get('/:id/modifica', mostraModifica);
router.post('/:id/modifica', salvaModifica);

// Route per eliminazione
router.get('/elimina/:id', eliminaCliente);

export default router;
