import { Reservation } from '../parking/parking.model.js';
import { Favorite } from './favorites.model.js';
import { User } from '../users/user.model.js';
import { sendFavoriteEmail } from '../../helpers/email-service.js';
import { sequelize } from '../../configs/db.js';
import { Op } from 'sequelize';

export const processFavorites = async () => {
    try {
        // Calcular fecha de hace un mes
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        // Contar reservas por usuario en el último mes
        const userReservationCounts = await Reservation.findAll({
            attributes: [
                'UserId',
                [sequelize.fn('COUNT', sequelize.col('Id')), 'reservationCount'],
            ],
            where: {
                CreatedAt: {
                    [Op.gte]: oneMonthAgo,
                },
                Status: 'completed', // Solo reservas completadas
            },
            group: ['UserId'],
            order: [[sequelize.fn('COUNT', sequelize.col('Id')), 'DESC']],
            limit: 10, // Top 10 usuarios
            raw: true,
        });

        // Obtener IDs de usuarios top
        const topUserIds = userReservationCounts.map(count => count.UserId);

        // Marcar como favoritos (crear o actualizar)
        for (const userId of topUserIds) {
            const existingFavorite = await Favorite.findOne({ where: { UserId: userId } });
            if (!existingFavorite) {
                await Favorite.create({ UserId: userId });
            } else {
                await existingFavorite.update({ IsActive: true });
            }
        }

        // Desactivar favoritos que ya no están en top
        await Favorite.update(
            { IsActive: false },
            {
                where: {
                    UserId: {
                        [Op.notIn]: topUserIds,
                    },
                },
            }
        );

        // Enviar emails a nuevos favoritos
        for (const userId of topUserIds) {
            const user = await User.findByPk(userId);
            if (user && user.Email) {
                try {
                    await sendFavoriteEmail(user.Email, user.Name);
                    console.log(`Email enviado a favorito: ${user.Email}`);
                } catch (emailErr) {
                    console.error(`Error enviando email a ${user.Email}:`, emailErr);
                }
            }
        }

        console.log('Procesamiento de favoritos completado');
    } catch (error) {
        console.error('Error procesando favoritos:', error);
    }
};