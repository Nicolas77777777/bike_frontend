import { apiFetch } from '../utils/apiFetch.js';

// 🔽 Mostra il form di inserimento
export const mostraFormInserimento = (req, res) => {
  res.render('tipologiche_nuovo', { errore: null, successo: null });
};

// 🔽 Salva la nuova tipologica inviando i dati al backend
export const salvaNuovaTipologica = async (req, res) => {
  try {
    console.log('📝 Salvataggio nuova tipologica:', req.body);
    
    const response = await apiFetch('/tipologiche/nuovo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Tipologica salvata:', result);
      res.render('tipologiche_nuovo', { errore: null, successo: 'Tipologica salvata con successo!' });
    } else {
      const errorText = await response.text();
      console.error('❌ Errore salvataggio tipologica:', response.status, errorText);
      res.render('tipologiche_nuovo', { errore: `Errore nel salvataggio: ${response.status}`, successo: null });
    }
  } catch (err) {
    console.error('❌ Errore:', err);
    res.render('tipologiche_nuovo', { errore: `Errore server: ${err.message}`, successo: null });
  }
};

export const mostraFormRicerca = (req, res) => {
  res.render('tipologiche_ricerca', {
    errore: null,
    successo: null,
    tipologiche: null,
    req: req // ✅ Passa req per gestire i messaggi URL
  });
};

// ✅ Controller frontend per ricerca tipologiche
export const ricercaTipologiche = async (req, res) => {
  try {
    console.log('🔍 Parametri ricerca tipologiche ricevuti:', req.query);
    
    const query = new URLSearchParams(req.query).toString();
    console.log('🔗 Query string generata:', query);

    // ✅ Endpoint backend corretto
    const endpoint = `/tipologiche/ricerca?${query}`;
    console.log('📡 Chiamata backend:', endpoint);

    const response = await apiFetch(endpoint);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Errore backend response:', response.status, errorText);
      throw new Error(`Errore backend: ${response.status} - ${errorText}`);
    }

    const tipologiche = await response.json();
    console.log('✅ Risultati ricevuti:', tipologiche.length, 'tipologiche trovate');

    // ✅ Usa la stessa pagina di ricerca per mostrare i risultati
    res.render('tipologiche_ricerca', {
      errore: null,
      successo: tipologiche.length > 0 
        ? `Trovate ${tipologiche.length} tipologiche` 
        : 'Nessuna tipologica trovata',
      tipologiche,
      req: req // ✅ Passa req per gestire i messaggi URL
    });
  } catch (err) {
    console.error('❌ Errore completo ricerca tipologiche:', err);
    res.render('tipologiche_ricerca', {
      errore: `Errore durante la ricerca: ${err.message}`,
      successo: null,
      tipologiche: [],
      req: req // ✅ Passa req per gestire i messaggi URL
    });
  }
};

// 🔽 Mostra il form per modificare una tipologica
export const mostraFormModifica = async (req, res) => {
  const { id } = req.params;
  try {
    console.log('🔧 Caricamento tipologica per modifica, ID:', id);
    
    const response = await apiFetch(`/tipologiche/${id}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Tipologica non trovata:', response.status, errorText);
      throw new Error(`Tipologica non trovata: ${response.status}`);
    }
    
    const tipologica = await response.json();
    console.log('✅ Tipologica caricata:', tipologica);

    res.render('tipologiche_modifica', { tipologica });
  } catch (err) {
    console.error('❌ Errore caricamento modifica:', err);
    res.status(500).send(`Errore nel caricamento della tipologica: ${err.message}`);
  }
};

// 🔽 Salva la modifica della tipologica
export const salvaModificaTipologica = async (req, res) => {
  const { id } = req.params;
  try {
    console.log('💾 Salvataggio modifica tipologica ID:', id, 'Dati:', req.body);
    
    const response = await apiFetch(`/tipologiche/${id}/modifica`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Errore salvataggio backend:', response.status, errorText);
      throw new Error(`Errore backend: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Tipologica modificata con successo:', result);
    res.redirect('/tipologiche/ricerca?successo=Tipologica modificata con successo');
  } catch (err) {
    console.error('❌ Errore salvataggio modifica:', err);
    res.status(500).send(`Errore nella modifica: ${err.message}`);
  }
};

// 🔽 ✅ NUOVO: Elimina una tipologica
export const eliminaTipologica = async (req, res) => {
  const { id } = req.params;
  try {
    console.log('🗑️ Eliminazione tipologica ID:', id);
    
    // ✅ Chiamata DELETE al backend
    const response = await apiFetch(`/tipologiche/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Errore eliminazione backend:', response.status, errorText);
      throw new Error(`Errore backend: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Tipologica eliminata con successo:', result);
    
    // ✅ Redirect alla ricerca con messaggio di successo
    res.redirect('/tipologiche/ricerca?successo=Tipologica eliminata con successo');
  } catch (err) {
    console.error('❌ Errore eliminazione:', err);
    res.redirect('/tipologiche/ricerca?errore=' + encodeURIComponent(`Errore nell'eliminazione: ${err.message}`));
  }
};