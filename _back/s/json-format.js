const _ = require('lodash')
const chalk = require('chalk')
const slugify = require('@sindresorhus/slugify')
const spliceString = require('splice-string')
const substances = require('../../sources/substances.json')
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

  const demarcheEtapeDate =
    _.replace(geojsonFeature.properties.DATE_DECRE, /\//g, '-') || '2000-01-01'

  if (demarcheEtapeDate === '') {
    console.log(chalk.red.bold(`Erreur: date manquante ${titreNom}`))
  }

  const dateId = demarcheEtapeDate.slice(0, 4)

  const titreId = slugify(`${domaineId}-${typeId}-${titreNom}-${dateId}`)

  const demarcheId = (() => {
    if (t === 'concession') {
      return 'cxx-oct'
    } else {
      return errMsg
    }
  })()

  const titreDemarcheId = slugify(
    `${domaineId}-${demarcheId}-${titreNom}-${dateId}`
  )

  const titreDemarcheEtapeId = `${titreDemarcheId}-dpu`

  const demarcheOrdre = (() => {
    if (t === 'concession') {
      return 1
    } else {
      return errMsg
    }
  })()

  const duree =
    Number(spliceString(geojsonFeature.properties.VALIDITE, 4, 6)) -
    Number(spliceString(geojsonFeature.properties.DECRET_JO, 4, 6))

  const entreprises = [
    {
      id: slugify(geojsonFeature.properties['EXPLOITANT'].slice(0, 32)),
      nom: _.startCase(_.toLower(geojsonFeature.properties['EXPLOITANT']))
    }
  ]

  const titresSubstances = (() =>
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
                  titreDemarcheEtapeId,
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
      references: {
        métier: geojsonFeature.properties.NUMERO
      }
    },
    titresSubstances,
    titresDemarches: {
      id: titreDemarcheId,
      demarcheId,
      titreId,
      ordre: demarcheOrdre
    },
    titresDemarchesEtapes: {
      id: titreDemarcheEtapeId,
      titreDemarcheId,
      etapeId: 'dpu',
      etapeStatutId: 'ter',
      date: demarcheEtapeDate,
      duree,
      surface: geojsonFeature.properties.SUPERFICIE
    },
    titresEmprises: {
      titreDemarcheEtapeId,
      empriseId: 'ter'
    },
    titresPoints: geojsonFeature.geometry.coordinates.reduce(
      (res, contour, i) =>
        geojsonFeature.geometry.type === 'MultiPolygon'
          ? [
              ...res,
              ...contour.reduce(
                (ps, cont, n) => [
                  ...ps,
                  ...pointsCreate(titreDemarcheEtapeId, cont, n, i)
                ],
                []
              )
            ]
          : [...res, ...pointsCreate(titreDemarcheEtapeId, contour, 0, i)],
      []
    ),
    entreprises,
    titresTitulaires: entreprises.map(t => ({
      titulaireId: t.id,
      titreDemarcheEtapeId
    }))
  }
}

module.exports = jsonFormat
