// ✅ AGGIORNAMENTO: mostraFormIscrizione con ricerca eventi
export const mostraFormIscrizione = async (req, res) => {
  try {
    console.log('🔍 Query parameters ricevuti:', req.query);
    
    // ✅ COSTRUISCI QUERY PER RICERCA EVENTI
    let eventiEndpoint = '/evento/ricerca';
    const searchParams = new URLSearchParams();
    
    // Aggiungi parametri di ricerca se presenti
    if (req.query.titolo) {
      searchParams.append('titolo', req.query.titolo);
    }
    if (req.query.categoria) {
      searchParams.append('categoria', req.query.categoria);
    }
    if (req.query.data_inizio) {
      searchParams.append('data_inizio', req.query.data_inizio);
    }
    if (req.query.data_fine) {
      searchParams.append('data_fine', req.query.data_fine);
    }
    
    // Se ci sono parametri di ricerca, aggiungili all'endpoint
    if (searchParams.toString()) {
      eventiEndpoint += '?' + searchParams.toString();
      console.log('📡 Chiamata backend eventi con filtri:', eventiEndpoint);
    }
    
    // ✅ CHIAMATE PARALLELE per prestazioni migliori
    const [eventiRes, tipologicheRes] = await Promise.all([
      apiFetch(eventiEndpoint),
      apiFetch('/tipologiche/ricerca') // Per il filtro categoria
    ]);
    
    if (!eventiRes.ok) {
      throw new Error(`Errore caricamento eventi: ${eventiRes.status}`);
    }
    
    const eventi = await eventiRes.json();
    const tipologiche = tipologicheRes.ok ? await tipologicheRes.json() : [];
    
    console.log('✅ Eventi caricati:', eventi.length);
    console.log('✅ Tipologiche caricate:', tipologiche.length);
    
    // ✅ GESTIONE EVENTO SELEZIONATO
    const idEventoSelezionato = req.query.id_evento || null;
    const eventoSelezionato = idEventoSelezionato
      ? eventi.find(e => e.id_evento == idEventoSelezionato)
      : null;

    // ✅ GESTIONE CLIENTI (se presenti nei query params)
    const clienti = req.query.clienti 
      ? JSON.parse(decodeURIComponent(req.query.clienti)) 
      : null;

    // ✅ RENDER CON TUTTI I DATI
    res.render('iscrizione', {
      eventi,
      tipologiche, // ✅ AGGIUNTO per il filtro categoria
      eventoSelezionato,
      clienti,
      erroreEvento: req.query.erroreEvento || null,
      successo: req.query.successo || null,
      req // Per mantenere i valori nei form
    });
    
  } catch (err) {
    console.error('❌ Errore mostra form iscrizione:', err);
    res.status(500).render('iscrizione', {
      eventi: [],
      tipologiche: [],
      eventoSelezionato: null,
      clienti: null,
      erroreEvento: `Errore caricamento dati: ${err.message}`,
      successo: null,
      req
    });
  }
};