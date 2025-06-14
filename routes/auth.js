import express from 'express';
import { showLogin, handleLogin, logout } from '../controllers/authController.js';

const router = express.Router();

router.get('/', showLogin);
router.post('/login', handleLogin);
router.get('/logout', logout);

export default router;
