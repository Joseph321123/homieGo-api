// Simple in-memory example service
const sample = [
  { id: 1, title: 'Depto céntrico', city: 'Ciudad' },
  { id: 2, title: 'Casa con jardín', city: 'Provincia' },
]

exports.getAll = async () => {
  // Here you would query DB; returning sample data for now
  return Promise.resolve(sample)
}
