import { processFavorites } from './favorites.service.js';

export const processFavoritesHandler = async (req, res, next) => {
    try {
        await processFavorites();
        res.json({ message: 'Procesamiento de favoritos completado' });
    } catch (err) {
        next(err);
    }
};