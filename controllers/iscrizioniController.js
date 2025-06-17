import { apiFetch } from '../utils/apiFetch.js';

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

// ✅ Salva iscrizione
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

// ✅ Mostra iscritti evento
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
      successo: req.query.successo || null,
      errore: req.query.errore || null
    });
  } catch (err) {
    console.error("❌ Errore caricamento iscritti evento:", err);
    res.status(500).send("Errore caricamento dati evento/iscritti");
  }
};

// ✅ EXCEL - Funzione unificata con debug
export const exportExcelIscrittiEvento = async (req, res) => {
  const { id_evento } = req.params;

  try {
    console.log(`📊 [DEBUG] Richiesta export Excel per evento ${id_evento}`);
    console.log(`📊 [DEBUG] apiFetch endpoint: /iscrizioni/evento/${id_evento}/export`);

    // ✅ CHIAMATA AL BACKEND
    const response = await apiFetch(`/iscrizioni/evento/${id_evento}/export`);

    console.log(`📊 [DEBUG] Response status: ${response.status}`);
    console.log(`📊 [DEBUG] Response ok: ${response.ok}`);
    console.log(`📊 [DEBUG] Response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [DEBUG] Errore backend (${response.status}):`, errorText);
      throw new Error(`Errore nel backend: ${response.status} - ${errorText}`);
    }

    // ✅ VERIFICA TIPO DI RISPOSTA
    const contentType = response.headers.get('content-type');
    console.log(`📊 [DEBUG] Content-Type ricevuto: ${contentType}`);

    // Se è JSON, il backend ha restituito un errore o info
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log(`📊 [DEBUG] Backend ha restituito JSON:`, data);
      
      // Se ha un path, è il vecchio comportamento con file salvato
      if (data.path) {
        console.log(`📊 [DEBUG] Redirect al file: https://bike-backend-production-9cc5.up.railway.app${data.path}`);
        return res.redirect(`https://bike-backend-production-9cc5.up.railway.app${data.path}`);
      }
    }

    // ✅ SE È UN FILE, STREAMA DIRETTAMENTE
    const contentDisposition = response.headers.get('content-disposition');
    const contentLength = response.headers.get('content-length');

    console.log(`📊 [DEBUG] Content-Disposition: ${contentDisposition}`);
    console.log(`📊 [DEBUG] Content-Length: ${contentLength}`);

    // Imposta header per download
    if (contentType) res.setHeader('Content-Type', contentType);
    if (contentDisposition) res.setHeader('Content-Disposition', contentDisposition);
    if (contentLength) res.setHeader('Content-Length', contentLength);

    console.log(`📥 [DEBUG] Inizio stream Excel al client`);

    // ✅ PIPE DIRETTO DAL BACKEND AL CLIENT
    response.body.pipe(res);

    res.on('finish', () => {
      console.log(`✅ [DEBUG] Download Excel completato per evento ${id_evento}`);
    });

    res.on('error', (err) => {
      console.error(`❌ [DEBUG] Errore durante stream:`, err);
    });

  } catch (err) {
    console.error('❌ [DEBUG] Errore export Excel frontend:', err);
    console.error('❌ [DEBUG] Stack trace:', err.stack);
    
    if (!res.headersSent) {
      res.status(500).send(`Errore durante il download del file Excel: ${err.message}`);
    }
  }
};

// ✅ PDF - Mantieni come era
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