const _ = require('lodash')
const chalk = require('chalk')
const slugify = require('@sindresorhus/slugify')
const leftPad = require('left-pad')
const spliceString = require('splice-string')
const substances = require('../../_sources/substances.json')
const { pointsCreate } = require('../../_utils')
const errMsg = '--------------------------------> ERROR'

const jsonFormat = geojsonFeature => {
  const domaineId = 's'
  const t = _.toLower(geojsonFeature.properties.LEGENDE)
  const typeId = (() => {
    if (t === 'concession') {
      return 'cxx'
    } else {
      return errMsg
    }
  })()

  const titreNom = _.startCase(_.toLower(geojsonFeature.properties.NOM))

  const phaseDate =
    _.replace(geojsonFeature.properties.DATE_DECRE, /\//g, '-') || '2000-01-01'

  if (phaseDate === '') {
    console.log(chalk.red.bold(`Erreur: date manquante ${titreNom}`))
  }

  const dateId = phaseDate.slice(0, 4)

  const titreId = slugify(`${domaineId}-${typeId}-${titreNom}-${dateId}`)

  const phaseId = (() => {
    if (t === 'concession') {
      return 'cxx-oct'
    } else {
      return errMsg
    }
  })()

  const titrePhaseId = slugify(`${domaineId}-${phaseId}-${titreNom}-${dateId}`)

  const phasePosition = (() => {
    if (t === 'concession') {
      return 1
    } else {
      return errMsg
    }
  })()

  const phaseDuree =
    Number(spliceString(geojsonFeature.properties.VALIDITE, 4, 6)) -
    Number(spliceString(geojsonFeature.properties.DECRET_JO, 4, 6))

  const titulaires = [
    {
      id: slugify(geojsonFeature.properties['EXPLOITANT'].slice(0, 32)),
      nom: _.startCase(_.toLower(geojsonFeature.properties['EXPLOITANT']))
    }
  ]

  const substancePrincipales = (() =>
    geojsonFeature.properties['CONTENU']
      ? geojsonFeature.properties['CONTENU'].split('/').reduce((res, cur) => {
          const sub = substances.find(s => s['nom'] === cur)
          if (!sub) {
            console.log(chalk.red.bold(`Erreur: substance ${cur} non identifé`))
          }
          return sub
            ? [
                ...res,
                {
                  titreId,
                  substanceId: sub.id
                }
              ]
            : res
        }, [])
      : [])()

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
    'titres-substances-principales': substancePrincipales,
    'titres-substances-connexes': [],
    'titres-phases': {
      id: titrePhaseId,
      phaseId,
      titreId,
      date: phaseDate,
      duree: phaseDuree,
      surface: geojsonFeature.properties.SUPERFICIE,
      position: phasePosition
    },
    'titres-phases-emprises': {
      titrePhaseId,
      empriseId: 'ter'
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
