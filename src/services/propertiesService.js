const { pool } = require('../config/db')
const availabilityService = require('./availabilityService')
const photosService = require('./photosService')
const amenitiesService = require('./amenitiesService')

const SORT_MAP = {
  price_asc: 'p.precio_noche ASC, p.id ASC',
  price_desc: 'p.precio_noche DESC, p.id ASC',
  rating_desc: 'rating_avg DESC NULLS LAST, p.id ASC',
  newest: 'p.created_at DESC, p.id DESC',
  id: 'p.id ASC',
}

exports.getAll = async ({
  city,
  minPrice,
  maxPrice,
  guests,
  checkIn,
  checkOut,
  amenityIds = [],
  sort = 'id',
  page = 1,
  limit = 12,
} = {}) => {
  const values = []
  const filters = ['p.activa = TRUE']

  if (city) {
    values.push(`%${city.trim()}%`)
    filters.push(`p.ciudad ILIKE $${values.length}`)
  }

  if (minPrice) {
    values.push(Number(minPrice))
    filters.push(`p.precio_noche >= $${values.length}`)
  }

  if (maxPrice) {
    values.push(Number(maxPrice))
    filters.push(`p.precio_noche <= $${values.length}`)
  }

  if (guests) {
    values.push(Number(guests))
    filters.push(`p.max_huespedes >= $${values.length}`)
  }

  if (checkIn && checkOut) {
    values.push(checkIn)
    values.push(checkOut)
    filters.push(`NOT EXISTS (
      SELECT 1 FROM reservaciones r
      WHERE r.propiedad_id = p.id
        AND r.estado IN ('pendiente', 'aceptada', 'confirmada')
        AND r.fecha_entrada < $${values.length}
        AND r.fecha_salida > $${values.length - 1}
    )`)
    filters.push(`NOT EXISTS (
      SELECT 1 FROM bloqueos_propiedad b
      WHERE b.propiedad_id = p.id
        AND b.fecha_inicio < $${values.length}
        AND b.fecha_fin > $${values.length - 1}
    )`)
  }

  const uniqueAmenities = [...new Set(amenityIds.map(Number).filter(Boolean))]
  if (uniqueAmenities.length > 0) {
    values.push(uniqueAmenities)
    values.push(uniqueAmenities.length)
    filters.push(`(
      SELECT COUNT(DISTINCT pc.comodidad_id)
      FROM propiedad_comodidades pc
      WHERE pc.propiedad_id = p.id
        AND pc.comodidad_id = ANY($${values.length - 1}::int[])
    ) = $${values.length}`)
  }

  const orderBy = SORT_MAP[sort] || SORT_MAP.id
  const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 50)
  const safePage = Math.max(Number(page) || 1, 1)
  const offset = (safePage - 1) * safeLimit

  const whereSql = filters.join(' AND ')

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM propiedades p
     WHERE ${whereSql}`,
    values
  )
  const total = countResult.rows[0].total

  values.push(safeLimit)
  values.push(offset)

  const { rows } = await pool.query(
    `SELECT p.id,
            p.titulo AS title,
            p.ciudad AS city,
            p.pais AS country,
            p.precio_noche AS price_per_night,
            p.max_huespedes AS max_guests,
            f.url_foto AS photo_url,
            ROUND(AVG(re.calificacion)::numeric, 1) AS rating_avg,
            COUNT(re.id)::int AS reviews_count
     FROM propiedades p
     LEFT JOIN LATERAL (
       SELECT url_foto
       FROM fotos_propiedad
       WHERE propiedad_id = p.id
       ORDER BY principal DESC, id ASC
       LIMIT 1
     ) f ON TRUE
     LEFT JOIN reservaciones r ON r.propiedad_id = p.id
     LEFT JOIN resenas re ON re.reservacion_id = r.id AND re.autor_id = r.huesped_id
     WHERE ${whereSql}
     GROUP BY p.id, f.url_foto
     ORDER BY ${orderBy}
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  )

  return {
    data: rows.map((row) => ({
      ...row,
      rating_avg: row.rating_avg ? Number(row.rating_avg) : null,
    })),
    total,
    page: safePage,
    limit: safeLimit,
    total_pages: Math.max(Math.ceil(total / safeLimit), 1),
  }
}

