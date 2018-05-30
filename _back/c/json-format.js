const _ = require('lodash')
const slugify = require('@sindresorhus/slugify')
const pointsCreate = require('../../_utils/points-create')

const errMsg = '--------------------------------> ERROR'

const jsonFormat = geojsonFeature => {
  const domaineId = 'c'
  const t = _.toLower(geojsonFeature.properties.type)
  const typeId = (() => {
    if (t === 'concession') {
      return 'cxx'
    } else if (t === 'permis exclusif de recherches') {
      return 'prx'
    } else {
      return errMsg
    }
  })()

  const titreNom = _.startCase(_.toLower(geojsonFeature.properties.nom))
  const titreId = slugify(`${domaineId}-${typeId}-${titreNom}`)

  const phaseId = (() => {
    if (t === 'concession') {
      return 'cxx-oct'
    } else if (t === 'permis exclusif de recherches') {
      return 'prx-oct'
    } else {
      return errMsg
    }
  })()

  const titrePhaseId = slugify(`${domaineId}-${phaseId}-${titreNom}`)

  const phasePosition = 1

  let phaseDate = geojsonFeature.properties.date

  if (phaseDate === '') {
    phaseDate = '2000-01-01'
  }

  const phaseDuree =
    geojsonFeature.properties['DUREE_A,C,10'] ||
    geojsonFeature.properties['DUREE_D,C,10']

  const titulaires = geojsonFeature.properties['titulaires']
    .split(' ; ')
    .map(t => ({
      id: slugify(t.slice(0, 32)),
      nom: _.startCase(_.toLower(t))
    }))

  const substancePrincipales = (() =>
    geojsonFeature.properties.substancesPrincipales.split(' ; ').reduce(
      (res, cur) => [
        ...res,
        {
          titreId,
          substanceId: cur
        }
      ],
      []
    ))()

  return {
    titres: {
      id: titreId,
      nom: titreNom,
      typeId,
      domaineId,
      statutId: geojsonFeature.properties.statut,
      police: true,
      references: {
        deb: geojsonFeature.properties['references:deb'],
        ifremer: geojsonFeature.properties['references:ifremer']
      }
    },
    'titres-substances-principales': substancePrincipales,
    'titres-substances-secondaires': [],
    'titres-phases': {
      id: titrePhaseId,
      phaseId,
      titreId,
      date: phaseDate,
      duree: phaseDuree,
      surface: geojsonFeature.properties['SURFACE,C,15'],
      position: phasePosition
    },
    'titres-phases-emprises': {
      titrePhaseId,
      empriseId: 'mer'
    },
    'titres-geo-points': geojsonFeature.geometry.coordinates.reduce(
      (res, contour, i) =>
        geojsonFeature.geometry.type === 'MultiPolygon'
          ? [
              ...res,
              ...contour.reduce(
                (ps, cont, n) => [
                  ...ps,
                  ...pointsCreate(titrePhaseId, cont, n, i)
                ],
                []
              )
            ]
          : [...res, ...pointsCreate(titrePhaseId, contour, 0, i)],
      []
    ),
    titulaires,
    'titres-titulaires': titulaires.map(t => ({ titulaireId: t.id, titreId }))
  }
}

module.exports = jsonFormat
