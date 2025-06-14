import fetch from 'node-fetch';

export const showFormNuovo = (req, res) => {
  res.render('clienti_nuovo', { errore: null, successo: null });
};

export const salvaNuovoCliente = async (req, res) => {
  try {
    // ✅ CORRETTO: Endpoint backend giusto (singolare)
    const response = await fetch('http://localhost:3000/cliente', {
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
  res.render('cliente_ricerca', { 
    errore: null, 
    successo: null,
    clienti: null
  });
};

export const eseguiRicerca = async (req, res) => {
  try {
    console.log('🔍 Parametri ricerca ricevuti:', req.query);
    
    const queryString = new URLSearchParams(req.query).toString();
    console.log('🔗 Query string generata:', queryString);
    
    // ✅ CORRETTO: Endpoint backend giusto (singolare cliente)
    const backendUrl = `http://localhost:3000/cliente/ricerca?${queryString}`;
    console.log('📡 Chiamata backend:', backendUrl);
    
    const response = await fetch(backendUrl);
    
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
      successo: clienti.length > 0 ? `Trovati ${clienti.length} clienti` : 'Nessun cliente trovato'
    });
  } catch (err) {
    console.error("❌ Errore completo nella ricerca cliente:", err);
    res.render('risultati_ricerca', { 
      clienti: [],
      errore: `Errore durante la ricerca: ${err.message}`,
      successo: null
    });
  }
};

export const mostraModifica = async (req, res) => {
  const { id } = req.params;
  try {
    console.log('🔧 Caricamento cliente per modifica, ID:', id);
    
    // ✅ CORRETTO: Endpoint giusto (singolare)
    const response = await fetch(`http://localhost:3000/cliente/${id}`);
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
    
    // ✅ CORRETTO: Endpoint giusto (singolare)
    const response = await fetch(`http://localhost:3000/cliente/${id}/modifica`, {
      method: 'POST', // Il backend usa POST per le modifiche
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

// Elimina cliente
export async function eliminaCliente(req, res) {
  const { id } = req.params;

  try {
    const response = await fetch(`http://localhost:8080/clienti/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      res.redirect('/clienti/ricerca');
    } else {
      const testo = await response.text();
      console.error("Errore eliminazione:", testo);
      res.status(response.status).send("Errore durante l'eliminazione del cliente");
    }
  } catch (err) {
    console.error("Errore connessione:", err);
    res.status(500).send("Errore interno al server");
  }
}
