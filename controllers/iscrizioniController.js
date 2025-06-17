import { apiFetch } from '../utils/apiFetch.js';

// ⚠️ EXCEL-POOL-REFACTOR: Questa funzione usa ancora pool.query diretto
// Dovrebbe essere spostata nel backend e chiamata via API per coerenza architetturale
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

// ✅ Mostra il form principale con eventuale evento selezionato e clienti trovati
export const mostraFormIscrizione = async (req, res) => {
  try {
    const eventiRes = await apiFetch('/evento/ricerca');
    const eventi = await eventiRes.json();

    const idEventoSelezionato = req.query.id_evento || null;
    const eventoSelezionato = idEventoSelezionato
      ? eventi.find(e => e.id_evento == idEventoSelezionato)
      : null;

    const clienti = req.query.clienti ? JSON.parse(decodeURIComponent(req.query.clienti)) : null;

    res.render('iscrizione', {
      eventi,
      eventoSelezionato,
      clienti,
      erroreEvento: req.query.erroreEvento || null,
      successo: req.query.successo || null,
      req
    });
  } catch (err) {
    console.error('❌ Errore mostra form iscrizione:', err);
    res.status(500).send("Errore caricamento dati");
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

// ✅ SEMPLIFICATO: Controller frontend per export Excel - STREAM DIRETTO
export const exportExcelIscrittiEvento = async (req, res) => {
  const { id_evento } = req.params;

  try {
    console.log(`📊 Richiesta export Excel per evento ${id_evento}`);

    // ✅ CHIAMATA DIRETTA AL BACKEND CHE STREAMA IL FILE
    const response = await apiFetch(`/iscrizioni/evento/${id_evento}/export`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Errore backend (${response.status}):`, errorText);
      throw new Error(`Errore nel backend: ${response.status} - ${errorText}`);
    }

    // ✅ IL BACKEND STREAMA DIRETTAMENTE IL FILE
    // Copia gli header dal backend
    const contentType = response.headers.get('content-type');
    const contentDisposition = response.headers.get('content-disposition');
    const contentLength = response.headers.get('content-length');

    if (contentType) res.setHeader('Content-Type', contentType);
    if (contentDisposition) res.setHeader('Content-Disposition', contentDisposition);
    if (contentLength) res.setHeader('Content-Length', contentLength);

    console.log(`📥 Stream Excel direttamente al client`);

    // ✅ PIPE DIRETTO DAL BACKEND AL CLIENT
    response.body.pipe(res);

    res.on('finish', () => {
      console.log(`✅ Download Excel completato per evento ${id_evento}`);
    });

  } catch (err) {
    console.error('❌ Errore export Excel frontend:', err);
    
    if (!res.headersSent) {
      res.status(500).send(`Errore durante il download del file Excel: ${err.message}`);
    }
  }
};

// ✅ AGGIORNATO: Esporta in PDF gli iscritti a un evento - DOWNLOAD DIRETTO
export const exportPdfIscrittiEvento = async (req, res) => {
  const { id_evento } = req.params;

  try {
    console.log(`📄 Avvio download PDF per evento ${id_evento}`);

    // ✅ STEP 1: Chiama il backend per generare il PDF
    const response = await apiFetch(`/iscrizioni/evento/${id_evento}/export-pdf`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Errore backend PDF (${response.status}):`, errorText);
      throw new Error(`Errore download PDF: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ PDF generato:', data);

    // ✅ STEP 2: Scarica il file PDF generato
    console.log(`📁 Download PDF da: ${data.path}`);
    const fileResponse = await apiFetch(data.path);
    
    if (!fileResponse.ok) {
      throw new Error(`Errore nel download del file PDF: ${fileResponse.status}`);
    }

    // ✅ STEP 3: Imposta gli header per il download FORZATO
    const filename = data.filename || `iscritti_evento_${id_evento}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Aggiungi Content-Length se disponibile
    const contentLength = fileResponse.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
      console.log(`📦 Dimensione PDF: ${Math.round(contentLength / 1024)} KB`);
    }

    console.log(`📥 Inizio stream file PDF "${filename}" all'utente`);

    // ✅ STEP 4: Stream del file PDF direttamente all'utente
    fileResponse.body.pipe(res);

    // Log quando il download è completato
    res.on('finish', () => {
      console.log(`✅ Download PDF completato per evento ${id_evento}`);
    });

    res.on('error', (err) => {
      console.error(`❌ Errore durante il download PDF:`, err);
    });

  } catch (err) {
    console.error('❌ Errore download PDF:', err);
    
    // Se non abbiamo ancora inviato headers, invia errore
    if (!res.headersSent) {
      res.status(500).send(`Errore durante il download del file PDF: ${err.message}`);
    }
  }
};