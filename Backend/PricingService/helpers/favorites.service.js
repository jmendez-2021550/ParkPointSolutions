import { Favorite } from '../src/favorites/favorite.model.js';

export const isUserFavorite = async (userId) => {
  if (!userId) return false;
  const favorite = await Favorite.findOne({ where: { UserId: userId, IsActive: true } });
  return !!favorite;
};
