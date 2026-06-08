// Simple auth stub — replace with real DB lookup
exports.authenticate = async (email, password) => {
  if (!email || !password) return null
  // dummy: any password 'password' authenticates
  if (password === 'password') return 'fake-jwt-token'
  return null
}
