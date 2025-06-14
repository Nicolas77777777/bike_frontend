import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import clientiRoutes from './routes/clienti.js';
import tipologicheRoutes from './routes/tipologiche.js'; // ✅ Aggiunto
import eventiRoutes from './routes/eventi.js';
import iscrizioniRoutes from './routes/iscrizioni.js';




const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = express();
const port = process.env.PORT || 8081;


server.set('view engine', 'ejs');
server.set('views', path.join(__dirname, 'views'));

server.use(express.urlencoded({ extended: true }));
server.use(express.json());
server.use(express.static(path.join(__dirname, 'public')));


// Middleware per il titolo predefinito
server.use((req, res, next) => {
  res.locals.titolo = 'Bike and Hike';
  next();
});

// ✅ Rotte
server.use('/', authRoutes);
server.use('/clienti', clientiRoutes);
server.use('/tipologiche', tipologicheRoutes); // ✅ Aggiunto
server.use('/eventi', eventiRoutes);
server.use('/iscrizioni', iscrizioniRoutes);

// ✅ Pagina principale
server.get('/home', (req, res) => {
  res.render('home');
});

server.listen(port, () => {
  console.log(`✅ Server frontend avviato su http://localhost:${port}`);
});
