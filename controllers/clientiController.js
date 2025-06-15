import { apiFetch } from '../utils/apiFetch.js';

export const showFormNuovo = (req, res) => {
  res.render('clienti_nuovo', { errore: null, successo: null });
};

export const salvaNuovoCliente = async (req, res) => {
  try {
    const response = await apiFetch('/cliente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    if (response.ok) {
      res.render('clienti_nuovo', { errore: null, successo: 'Cliente salvato con successo!' });
    } else {
      const errorText = await response.text();
      console.error('❌ Errore salvataggio:', errorText);
      res.render('clienti_nuovo', { errore: 'Errore nel salvataggio del cliente.', successo: null });
    }
  } catch (err) {
    console.error('Errore nella richiesta fetch:', err);
    res.render('clienti_nuovo', { errore: 'Errore durante il salvataggio', successo: null });
  }
};

export const showFormRicerca = (req, res) => {
  const modalitaEliminazione = req.query.elimina === 'true';
  
  res.render('cliente_ricerca', { 
    errore: req.query.errore || null, 
    successo: req.query.successo || null,
    clienti: null,
    modalitaEliminazione
  });
};

export const eseguiRicerca = async (req, res) => {
  try {
    console.log('🔍 Parametri ricerca ricevuti:', req.query);
    
    const modalitaEliminazione = req.query.elimina === 'true';
    
    const searchParams = { ...req.query };
    delete searchParams.elimina;
    
    const queryString = new URLSearchParams(searchParams).toString();
    console.log('🔗 Query string generata:', queryString);
    
    const endpoint = `/cliente/ricerca?${queryString}`;
    console.log('📡 Chiamata backend:', endpoint);
    
    const response = await apiFetch(endpoint);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Errore backend response:', response.status, errorText);
      throw new Error(`Errore backend: ${response.status} - ${errorText}`);
    }

    const clienti = await response.json();
    console.log('✅ Risultati ricevuti:', clienti.length, 'clienti trovati');
    
    res.render('risultati_ricerca', { 
      clienti,
      errore: null,
      successo: clienti.length > 0 ? `Trovati ${clienti.length} clienti` : 'Nessun cliente trovato',
      modalitaEliminazione
    });
  } catch (err) {
    console.error("❌ Errore completo nella ricerca cliente:", err);
    
    const modalitaEliminazione = req.query.elimina === 'true';
    
    res.render('risultati_ricerca', { 
      clienti: [],
      errore: `Errore durante la ricerca: ${err.message}`,
      successo: null,
      modalitaEliminazione
    });
  }
};

// ✅ NUOVA FUNZIONE: Mostra lista completa clienti
export const mostraListaCompleta = async (req, res) => {
  try {
    console.log('📋 Caricamento lista completa clienti');
    console.log('🔍 Parametri query ricevuti:', req.query);
    
    // Gestione parametri per ordinamento e filtri
    const {
      orderBy = 'cognome_rag_soc',
      order = 'ASC',
      attivi_solo = 'false',
      page = '1'
    } = req.query;
    
    // Paginazione
    const itemsPerPage = 20;
    const currentPage = parseInt(page) || 1;
    const offset = (currentPage - 1) * itemsPerPage;
    
    // Costruisce l'URL per il backend
    const queryParams = new URLSearchParams({
      orderBy,
      order,
      attivi_solo,
      limit: itemsPerPage.toString(),
      offset: offset.toString()
    });
    
    const endpoint = `/cliente/lista?${queryParams}`;
    console.log('📡 Chiamata backend lista:', endpoint);
    
    const response = await apiFetch(endpoint);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Errore backend lista:', response.status, errorText);
      throw new Error(`Errore backend: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Lista ricevuta:', data.totale, 'clienti trovati');
    
    // Calcola info paginazione
    const totalPages = Math.ceil(data.totale / itemsPerPage);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;
    
    res.render('lista_clienti', {
      clienti: data.clienti,
      totale: data.totale,
      parametri: data.parametri,
      timestamp: data.timestamp,
      paginazione: {
        currentPage,
        totalPages,
        itemsPerPage,
        hasNextPage,
        hasPrevPage,
        startItem: offset + 1,
        endItem: Math.min(offset + itemsPerPage, data.totale)
      },
      filtri: {
        orderBy,
        order,
        attivi_solo: attivi_solo === 'true'
      },
      errore: null,
      successo: null
    });
    
  } catch (err) {
    console.error('❌ Errore caricamento lista clienti:', err);
    res.render('lista_clienti', {
      clienti: [],
      totale: 0,
      parametri: null,
      timestamp: null,
      paginazione: null,
      filtri: null,
      errore: `Errore durante il caricamento della lista: ${err.message}`,
      successo: null
    });
  }
};

// ✅ NUOVA FUNZIONE: Mostra statistiche clienti
export const mostraStatistiche = async (req, res) => {
  try {
    console.log('📊 Caricamento statistiche clienti');
    
    const response = await apiFetch('/cliente/statistiche');
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Errore backend statistiche:', response.status, errorText);
      throw new Error(`Errore backend: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Statistiche ricevute:', data.statistiche);
    
    res.render('dashboard_statistiche', {
      statistiche: data.statistiche,
      timestamp: data.timestamp,
      errore: null,
      successo: null
    });
    
  } catch (err) {
    console.error('❌ Errore caricamento statistiche:', err);
    res.render('dashboard_statistiche', {
      statistiche: null,
      timestamp: null,
      errore: `Errore durante il caricamento delle statistiche: ${err.message}`,
      successo: null
    });
  }
};

// ✅ NUOVA FUNZIONE: Dashboard con overview (per la home migliorata) - VERSIONE SICURA
export const mostraDashboardOverview = async (req, res) => {
  try {
    console.log('🏠 Caricamento dashboard overview');
    
    // Inizializza variabili con valori di default
    let statistiche = null;
    let ultimiClienti = [];
    
    try {
      // Prova a caricare statistiche di base per la home
      console.log('📊 Tentativo caricamento statistiche...');
      const statsResponse = await apiFetch('/cliente/statistiche');
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        statistiche = statsData.statistiche;
        console.log('✅ Statistiche caricate:', statistiche);
      } else {
        console.log('⚠️ Statistiche non disponibili:', statsResponse.status);
      }
    } catch (statsError) {
      console.log('⚠️ Errore caricamento statistiche (ignorato):', statsError.message);
    }
    
    try {
      // Prova a caricare ultimi clienti iscritti
      console.log('👥 Tentativo caricamento ultimi clienti...');
      const clientiResponse = await apiFetch('/cliente/lista?orderBy=data_iscrizione&order=DESC&limit=5');
      
      if (clientiResponse.ok) {
        const clientiData = await clientiResponse.json();
        ultimiClienti = clientiData.clienti || [];
        console.log('✅ Ultimi clienti caricati:', ultimiClienti.length);
      } else {
        console.log('⚠️ Ultimi clienti non disponibili:', clientiResponse.status);
      }
    } catch (clientiError) {
      console.log('⚠️ Errore caricamento ultimi clienti (ignorato):', clientiError.message);
    }
    
    // Render della home con dati disponibili (anche se nulli)
    res.render('home', {
      statistiche: statistiche,
      ultimiClienti: ultimiClienti,
      errore: null,
      successo: req.query.successo || null
    });
    
  } catch (err) {
    console.error('❌ Errore grave caricamento dashboard overview:', err);
    
    // Fallback: render home senza dati aggiuntivi
    res.render('home', {
      statistiche: null,
      ultimiClienti: [],
      errore: null,
      successo: req.query.successo || null
    });
  }
};

