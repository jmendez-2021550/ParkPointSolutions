import { Favorite } from '../src/favorites/favorite.model.js';

export const processFavorites = async () => {
  try {
    console.log('Favorites service: not implemented in parking service boundary');
  } catch (error) {
    console.error('Favorites processing failed:', error);
  }
};

export const isUserFavorite = async (userId) => {
  if (!userId) return false;
  const favorite = await Favorite.findOne({ where: { UserId: userId, IsActive: true } });
  return !!favorite;
};
