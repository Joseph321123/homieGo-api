const propertiesService = require('../services/propertiesService')

exports.listProperties = async (req, res, next) => {
  try {
    const city = req.query.ciudad || req.query.city
    const items = await propertiesService.getAll({ city })
    res.json({ data: items, total: items.length })
  } catch (err) {
    next(err)
  }
}

exports.getPropertyById = async (req, res, next) => {
  try {
    const property = await propertiesService.getById(req.params.id)
    if (!property) {
      return res.status(404).json({ error: 'Propiedad no encontrada' })
    }
    res.json({ data: property })
  } catch (err) {
    next(err)
  }
}

exports.createProperty = async (req, res, next) => {
  try {
    const { title, description, address, city, country, price_per_night, max_guests, photo_url } =
      req.body

    if (!title?.trim() || !address?.trim() || !city?.trim() || !country?.trim()) {
      return res.status(400).json({ error: 'Título, dirección, ciudad y país son obligatorios' })
    }

    if (!price_per_night || !max_guests) {
      return res.status(400).json({ error: 'Precio por noche y capacidad son obligatorios' })
    }

    const property = await propertiesService.create(req.user.sub, {
      title,
      description,
      address,
      city,
      country,
      price_per_night: Number(price_per_night),
      max_guests: Number(max_guests),
      photo_url,
    })

    res.status(201).json({ data: property })
  } catch (err) {
    next(err)
  }
}

exports.myProperties = async (req, res, next) => {
  try {
    const items = await propertiesService.getByHost(req.user.sub)
    res.json({ data: items, total: items.length })
  } catch (err) {
    next(err)
  }
}
