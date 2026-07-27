const propertiesService = require('../services/propertiesService')

const parseAmenityIds = (raw) => {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map(Number).filter(Boolean)
  return String(raw)
    .split(',')
    .map((part) => Number(part.trim()))
    .filter(Boolean)
}

exports.listProperties = async (req, res, next) => {
  try {
    const city = req.query.ciudad || req.query.city
    const minPrice = req.query.min_precio || req.query.min_price
    const maxPrice = req.query.max_precio || req.query.max_price
    const guests = req.query.huespedes || req.query.guests
    const checkIn = req.query.check_in || req.query.entrada
    const checkOut = req.query.check_out || req.query.salida
    const amenityIds = parseAmenityIds(req.query.amenities || req.query.comodidades)
    const sort = req.query.sort || req.query.ordenar || 'id'
    const page = req.query.page || req.query.pagina || 1
    const limit = req.query.limit || req.query.limite || 12

    if ((checkIn && !checkOut) || (!checkIn && checkOut)) {
      return res.status(400).json({ error: 'Debes enviar check_in y check_out juntos' })
    }

    if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) {
      return res.status(400).json({ error: 'La fecha de salida debe ser posterior a la de entrada' })
    }

    const result = await propertiesService.getAll({
      city,
      minPrice,
      maxPrice,
      guests,
      checkIn,
      checkOut,
      amenityIds,
      sort,
      page,
      limit,
    })

    res.json(result)
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
    const {
      title,
      description,
      address,
      city,
      country,
      price_per_night,
      max_guests,
      photo_url,
      amenity_ids,
    } = req.body

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
      amenity_ids,
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

exports.toggleActive = async (req, res, next) => {
  try {
    const active = Boolean(req.body.active)
    const property = await propertiesService.setActive(req.params.id, req.user.sub, active)
    res.json({ data: property })
  } catch (err) {
    next(err)
  }
}

exports.updateProperty = async (req, res, next) => {
  try {
    const {
      title,
      description,
      address,
      city,
      country,
      price_per_night,
      max_guests,
      photo_url,
      amenity_ids,
    } = req.body

    if (!title?.trim() || !address?.trim() || !city?.trim() || !country?.trim()) {
      return res.status(400).json({ error: 'Título, dirección, ciudad y país son obligatorios' })
    }

    if (!price_per_night || !max_guests) {
      return res.status(400).json({ error: 'Precio por noche y capacidad son obligatorios' })
    }

    const property = await propertiesService.update(req.params.id, req.user.sub, {
      title,
      description,
      address,
      city,
      country,
      price_per_night: Number(price_per_night),
      max_guests: Number(max_guests),
      photo_url,
      amenity_ids,
    })

    res.json({ data: property })
  } catch (err) {
    next(err)
  }
}

exports.getMyProperty = async (req, res, next) => {
  try {
    const property = await propertiesService.getByIdForHost(req.params.id, req.user.sub)
    if (!property) {
      return res.status(404).json({ error: 'Propiedad no encontrada' })
    }
    res.json({ data: property })
  } catch (err) {
    next(err)
  }
}
