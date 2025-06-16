import { apiFetch } from '../utils/apiFetch.js';

// 🔽 Mostra il form per creare un nuovo evento
export const mostraFormNuovoEvento = async (req, res) => {
  try {
    // ✅ CORRETTO: usa lo stesso endpoint che funziona per tipologiche
    const response = await apiFetch('/tipologiche/ricerca');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const tipologiche = await response.json();
    console.log('✅ Tipologiche caricate per nuovo evento:', tipologiche.length);

    res.render('eventi_nuovo', {
      errore: null,
      successo: null,
      tipologiche
    });
  } catch (err) {
    console.error("❌ Errore nel caricamento delle tipologiche:", err);
    res.render('eventi_nuovo', {
      errore: "Errore nel recupero delle categorie.",
      successo: null,
      tipologiche: []
    });
  }
};

export const salvaNuovoEvento = async (req, res) => {
  try {
    // ✅ CORRETTO: endpoint eventi (assumendo che il backend usi /eventi)
    const response = await apiFetch('/evento/nuovo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titolo: req.body.titolo,
        categoria: req.body.categoria,
        data_inizio: req.body.data_inizio,
        data_fine: req.body.data_fine,
        orario_inizio: req.body.orario_inizio,
        orario_fine: req.body.orario_fine,
        luogo: req.body.luogo,
        note: req.body.note,
        prezzo: req.body.prezzo
      })
    });

    // Recupera sempre le tipologiche per ri-renderizzare la pagina
    const tipologicheRes = await apiFetch('/tipologiche/ricerca');
    const tipologiche = await tipologicheRes.json();

    if (response.ok) {
      res.render('eventi_nuovo', {
        successo: 'Evento salvato con successo!',
        errore: null,
        tipologiche
      });
    } else {
      const errorData = await response.json();
      res.render('eventi_nuovo', {
        errore: errorData.errore || 'Errore nel salvataggio dell\'evento.',
        successo: null,
        tipologiche
      });
    }
  } catch (err) {
    console.error('❌ Errore salvataggio evento:', err);
    
    // Carica tipologiche anche in caso di errore
    try {
      const tipologicheRes = await apiFetch('/tipologiche/ricerca');
      const tipologiche = await tipologicheRes.json();
      
      res.render('eventi_nuovo', {
        errore: 'Errore nella comunicazione con il server',
        successo: null,
        tipologiche
      });
    } catch {
      res.render('eventi_nuovo', {
        errore: 'Errore nella comunicazione con il server',
        successo: null,
        tipologiche: []
      });
    }
  }
};

// ✅ Mostra la pagina di ricerca evento (semplificata per il debugging)
export const mostraFormRicercaEvento = async (req, res) => {
  try {
    const response = await apiFetch('/tipologiche/ricerca');
    const tipologiche = await response.json();

    res.render('eventi_ricerca', { 
      errore: null, 
      successo: null, 
      eventi: null,
      req: req,
      tipologiche
    });
  } catch (err) {
    console.error("❌ Errore nel caricamento delle tipologiche:", err);
    res.render('eventi_ricerca', { 
      errore: "Errore nel caricamento delle categorie", 
      successo: null, 
      eventi: null,
      req: req,
      tipologiche: []
    });
  }
};

// ✅ Esegue la ricerca evento e mostra i risultati
export const eseguiRicercaEvento = async (req, res) => {
  try {
    const query = new URLSearchParams(req.query).toString();
    console.log('🔍 Ricerca eventi con query:', query);

    // Chiamate parallele a eventi e tipologiche
    const [eventiRes, tipologicheRes] = await Promise.all([
      apiFetch(`/evento/ricerca?${query}`),
      apiFetch('/tipologiche/ricerca')
    ]);

    if (!eventiRes.ok || !tipologicheRes.ok) {
      throw new Error('Errore nel recupero dati');
    }

    const eventi = await eventiRes.json();
    const tipologiche = await tipologicheRes.json();

    console.log('✅ Eventi trovati:', eventi.length);

    res.render('eventi_ricerca', {
      errore: null,
      successo: req.query.successo || (eventi.length > 0 
        ? `Trovati ${eventi.length} eventi` 
        : 'Nessun evento trovato'),

      eventi,
      tipologiche,
      req
    });
  } catch (err) {
    console.error("❌ Errore nella ricerca eventi:", err);
    res.render('eventi_ricerca', {
      errore: 'Errore durante la ricerca evento',
      successo: null,
      eventi: [],
      tipologiche: [],
      req
    });
  }
};

// ✅ Mostra form di modifica evento
export const mostraFormModificaEvento = async (req, res) => {
  const { id } = req.params;

  try {
    console.log('📝 Caricamento evento per modifica, ID:', id);
    
    // Carica evento E tipologiche
    const [eventoRes, tipologicheRes] = await Promise.all([
      apiFetch(`/evento/${id}`),
      apiFetch('/tipologiche/ricerca')
    ]);

    if (!eventoRes.ok) {
      throw new Error(`Evento non trovato: ${eventoRes.status}`);
    }

    const evento = await eventoRes.json();
    const tipologiche = await tipologicheRes.json();

    // ✅ Formatta le date per l'input HTML
    if (evento.data_inizio) {
      evento.data_inizio = new Date(evento.data_inizio).toISOString().split('T')[0];
    }
    if (evento.data_fine) {
      evento.data_fine = new Date(evento.data_fine).toISOString().split('T')[0];
    }

    console.log('✅ Evento e tipologiche caricati per modifica');
    res.render('eventi_modifica', { 
      evento, 
      tipologiche,
      errore: null,
      successo: req.query.successo || null
    });
  } catch (err) {
    console.error("❌ Errore caricamento evento:", err);
    res.status(500).send(`Errore nel caricamento dell'evento: ${err.message}`);
  }
};

// ✅ Salva le modifiche evento
export const salvaModificaEvento = async (req, res) => {
  const { id } = req.params;

  try {
    console.log('💾 Salvataggio modifica evento ID:', id, 'Dati:', req.body);
    
    // ✅ CORRETTO: endpoint per modifica eventi
    const response = await apiFetch(`/evento/${id}/modifica`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titolo: req.body.titolo,
        categoria: req.body.categoria,
        data_inizio: req.body.data_inizio,
        data_fine: req.body.data_fine,
        orario_inizio: req.body.orario_inizio,
        orario_fine: req.body.orario_fine,
        luogo: req.body.luogo,
        note: req.body.note,
        prezzo: req.body.prezzo
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Errore backend: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Evento modificato con successo:', result);
    
    res.redirect(`/eventi/${id}/modifica?successo=Evento modificato con successo`);

  } catch (err) {
    console.error("❌ Errore durante la modifica:", err);
    res.status(500).send(`Errore nel salvataggio delle modifiche: ${err.message}`);
  }
};

// ✅ NUOVO: Elimina un evento
export const eliminaEvento = async (req, res) => {
  const { id } = req.params;
  try {
    console.log('🗑️ Eliminazione evento ID:', id);
    
    // ✅ Chiamata DELETE al backend
    const response = await apiFetch(`/evento/${id}/elimina`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Errore eliminazione backend:', response.status, errorText);
      throw new Error(`Errore backend: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Evento eliminato con successo:', result);
    
    // ✅ Redirect alla ricerca con messaggio di successo
    res.redirect('/eventi/ricerca?successo=Evento eliminato con successo');
  } catch (err) {
    console.error('❌ Errore eliminazione:', err);
    res.redirect('/eventi/ricerca?errore=' + encodeURIComponent(`Errore nell'eliminazione: ${err.message}`));
  }
};