const _ = require('lodash')
const chalk = require('chalk')
const slugify = require('@sindresorhus/slugify')
const leftPad = require('left-pad')
const spliceString = require('splice-string')
const substances = require('../../_sources/substances.json')
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

  const pointsCreate = (polygon, i) =>
    polygon.reduce(
      (r, set, n) => [
        ...r,
        {
          id: slugify(
            `${titrePhaseId}-contour-${leftPad(i, 2, 0)}-${leftPad(n, 3, 0)}`
          ),
          coordonees: set.join(),
          groupe: `contour-${leftPad(i, 2, 0)}`,
          titrePhaseId,
          position: n,
          nom: String(n)
        }
      ],
      []
    )

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