export const mostraModifica = async (req, res) => {
  const { id } = req.params;
  try {
    console.log('🔧 Caricamento cliente per modifica, ID:', id);
    
    const response = await apiFetch(`/cliente/${id}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Cliente non trovato:', response.status, errorText);
      throw new Error(`Cliente non trovato: ${response.status}`);
    }
    
    const cliente = await response.json();
    console.log('✅ Cliente caricato:', cliente);
    
    res.render('cliente_modifica', { cliente });
  } catch (err) {
    console.error("❌ Errore caricamento cliente:", err);
    res.status(500).send(`Errore nel caricamento del cliente: ${err.message}`);
  }
};

export const salvaModifica = async (req, res) => {
  const { id } = req.params;
  try {
    console.log('💾 Salvataggio modifica cliente ID:', id, 'Dati:', req.body);
    
    const response = await apiFetch(`/cliente/${id}/modifica`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Errore salvataggio backend:', response.status, errorText);
      throw new Error(`Errore backend: ${response.status} - ${errorText}`);
    }
    
    console.log('✅ Cliente modificato con successo');
    res.redirect('/clienti/form?successo=Cliente modificato con successo');
  } catch (err) {
    console.error("❌ Errore durante il salvataggio delle modifiche:", err);
    res.status(500).send(`Errore nel salvataggio: ${err.message}`);
  }
};

export async function eliminaCliente(req, res) {
  const { id } = req.params;

  try {
    console.log('🗑️ Eliminazione cliente ID:', id);
    
    const response = await apiFetch(`/cliente/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Cliente eliminato con successo:', result.messaggio);
      
      res.redirect('/clienti/form?elimina=true&successo=Cliente eliminato con successo (incluse tutte le iscrizioni agli eventi)');
    } else {
      let errorMessage = 'Errore durante l\'eliminazione del cliente';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.errore || errorData.messaggio || errorMessage;
      } catch {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      
      console.error("❌ Errore eliminazione:", response.status, errorMessage);
      
      if (response.status === 404) {
        res.redirect('/clienti/form?elimina=true&errore=Cliente non trovato');
      } else if (response.status === 400 || response.status === 409) {
        res.redirect('/clienti/form?elimina=true&errore=Impossibile eliminare: cliente associato a vincoli nel database');
      } else {
        res.redirect(`/clienti/form?elimina=true&errore=${encodeURIComponent(errorMessage)}`);
      }
    }
  } catch (err) {
    console.error("❌ Errore connessione:", err);
    res.redirect('/clienti/form?elimina=true&errore=Errore di connessione al server');
  }
}