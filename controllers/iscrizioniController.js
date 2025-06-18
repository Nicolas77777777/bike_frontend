// ✅ CONTROLLER AGGIORNATO per gestire entrambi i sistemi
export const mostraFormIscrizione = async (req, res) => {
  try {
    console.log('🔍 Query parameters ricevuti:', req.query);
    
    // ✅ COSTRUISCI QUERY PER RICERCA EVENTI
    let eventiEndpoint = '/evento/ricerca';
    const searchParams = new URLSearchParams();
    
    // ✅ PRIMO SISTEMA: Ricerca con filtri
    let isRicercaFiltrata = false;
    if (req.query.titolo) {
      searchParams.append('titolo', req.query.titolo);
      isRicercaFiltrata = true;
    }
    if (req.query.categoria) {
      searchParams.append('categoria', req.query.categoria);
      isRicercaFiltrata = true;
    }
    if (req.query.data_inizio) {
      searchParams.append('data_inizio', req.query.data_inizio);
      isRicercaFiltrata = true;
    }
    if (req.query.data_fine) {
      searchParams.append('data_fine', req.query.data_fine);
      isRicercaFiltrata = true;
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
    
    let eventi = await eventiRes.json();
    const tipologiche = tipologicheRes.ok ? await tipologicheRes.json() : [];
    
    // ✅ Se non è una ricerca filtrata, carica TUTTI gli eventi per il menu a tendina
    if (!isRicercaFiltrata) {
      try {
        const tuttiEventiRes = await apiFetch('/evento/ricerca');
        if (tuttiEventiRes.ok) {
          eventi = await tuttiEventiRes.json();
        }
      } catch (err) {
        console.log('⚠️ Errore caricamento tutti gli eventi, uso quelli esistenti');
      }
    }
    
    console.log('✅ Eventi caricati:', eventi.length);
    console.log('✅ Tipologiche caricate:', tipologiche.length);
    
    // ✅ GESTIONE EVENTO SELEZIONATO
    const idEventoSelezionato = req.query.id_evento || null;
    let eventoSelezionato = null;
    
    if (idEventoSelezionato) {
      // Prima cerca negli eventi già caricati
      eventoSelezionato = eventi.find(e => e.id_evento == idEventoSelezionato);
      
      // Se non trovato, carica singolarmente dal backend
      if (!eventoSelezionato) {
        try {
          const eventoRes = await apiFetch(`/evento/${idEventoSelezionato}`);
          if (eventoRes.ok) {
            eventoSelezionato = await eventoRes.json();
          }
        } catch (err) {
          console.log('⚠️ Errore caricamento evento singolo:', err.message);
        }
      }
    }

    // ✅ GESTIONE CLIENTI (se presenti nei query params)
    const clienti = req.query.clienti 
      ? JSON.parse(decodeURIComponent(req.query.clienti)) 
      : null;

    // ✅ RENDER CON TUTTI I DATI
    res.render('iscrizione', {
      eventi,
      tipologiche,
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

// ✅ MANTIENI tutte le altre funzioni esistenti...
export const selezionaEvento = (req, res) => {
  const { id_evento } = req.body;
  res.redirect(`/iscrizioni?id_evento=${id_evento}`);
};

// ... resto del controller rimane uguale