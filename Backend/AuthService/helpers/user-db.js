import { Op } from 'sequelize';
import { User, UserProfile, UserEmail, UserPasswordReset } from '../src/users/user.model.js';
import { UserRole, Role } from '../src/auth/role.model.js';
import { USER_ROLE } from './role-constants.js';
import { hashPassword } from '../utils/password-utils.js';

export const findUserByEmailOrUsername = async (emailOrUsername) => {
  const user = await User.findOne({
    where: {
      [Op.or]: [
        { Email: emailOrUsername.toLowerCase() },
        { Username: emailOrUsername.toLowerCase() },
      ],
    },
    include: [
      { model: UserProfile, as: 'UserProfile' },
      { model: UserEmail, as: 'UserEmail' },
      { model: UserPasswordReset, as: 'UserPasswordReset' },
      {
        model: UserRole,
        as: 'UserRoles',
        include: [{ model: Role, as: 'Role' }],
      },
    ],
  });
  return user;
};

export const findUserById = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [
      { model: UserProfile, as: 'UserProfile' },
      { model: UserEmail, as: 'UserEmail' },
      { model: UserPasswordReset, as: 'UserPasswordReset' },
      {
        model: UserRole,
        as: 'UserRoles',
        include: [{ model: Role, as: 'Role' }],
      },
    ],
  });
  return user;
};

export const checkUserExists = async (email, username) => {
  const existingUser = await User.findOne({
    where: {
      [Op.or]: [
        { Email: email.toLowerCase() },
        { Username: username.toLowerCase() },
      ],
    },
  });
  return !!existingUser;
};

export const createNewUser = async (userData) => {
  const transaction = await User.sequelize.transaction();
  try {
    const { name, surname, username, email, password, phone, profilePicture } = userData;
    const hashedPassword = await hashPassword(password);
    const user = await User.create(
      {
        Name: name,
        Surname: surname,
        Username: username.toLowerCase(),
        Email: email.toLowerCase(),
        Password: hashedPassword,
        Status: false,
      },
      { transaction }
    );

    await UserProfile.create(
      {
        UserId: user.Id,
        Phone: phone,
        ProfilePicture: profilePicture || '',
      },
      { transaction }
    );

    await UserEmail.create(
      {
        UserId: user.Id,
        EmailVerified: false,
      },
      { transaction }
    );

    await UserPasswordReset.create(
      {
        UserId: user.Id,
      },
      { transaction }
    );

    const userRole = await Role.findOne({ where: { Name: USER_ROLE }, transaction });
    if (userRole) {
      await UserRole.create(
        {
          UserId: user.Id,
          RoleId: userRole.Id,
        },
        { transaction }
      );
    }

    await transaction.commit();
    return await findUserById(user.Id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const updateEmailVerificationToken = async (userId, token, expiry) => {
  await UserEmail.update(
    {
      EmailVerificationToken: token,
      EmailVerificationTokenExpiry: expiry,
    },
    {
      where: { UserId: userId },
    }
  );
};

export const markEmailAsVerified = async (userId) => {
  const transaction = await User.sequelize.transaction();
  try {
    await UserEmail.update(
      {
        EmailVerified: true,
        EmailVerificationToken: null,
        EmailVerificationTokenExpiry: null,
      },
      {
        where: { UserId: userId },
        transaction,
      }
    );

    await User.update(
      {
        Status: true,
      },
      {
        where: { Id: userId },
        transaction,
      }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const updatePasswordResetToken = async (userId, token, expiry) => {
  await UserPasswordReset.update(
    {
      PasswordResetToken: token,
      PasswordResetTokenExpiry: expiry,
    },
    {
      where: { UserId: userId },
    }
  );
};

export const findUserByEmail = async (email) => {
  const user = await User.findOne({
    where: { Email: email.toLowerCase() },
    include: [
      { model: UserProfile, as: 'UserProfile' },
      { model: UserEmail, as: 'UserEmail' },
      { model: UserPasswordReset, as: 'UserPasswordReset' },
      {
        model: UserRole,
        as: 'UserRoles',
        include: [{ model: Role, as: 'Role' }],
      },
    ],
  });
  return user;
};

export const findUserByEmailVerificationToken = async (token) => {
  const user = await User.findOne({
    include: [
      {
        model: UserEmail,
        as: 'UserEmail',
        where: {
          EmailVerificationToken: token,
          EmailVerificationTokenExpiry: {
            [Op.gt]: new Date(),
          },
        },
      },
      { model: UserProfile, as: 'UserProfile' },
      { model: UserPasswordReset, as: 'UserPasswordReset' },
    ],
  });
  return user;
};

export const findUserByPasswordResetToken = async (token) => {
  const user = await User.findOne({
    include: [
      {
        model: UserPasswordReset,
        as: 'UserPasswordReset',
        where: {
          PasswordResetToken: token,
          PasswordResetTokenExpiry: {
            [Op.gt]: new Date(),
          },
        },
      },
      { model: UserProfile, as: 'UserProfile' },
      { model: UserEmail, as: 'UserEmail' },
    ],
  });
  return user;
};

export const updateUserPassword = async (userId, hashedPassword) => {
  const transaction = await User.sequelize.transaction();
  try {
    await User.update(
      {
        Password: hashedPassword,
      },
      {
        where: { Id: userId },
        transaction,
      }
    );

    await UserPasswordReset.update(
      {
        PasswordResetToken: null,
        PasswordResetTokenExpiry: null,
      },
      {
        where: { UserId: userId },
        transaction,
      }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
