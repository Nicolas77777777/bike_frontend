// ✅ Importo express per creare il router
import express from 'express';

// ✅ Importo i controller delle tipologiche
import {
  mostraFormInserimento,
  salvaNuovaTipologica,
  mostraFormRicerca,
  ricercaTipologiche,
  mostraFormModifica,
  salvaModificaTipologica,
  eliminaTipologica  // ✅ AGGIUNTO: Controller per eliminazione
} from '../controllers/tipologicheController.js';

const router = express.Router();

// 🔽 Mostra il form per inserire una nuova tipologica
router.get('/nuovo', mostraFormInserimento);

// 🔽 Salva una nuova tipologica (chiamata POST dal form)
router.post('/nuovo', salvaNuovaTipologica);

// 🔽 CORRETTO: Gestisce sia il form che la ricerca sullo stesso endpoint
router.get('/ricerca', (req, res) => {
  // Se ci sono parametri di ricerca, esegui la ricerca
  if (Object.keys(req.query).length > 0 && req.query.descrizione) {
    ricercaTipologiche(req, res);
  } else {
    // Altrimenti mostra il form vuoto
    mostraFormRicerca(req, res);
  }
});

// 🔽 Mostra il form per modificare una tipologica
router.get('/:id/modifica', mostraFormModifica);

// 🔽 Salva la modifica della tipologica
router.post('/:id/modifica', salvaModificaTipologica);

// 🔽 ✅ NUOVO: Elimina una tipologica
router.post('/:id/elimina', eliminaTipologica);

export default router;