const _ = require('lodash')
const slugify = require('@sindresorhus/slugify')
const spliceString = require('splice-string')
const errMsg = '--------------------------------> ERROR'

const jsonFormat = geojsonFeature => {
  const domaineId = 'g'
  const t = _.capitalize(_.toLower(geojsonFeature.properties.TYPE_FR))
  const typeId = (() => {
    if (
      t === 'Demande de permis de recherches' ||
      t === 'Permis de recherches 1ere periode' ||
      t === 'Permis de recherches 2e periode'
    ) {
      return 'prx'
    } else if (t === "Titres d'exploitation - concession") {
      return 'cxx'
    } else {
      return errMsg
    }
  })()

  const titreNom = _.startCase(_.toLower(geojsonFeature.properties.NOM))
  const titreId = slugify(`${domaineId}-${typeId}-${titreNom}`)

  const phaseId = (() => {
    if (t === 'Demande de permis de recherches') {
      return 'prx-oct'
    } else if (t === 'Permis de recherches 1ere periode') {
      return 'prx-pr1'
    } else if (t === 'Permis de recherches 2e periode') {
      return 'prx-pr2'
    } else if (t === "Titres d'exploitation - concession") {
      return 'cxx-oct'
    } else {
      return errMsg
    }
  })()

  const titrePhaseId = slugify(`${phaseId}-${titreNom}`)

  const phasePosition = (() => {
    if (t === 'Demande de permis de recherches') {
      return 0
    } else if (t === 'Permis de recherches 1ere periode') {
      return 1
    } else if (t === 'Permis de recherches 2e periode') {
      return 2
    } else if (t === "Titres d'exploitation - concession") {
      return 1
    } else {
      return errMsg
    }
  })()

  let phaseDate = _.replace(geojsonFeature.properties.DATE_JO_RF, /\//g, '-')

  if (phaseDate === '') {
    phaseDate = '1900-01-01'
  }

  const titulaires = ['1', '2', '3']
    .filter(id => geojsonFeature.properties[`TIT_PET${id}`])
    .map(i => ({
      id: slugify(geojsonFeature.properties[`TIT_PET${i}`].slice(0, 24)),
      nom: _.startCase(_.toLower(geojsonFeature.properties[`TIT_PET${i}`]))
    }))

  return {
    titres: {
      id: titreId,
      nom: titreNom,
      typeId,
      domaineId,
      statutId: 'val',
      police: true,
      references: {
        metier: geojsonFeature.properties.NUMERO
      }
    },
    'titres-substances-principales': [null],
    'titres-phases': {
      id: titrePhaseId,
      phaseId,
      titreId,
      date: phaseDate,
      duree:
        (geojsonFeature.properties.DATE2
          ? Number(spliceString(geojsonFeature.properties.DATE2, 4, 6))
          : Number(spliceString(geojsonFeature.properties.DATE1, 4, 6))) -
        Number(spliceString(phaseDate, 4, 6)),
      surface: geojsonFeature.properties.SUPERFICIE,
      position: phasePosition
    },
    'titres-phases-emprises': {
      titrePhaseId,
      empriseId: 'ter'
    },
    'titres-geo-points': geojsonFeature.geometry.coordinates.reduce(
      (res, shape, i) => [
        ...res,
        ...shape.reduce(
          (r, set, n) => [
            ...r,
            {
              id: slugify(`${titrePhaseId}-contour-${i}-${n}`),
              coordonees: set.join(),
              groupe: `contour-${i}`,
              titrePhaseId,
              position: n,
              nom: String(n)
            }
          ],
          []
        )
      ],
      []
    ),
    titulaires,
    'titres-titulaires': titulaires.map(t => ({ titulaireId: t.id, titreId }))
  }
}

module.exports = jsonFormat
