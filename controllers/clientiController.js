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
  res.render('cliente_ricerca', { errore: null, successo: null, clienti: null });
};

export const eseguiRicerca = async (req, res) => {
  try {
    const queryString = new URLSearchParams(req.query).toString();
    const response = await apiFetch(`/cliente/ricerca?${queryString}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Errore backend: ${response.status} - ${errorText}`);
    }

    const clienti = await response.json();
    res.render('risultati_ricerca', {
      clienti,
      errore: null,
      successo: clienti.length > 0 ? `Trovati ${clienti.length} clienti` : 'Nessun cliente trovato'
    });
  } catch (err) {
    console.error("❌ Errore ricerca cliente:", err);
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
    const response = await apiFetch(`/cliente/${id}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cliente non trovato: ${response.status}`);
    }

    const cliente = await response.json();
    res.render('cliente_modifica', { cliente });
  } catch (err) {
    console.error("❌ Errore caricamento cliente:", err);
    res.status(500).send(`Errore nel caricamento del cliente: ${err.message}`);
  }
};

export const salvaModifica = async (req, res) => {
  const { id } = req.params;
  try {
    const response = await apiFetch(`/cliente/${id}/modifica`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Errore backend: ${response.status} - ${errorText}`);
    }

    res.redirect('/clienti/form?successo=Cliente modificato con successo');
  } catch (err) {
    console.error("❌ Errore salvataggio modifiche:", err);
    res.status(500).send(`Errore nel salvataggio: ${err.message}`);
  }
};

export async function eliminaCliente(req, res) {
  const { id } = req.params;

  try {
    const response = await apiFetch(`/clienti/${id}`, {
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
