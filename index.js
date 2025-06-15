import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiFetch } from './utils/apiFetch.js';

// ✅ Import routes esistenti
import authRoutes from './routes/auth.js';
import clientiRoutes from './routes/clienti.js';
import tipologicheRoutes from './routes/tipologiche.js';
import eventiRoutes from './routes/eventi.js';
import iscrizioniRoutes from './routes/iscrizioni.js';

// ✅ VERSIONE COMPLETA: Import della funzione dashboard con chiamate API
import { mostraDashboardOverview } from './controllers/clientiController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = express();
const port = 8081;

// View engine
server.set('view engine', 'ejs');
server.set('views', path.join(__dirname, 'views'));

// Middleware
server.use(express.urlencoded({ extended: true }));
server.use(express.json());
server.use(express.static(path.join(__dirname, 'public')));

// Middleware per il titolo predefinito
server.use((req, res, next) => {
  res.locals.titolo = 'Bike and Hike';
  next();
});

// ✅ Middleware di debug per tracciare tutte le richieste
server.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url} - ${new Date().toLocaleTimeString()}`);
  if (Object.keys(req.query).length > 0) {
    console.log(`   Query params:`, req.query);
  }
  next();
});

// ✅ Rotte esistenti
server.use('/', authRoutes);
server.use('/clienti', clientiRoutes);
server.use('/tipologiche', tipologicheRoutes);
server.use('/eventi', eventiRoutes);
server.use('/iscrizioni', iscrizioniRoutes);

// ✅ VERSIONE COMPLETA: Pagina principale con chiamate API e debug esteso
server.get('/home', async (req, res) => {
  console.log('🏠 === INIZIO CARICAMENTO HOME PAGE ===');
  console.log('🕐 Timestamp:', new Date().toISOString());
  
  try {
    // Chiama la funzione del controller che fa le chiamate API
    await mostraDashboardOverview(req, res);
    console.log('✅ === HOME PAGE CARICATA CON SUCCESSO ===');
    
  } catch (err) {
    console.error('❌ === ERRORE GRAVE CARICAMENTO HOME ===');
    console.error('❌ Tipo errore:', err.name);
    console.error('❌ Messaggio:', err.message);
    console.error('❌ Stack:', err.stack);
    console.error('❌ === FINE DEBUG ERRORE ===');
    
    // Non nascondere l'errore, mostralo per il debugging
    res.status(500).json({
      errore: 'Errore caricamento home page',
      dettagli: {
        nome: err.name,
        messaggio: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : 'Hidden in production'
      },
      suggerimenti: [
        'Verifica che il backend sia avviato su porta 3000',
        'Controlla che il database PostgreSQL sia connesso',
        'Verifica che gli endpoint /cliente/statistiche e /cliente/lista esistano'
      ]
    });
  }
});

// ✅ Route di fallback per la root
server.get('/', (req, res) => {
  console.log('🔄 Redirect da root a /home');
  res.redirect('/home');
});

// ✅ TEST ENDPOINTS per verificare connettività backend
server.get('/test/backend', async (req, res) => {
  console.log('🔬 === TEST CONNETTIVITÀ BACKEND ===');
  
  const tests = [
    { name: 'Statistiche', endpoint: '/cliente/statistiche' },
    { name: 'Lista clienti', endpoint: '/cliente/lista' },
    { name: 'Lista base', endpoint: '/cliente/lista?limit=1' }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`📡 Testando: ${test.name} - ${test.endpoint}`);
      
      const startTime = Date.now();
      const response = await apiFetch(test.endpoint);
      const duration = Date.now() - startTime;
      
      const result = {
        name: test.name,
        endpoint: test.endpoint,
        status: response.status,
        ok: response.ok,
        duration: `${duration}ms`,
        headers: Object.fromEntries(response.headers.entries())
      };
      
      if (response.ok) {
        try {
          const data = await response.json();
          result.dataPreview = JSON.stringify(data).substring(0, 200) + '...';
          console.log(`✅ ${test.name}: OK (${duration}ms)`);
        } catch {
          result.dataPreview = 'Risposta non JSON';
        }
      } else {
        const errorText = await response.text();
        result.error = errorText.substring(0, 200);
        console.log(`❌ ${test.name}: ERRORE ${response.status}`);
      }
      
      results.push(result);
      
    } catch (err) {
      const result = {
        name: test.name,
        endpoint: test.endpoint,
        status: 'ERRORE CONNESSIONE',
        ok: false,
        error: err.message,
        duration: 'N/A'
      };
      results.push(result);
      console.log(`🔴 ${test.name}: ERRORE CONNESSIONE - ${err.message}`);
    }
  }
  
  console.log('🔬 === FINE TEST BACKEND ===');
  
  res.json({
    timestamp: new Date().toISOString(),
    results: results,
    summary: {
      total: tests.length,
      successful: results.filter(r => r.ok).length,
      failed: results.filter(r => !r.ok).length
    }
  });
});

// ✅ HEALTH CHECK endpoint
server.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    env: process.env.NODE_ENV || 'development'
  });
});

// ✅ 404 handler con debug
server.use((req, res) => {
  console.log(`❌ 404 - Pagina non trovata: ${req.method} ${req.url}`);
  console.log(`   Headers:`, req.headers);
  console.log(`   User-Agent:`, req.get('User-Agent'));
  
  res.status(404).json({
    errore: 'Pagina non trovata',
    url: req.url,
    metodo: req.method,
    timestamp: new Date().toISOString(),
    suggerimento: 'Controlla che l\'URL sia corretto',
    routesDisponibili: [
      'GET /',
      'GET /home',
      'GET /clienti/lista',
      'GET /clienti/statistiche',
      'GET /test/backend',
      'GET /health'
    ]
  });
});

// ✅ Error handler globale con debug dettagliato
server.use((err, req, res, next) => {
  console.error('❌ === ERRORE GLOBALE DEL SERVER ===');
  console.error('❌ URL:', req.url);
  console.error('❌ Metodo:', req.method);
  console.error('❌ Headers:', req.headers);
  console.error('❌ Body:', req.body);
  console.error('❌ Query:', req.query);
  console.error('❌ Params:', req.params);
  console.error('❌ Errore:', err);
  console.error('❌ Stack:', err.stack);
  console.error('❌ === FINE DEBUG ERRORE GLOBALE ===');
  
  res.status(500).json({
    errore: 'Errore interno del server',
    timestamp: new Date().toISOString(),
    url: req.url,
    dettagli: process.env.NODE_ENV === 'development' ? {
      messaggio: err.message,
      stack: err.stack,
      nome: err.name
    } : 'Dettagli nascosti in produzione'
  });
});

server.listen(port, () => {
  console.log('🚀 === SERVER FRONTEND AVVIATO ===');
  console.log(`📍 Porta: ${port}`);
  console.log(`🌐 URL: http://localhost:${port}`);
  console.log(`🏠 Home: http://localhost:${port}/home`);
  console.log(`📋 Lista clienti: http://localhost:${port}/clienti/lista`);
  console.log(`📊 Statistiche: http://localhost:${port}/clienti/statistiche`);
  console.log(`🔬 Test backend: http://localhost:${port}/test/backend`);
  console.log(`💚 Health check: http://localhost:${port}/health`);
  console.log(`🕐 Avviato il: ${new Date().toLocaleString()}`);
  console.log('='.repeat(50));
});