import fetch from 'node-fetch';

export const showLogin = (req, res) => {
  res.render('login', { errore: null });
};

export const handleLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const response = await fetch('http://localhost:3000/controllologin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      return res.render('login', { errore: 'Credenziali errate' });
    }

    const utente = await response.json();
    res.render('home', { utente: utente[0] });

  } catch (err) {
    console.error("Errore autenticazione:", err);
    res.render('login', { errore: 'Errore del server' });
  }
};

export const logout = (req, res) => {
  res.redirect('/');
};
