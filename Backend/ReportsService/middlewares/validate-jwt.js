import { verifyJWT } from '../helpers/generate-jwt.js';
import { findUserById, findUserByEmail } from '../helpers/user-db.js';

export const validateJWT = async (req, res, next) => {
  try {
    let token =
      req.header('x-token') ||
      req.header('authorization') ||
      req.body.token ||
      req.query.token;

    const superEmail = process.env.SUPER_ADMIN_EMAIL;
    if (token && superEmail && token.toLowerCase() === superEmail.toLowerCase()) {
      const user = await findUserByEmail(superEmail);
      if (user) {
        req.user = user;
        req.userId = user.Id.toString();
        return next();
      }
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'No hay token en la petición' });
    }

    token = token.replace(/^Bearer\s+/i, '');
    const decoded = await verifyJWT(token);

    const user = await findUserById(decoded.sub);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Token no válido - Usuario no existe' });
    }

    if (!user.Status) {
      return res.status(423).json({ success: false, message: 'Cuenta desactivada. Contacta al administrador.' });
    }

    req.user = user;
    req.userId = user.Id.toString();
    next();
  } catch (error) {
    let message = 'Error al verificar el token';
    if (error.name === 'TokenExpiredError') message = 'Token expirado';
    else if (error.name === 'JsonWebTokenError') message = 'Token inválido';
    return res.status(401).json({ success: false, message });
  }
};
