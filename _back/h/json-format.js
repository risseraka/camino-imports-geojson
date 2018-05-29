const _ = require('lodash')
const slugify = require('@sindresorhus/slugify')
const leftPad = require('left-pad')
const spliceString = require('splice-string')
const errMsg = '--------------------------------> ERROR'

const jsonFormat = geojsonFeature => {
  const domaineId = 'h'
  const t = _.capitalize(_.toLower(geojsonFeature.properties.TYPE_FR))
  const typeId = (() => {
    if (
      t === 'Demande de permis de recherches' ||
      t === 'Permis de recherches 1ere période' ||
      t === 'Permis de recherches 2e période' ||
      t === 'Permis de recherches 3e période'
    ) {
      return 'prh'
    } else if (
      t === 'Demande de concession' ||
      t === "Titre d'exploitation - concession" ||
      t === 'Concession'
    ) {
      return 'cxx'
    } else {
      return errMsg
    }
  })()

  const titreNom = _.startCase(_.toLower(geojsonFeature.properties.NOM))
  const titreId = slugify(`${domaineId}-${typeId}-${titreNom}`)

  const phaseId = (() => {
    if (t === 'Demande de permis de recherches') {
      return 'prh-oct'
    } else if (t === 'Permis de recherches 1ere période') {
      return 'prh-pr1'
    } else if (t === 'Permis de recherches 2e période') {
      return 'prh-pr2'
    } else if (t === 'Permis de recherches 3e période') {
      return 'prh-pre'
    } else if (
      t === 'Demande de concession' ||
      t === "Titre d'exploitation - concession" ||
      t === 'Concession'
    ) {
      return 'cxx-oct'
    } else {
      return errMsg
    }
  })()

  const titrePhaseId = slugify(`${domaineId}-${phaseId}-${titreNom}`)

  const phasePosition = (() => {
    if (
      t === 'Demande de concession' ||
      t === 'Demande de permis de recherches'
    ) {
      return 0
    } else if (
      t === 'Permis de recherches 1ere période' ||
      t === "Titre d'exploitation - concession" ||
      t === 'Concession'
    ) {
      return 1
    } else if (t === 'Permis de recherches 2e période') {
      return 2
    } else if (t === 'Permis de recherches 3e période') {
      return 3
    } else {
      return errMsg
    }
  })()

  let phaseDate = _.replace(geojsonFeature.properties.DATE1, /\//g, '-')

  if (phaseDate === '') {
    phaseDate = '1900-01-01'
  }

  const titulaires = ['1', '2', '3', '4', '5', '6']
    .filter(id => geojsonFeature.properties[`TIT_PET${id}`])
    .map(i => ({
      id: slugify(geojsonFeature.properties[`TIT_PET${i}`].slice(0, 32)),
      nom: _.startCase(_.toLower(geojsonFeature.properties[`TIT_PET${i}`]))
    }))

  const pointsCreate = (polygon, i) =>
    polygon.reduce(
      (points, set, n) => [
        ...points,
        {
          id: slugify(
            `${titrePhaseId}-contour-${leftPad(i, 2, 0)}-${leftPad(n, 3, 0)}`
          ),
          coordonees: set.join(),
          groupe: `contour-${leftPad(i, 2, 0)}`,
          titrePhaseId,
          position: leftPad(n, 3, 0),
          nom: String(n)
        }
      ],
      []
    )

  return {
    titres: {
      id: titreId,
      nom: titreNom,
      typeId,
      domaineId,
      statutId: 'val',
      police: true,
      references: {
        métier: geojsonFeature.properties.NUMERO
      }
    },
    'titres-substances-principales': [
      {
        titreId,
        substanceId: 'hydr'
      }
    ],
    'titres-substances-secondaires': [],
    'titres-phases': {
      id: titrePhaseId,
      phaseId,
      titreId,
      date: phaseDate,
      duree:
        (geojsonFeature.properties.DATE3
          ? Number(spliceString(geojsonFeature.properties.DATE3, 4, 6))
          : Number(spliceString(geojsonFeature.properties.DATE2, 4, 6))) -
        Number(spliceString(phaseDate, 4, 6)),
      surface: geojsonFeature.properties.SUPERFICIE,
      position: phasePosition
    },
    'titres-phases-emprises': {
      titrePhaseId,
      empriseId: 'ter'
    },
    'titres-geo-points': geojsonFeature.geometry.coordinates.reduce(
      (res, shape, i) =>
        geojsonFeature.geometry.type === 'MultiPolygon'
          ? [
              ...res,
              ...shape.reduce(
                (ps, polygon, n) => [...ps, ...pointsCreate(polygon, i)],
                []
              )
            ]
          : [...res, ...pointsCreate(shape, i)],
      []
    ),
    titulaires,
    'titres-titulaires': titulaires.map(t => ({ titulaireId: t.id, titreId }))
  }
}

module.exports = jsonFormat