exports.getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT p.id,
            p.titulo AS title,
            p.descripcion AS description,
            p.direccion AS address,
            p.ciudad AS city,
            p.pais AS country,
            p.precio_noche AS price_per_night,
            p.max_huespedes AS max_guests,
            p.reglas AS house_rules,
            p.latitud AS latitude,
            p.longitud AS longitude,
            u.nombre AS host_name,
            u.identidad_estado AS host_identity_status,
            f.url_foto AS photo_url,
            (
              SELECT ROUND(AVG(re.calificacion)::numeric, 1)
              FROM resenas re
              JOIN reservaciones r ON r.id = re.reservacion_id
              WHERE r.propiedad_id = p.id
                AND re.autor_id = r.huesped_id
            ) AS rating_avg,
            (
              SELECT COUNT(*)::int
              FROM resenas re
              JOIN reservaciones r ON r.id = re.reservacion_id
              WHERE r.propiedad_id = p.id
                AND re.autor_id = r.huesped_id
            ) AS reviews_count
     FROM propiedades p
     JOIN usuarios u ON u.id = p.anfitrion_id
     LEFT JOIN LATERAL (
       SELECT url_foto
       FROM fotos_propiedad
       WHERE propiedad_id = p.id
       ORDER BY principal DESC, id ASC
       LIMIT 1
     ) f ON TRUE
     WHERE p.id = $1 AND p.activa = TRUE`,
    [id]
  )

  const property = rows[0]
  if (!property) return null

  property.rating_avg = property.rating_avg ? Number(property.rating_avg) : null
  property.latitude = property.latitude != null ? Number(property.latitude) : null
  property.longitude = property.longitude != null ? Number(property.longitude) : null
  property.photos = await photosService.listByProperty(id)
  property.blocked_dates = await availabilityService.getBlockedRanges(id)
  property.amenities = await amenitiesService.listByProperty(id)
  return property
}

exports.create = async (hostId, payload) => {
  const {
    title,
    description,
    address,
    city,
    country,
    price_per_night,
    max_guests,
    photo_url,
    amenity_ids = [],
    house_rules,
    latitude,
    longitude,
  } = payload

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query(
      `INSERT INTO propiedades (
         anfitrion_id, titulo, descripcion, direccion, ciudad, pais,
         precio_noche, max_huespedes, reglas, latitud, longitud, activa
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE)
       RETURNING id, titulo AS title, ciudad AS city, pais AS country,
                 precio_noche AS price_per_night, max_huespedes AS max_guests,
                 reglas AS house_rules, latitud AS latitude, longitud AS longitude`,
      [
        hostId,
        title.trim(),
        description?.trim() || '',
        address.trim(),
        city.trim(),
        country.trim(),
        price_per_night,
        max_guests,
        house_rules?.trim() || null,
        latitude ?? null,
        longitude ?? null,
      ]
    )

    const property = rows[0]

    if (photo_url?.trim()) {
      await client.query(
        `INSERT INTO fotos_propiedad (propiedad_id, url_foto, principal)
         VALUES ($1, $2, TRUE)`,
        [property.id, photo_url.trim()]
      )
      property.photo_url = photo_url.trim()
    }

    const uniqueIds = [...new Set((amenity_ids || []).map(Number).filter(Boolean))]
    for (const amenityId of uniqueIds) {
      await client.query(
        `INSERT INTO propiedad_comodidades (propiedad_id, comodidad_id)
         VALUES ($1, $2)
         ON CONFLICT (propiedad_id, comodidad_id) DO NOTHING`,
        [property.id, amenityId]
      )
    }

    await client.query('COMMIT')
    property.amenities = await amenitiesService.listByProperty(property.id)
    return property
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

exports.getByHost = async (hostId) => {
  const { rows } = await pool.query(
    `SELECT p.id,
            p.titulo AS title,
            p.ciudad AS city,
            p.pais AS country,
            p.precio_noche AS price_per_night,
            p.max_huespedes AS max_guests,
            p.activa AS active,
            f.url_foto AS photo_url
     FROM propiedades p
     LEFT JOIN LATERAL (
       SELECT url_foto
       FROM fotos_propiedad
       WHERE propiedad_id = p.id
       ORDER BY principal DESC, id ASC
       LIMIT 1
     ) f ON TRUE
     WHERE p.anfitrion_id = $1
     ORDER BY p.id DESC`,
    [hostId]
  )
  return rows
}

exports.setActive = async (propertyId, hostId, active) => {
  const { rows } = await pool.query(
    `UPDATE propiedades
     SET activa = $3, updated_at = NOW()
     WHERE id = $1 AND anfitrion_id = $2
     RETURNING id, titulo AS title, activa AS active`,
    [propertyId, hostId, active]
  )

  if (!rows[0]) {
    const error = new Error('Propiedad no encontrada')
    error.status = 404
    throw error
  }

  return rows[0]
}

exports.update = async (propertyId, hostId, payload) => {
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
    house_rules,
    latitude,
    longitude,
  } = payload

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query(
      `UPDATE propiedades
       SET titulo = $3,
           descripcion = $4,
           direccion = $5,
           ciudad = $6,
           pais = $7,
           precio_noche = $8,
           max_huespedes = $9,
           reglas = $10,
           latitud = $11,
           longitud = $12,
           updated_at = NOW()
       WHERE id = $1 AND anfitrion_id = $2
       RETURNING id, titulo AS title, ciudad AS city, pais AS country,
                 precio_noche AS price_per_night, max_huespedes AS max_guests,
                 reglas AS house_rules, latitud AS latitude, longitud AS longitude,
                 activa AS active`,
      [
        propertyId,
        hostId,
        title.trim(),
        description?.trim() || '',
        address.trim(),
        city.trim(),
        country.trim(),
        price_per_night,
        max_guests,
        house_rules?.trim() || null,
        latitude ?? null,
        longitude ?? null,
      ]
    )

    const property = rows[0]
    if (!property) {
      const error = new Error('Propiedad no encontrada')
      error.status = 404
      throw error
    }

    if (photo_url?.trim()) {
      await client.query(
        `UPDATE fotos_propiedad SET principal = FALSE WHERE propiedad_id = $1`,
        [propertyId]
      )
      await client.query(
        `INSERT INTO fotos_propiedad (propiedad_id, url_foto, principal)
         VALUES ($1, $2, TRUE)`,
        [propertyId, photo_url.trim()]
      )
      property.photo_url = photo_url.trim()
    }

    if (Array.isArray(amenity_ids)) {
      await client.query(`DELETE FROM propiedad_comodidades WHERE propiedad_id = $1`, [propertyId])
      const uniqueIds = [...new Set(amenity_ids.map(Number).filter(Boolean))]
      for (const amenityId of uniqueIds) {
        await client.query(
          `INSERT INTO propiedad_comodidades (propiedad_id, comodidad_id)
           VALUES ($1, $2)
           ON CONFLICT (propiedad_id, comodidad_id) DO NOTHING`,
          [propertyId, amenityId]
        )
      }
    }

    await client.query('COMMIT')
    property.amenities = await amenitiesService.listByProperty(propertyId)
    return property
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

exports.getByIdForHost = async (propertyId, hostId) => {
  const { rows } = await pool.query(
    `SELECT p.id,
            p.titulo AS title,
            p.descripcion AS description,
            p.direccion AS address,
            p.ciudad AS city,
            p.pais AS country,
            p.precio_noche AS price_per_night,
            p.max_huespedes AS max_guests,
            p.reglas AS house_rules,
            p.latitud AS latitude,
            p.longitud AS longitude,
            p.activa AS active,
            f.url_foto AS photo_url
     FROM propiedades p
     LEFT JOIN LATERAL (
       SELECT url_foto
       FROM fotos_propiedad
       WHERE propiedad_id = p.id
       ORDER BY principal DESC, id ASC
       LIMIT 1
     ) f ON TRUE
     WHERE p.id = $1 AND p.anfitrion_id = $2`,
    [propertyId, hostId]
  )
  const property = rows[0]
  if (!property) return null
  property.latitude = property.latitude != null ? Number(property.latitude) : null
  property.longitude = property.longitude != null ? Number(property.longitude) : null
  property.amenities = await amenitiesService.listByProperty(propertyId)
  return property
}
