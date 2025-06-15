import { apiFetch } from '../utils/apiFetch.js';

export const showLogin = (req, res) => {
  res.render('login', { errore: null });
};

export const handleLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const response = await apiFetch('/controllologin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      return res.render('login', { errore: 'Credenziali errate' });
    }

    const utente = await response.json();
    console.log('✅ Login riuscito per utente:', utente[0]?.username);

    // ✅ CORRETTO: Redirect alla home invece di renderizzare direttamente
    // Questo permette alla route /home di gestire correttamente il caricamento
    res.redirect('/home');
  } catch (err) {
    console.error("❌ Errore autenticazione:", err);
    res.render('login', { errore: 'Errore del server' });
  }
};