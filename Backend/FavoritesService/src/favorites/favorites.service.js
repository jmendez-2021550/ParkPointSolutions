import { Op } from 'sequelize';
import { sequelize } from '../../configs/db.js';
import { Reservation } from '../reservations/reservation.model.js';
import { Favorite } from './favorite.model.js';
import { User } from '../users/user.model.js';
import { sendFavoriteEmail } from '../../helpers/email-service.js';

export const processFavorites = async () => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const userReservationCounts = await Reservation.findAll({
    attributes: [
      'UserId',
      [sequelize.fn('COUNT', sequelize.col('Id')), 'reservationCount'],
    ],
    where: {
      CreatedAt: { [Op.gte]: oneMonthAgo },
      Status: 'completed',
    },
    group: ['UserId'],
    order: [[sequelize.fn('COUNT', sequelize.col('Id')), 'DESC']],
    limit: 10,
    raw: true,
  });

  const topUserIds = userReservationCounts.map((r) => r.UserId);

  for (const userId of topUserIds) {
    const existing = await Favorite.findOne({ where: { UserId: userId } });
    if (!existing) {
      await Favorite.create({ UserId: userId });
    } else {
      await existing.update({ IsActive: true });
    }
  }

  if (topUserIds.length > 0) {
    await Favorite.update(
      { IsActive: false },
      { where: { UserId: { [Op.notIn]: topUserIds } } }
    );
  }

  for (const userId of topUserIds) {
    const user = await User.findByPk(userId);
    if (user && user.Email) {
      try {
        await sendFavoriteEmail(user.Email, user.Name);
        console.log(`Favorite email sent to: ${user.Email}`);
      } catch (emailErr) {
        console.error(`Error sending favorite email to ${user.Email}:`, emailErr);
      }
    }
  }

  console.log('Favorites processing completed');
};

export const isUserFavorite = async (userId) => {
  const favorite = await Favorite.findOne({ where: { UserId: userId, IsActive: true } });
  return !!favorite;
};
