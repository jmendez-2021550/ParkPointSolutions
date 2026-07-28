import { processFavorites } from './favorites.service.js';
import { asyncHandler } from '../../middlewares/server-genericError-handler.js';

export const processFavoritesHandler = asyncHandler(async (req, res) => {
  await processFavorites();
  res.json({ message: 'Procesamiento de favoritos completado' });
});
