// db/adapters/auth-db-adapter.example.js
// Adapta estas funciones a tu ORM o base de datos

/**
 * Guarda el token de verificación de email y su expiración para un usuario
 */
export async function updateEmailVerificationToken(userId, token, expiry) {
  // Implementa aquí la lógica para tu base de datos
  // Ejemplo con pseudo-código:
  // await User.updateOne({ id: userId }, { emailVerificationToken: token, emailVerificationTokenExpiry: expiry })
}

/**
 * Busca un usuario por token de verificación de email (y que no esté expirado)
 */
export async function findUserByEmailVerificationToken(token) {
  // return await User.findOne({ emailVerificationToken: token, emailVerificationTokenExpiry: { $gt: new Date() } })
}

/**
 * Marca el email como verificado y limpia el token
 */
export async function markEmailAsVerified(userId) {
  // await User.updateOne({ id: userId }, { emailVerified: true, emailVerificationToken: null, emailVerificationTokenExpiry: null })
}

/**
 * Guarda el token de reset de contraseña y su expiración
 */
export async function updatePasswordResetToken(userId, token, expiry) {
  // await User.updateOne({ id: userId }, { passwordResetToken: token, passwordResetTokenExpiry: expiry })
}

/**
 * Busca un usuario por token de reset de contraseña (y que no esté expirado)
 */
export async function findUserByPasswordResetToken(token) {
  // return await User.findOne({ passwordResetToken: token, passwordResetTokenExpiry: { $gt: new Date() } })
}

/**
 * Actualiza la contraseña y limpia el token de reset
 */
export async function updateUserPassword(userId, hashedPassword) {
  // await User.updateOne({ id: userId }, { password: hashedPassword, passwordResetToken: null, passwordResetTokenExpiry: null })
}
