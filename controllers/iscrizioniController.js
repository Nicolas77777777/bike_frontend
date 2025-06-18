import { apiFetch } from '../utils/apiFetch.js';

export async function esportaIscrittiEvento(req, res) {
  const { id_evento } = req.params;

  try {
    // Recupera evento e iscritti
    const [eventoRes, iscrittiRes] = await Promise.all([
      pool.query('SELECT * FROM evento WHERE id_evento = $1', [id_evento]),
      pool.query(
        `SELECT c.*
         FROM cliente_evento ce
         JOIN cliente c ON ce.id_cliente = c.id_cliente
         WHERE ce.id_evento = $1`,
        [id_evento]
      )
    ]);

    const evento = eventoRes.rows[0];
    const iscritti = iscrittiRes.rows;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Iscritti Evento');

    // Dati evento
    sheet.addRow(['Evento:', evento.titolo]);
    sheet.addRow(['Data:', evento.data_inizio?.toISOString().split('T')[0]]);
    sheet.addRow(['Luogo:', evento.luogo]);
    sheet.addRow([]); // Riga vuota

    // Intestazioni
    sheet.addRow(['Nome', 'Cognome/Rag. Soc.', 'Email', 'Cellulare', 'Cod. Fiscale / P.IVA']);

    // Dati iscritti
    iscritti.forEach(cliente => {
      sheet.addRow([
        cliente.nome,
        cliente.cognome_rag_soc,
        cliente.email,
        cliente.cellulare,
        cliente.cf_piva
      ]);
    });

    // Imposta header per download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="iscritti_evento_${id_evento}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("❌ Errore generazione Excel:", err);
    res.status(500).send("Errore generazione file Excel");
  }
}

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

// ✅ Reindirizza alla pagina con evento selezionato
export const selezionaEvento = (req, res) => {
  const { id_evento } = req.body;
  res.redirect(`/iscrizioni?id_evento=${id_evento}`);
};

// ✅ Esegue la ricerca dei clienti e li invia tramite query (stateless)
export const ricercaClienti = async (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  try {
    const clientiRes = await apiFetch(`/cliente/ricerca?${query}`);
    const clienti = await clientiRes.json();

    const redirectUrl = `/iscrizioni?id_evento=${req.query.id_evento}&clienti=${encodeURIComponent(JSON.stringify(clienti))}`;
    res.redirect(redirectUrl);

  } catch (err) {
    console.error('❌ Errore ricerca clienti:', err);
    res.redirect('/iscrizioni?erroreEvento=Errore nella ricerca clienti');
  }
};

export const salvaIscrizione = async (req, res) => {
  try {
    const response = await apiFetch('/iscrizioni/iscrivi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_cliente: req.body.id_cliente,
        id_evento: req.body.id_evento
      })
    });

    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();

      if (response.status === 201) {
        // ✅ Redirect alla pagina degli iscritti all'evento
        return res.redirect(`/iscrizioni/evento/${req.body.id_evento}/iscritti?successo=` + encodeURIComponent(data.messaggio));
      } else if (response.status === 409) {
        return res.redirect('/iscrizioni?erroreEvento=' + encodeURIComponent(data.messaggio));
      } else {
        return res.redirect('/iscrizioni?erroreEvento=' + encodeURIComponent(data.errore || 'Errore generico'));
      }
    } else {
      // 🔴 Risposta non JSON: stampa e mostra testo
      const text = await response.text();
      console.error('📄 Risposta non-JSON dal backend:', text);
      return res.redirect('/iscrizioni?erroreEvento=' + encodeURIComponent('Risposta non valida dal server'));
    }
  } catch (err) {
    console.error('❌ Errore salva iscrizione:', err);
    res.redirect('/iscrizioni?erroreEvento=Errore comunicazione server');
  }
};

export const mostraIscrittiEvento = async (req, res) => {
  const { id_evento } = req.params;

  try {
    const [eventoRes, iscrittiRes] = await Promise.all([
      apiFetch(`/evento/${id_evento}`),
      apiFetch(`/iscrizioni/evento/${id_evento}/clienti`)
    ]);

    const evento = await eventoRes.json();
    const iscritti = await iscrittiRes.json();

    res.render('risultati_iscritti_eventi', {
      evento,
      iscritti,
      successo: req.query.successo || null, // ✅ questo risolve l'errore
      errore: req.query.errore || null      // opzionale, utile in caso di errori
    });
  } catch (err) {
    console.error("❌ Errore caricamento iscritti evento:", err);
    res.status(500).send("Errore caricamento dati evento/iscritti");
  }
};

// ✅ Controller frontend per export Excel
export const exportExcelIscrittiEvento = async (req, res) => {
  const { id_evento } = req.params;

  try {
    const response = await apiFetch(`/iscrizioni/evento/${id_evento}/export`);

    if (!response.ok) {
      throw new Error('Errore nel download del file Excel');
    }

    const data = await response.json();

    // 🔁 Reindirizza direttamente al file sul backend
    res.redirect(`http://localhost:3000${data.path}`);
  } catch (err) {
    console.error('❌ Errore export Excel frontend:', err);
    res.status(500).send('Errore durante il download del file Excel');
  }
};

// ✅ Esporta in PDF gli iscritti a un evento
export const exportPdfIscrittiEvento = async (req, res) => {
  const { id_evento } = req.params;

  try {
    const response = await apiFetch(`/iscrizioni/evento/${id_evento}/export-pdf`);
    
    if (!response.ok) {
      throw new Error(`Errore download: ${response.status}`);
    }

    // Imposta header per forzare il download
    res.setHeader('Content-Disposition', `attachment; filename="iscritti_evento_${id_evento}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');

    // Piping dello stream PDF al client
    response.body.pipe(res);
  } catch (err) {
    console.error('❌ Errore download PDF:', err);
    res.status(500).send('Errore durante il download del file PDF');
  }
};