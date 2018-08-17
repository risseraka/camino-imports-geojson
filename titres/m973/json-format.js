const _ = require('lodash')
const chalk = require('chalk')
const slugify = require('@sindresorhus/slugify')
const spliceString = require('splice-string')
const { pointsCreate } = require('../../_utils')

const substances = require('../../sources/substances.json')
const errMsg = '--------------------------------> ERROR'

const jsonFormat = geojsonFeature => {
  const domaineId = 'm'
  const t = geojsonFeature.properties.type
  const typeId = (() => {
    if (t === 'PER') {
      return 'prx'
    } else if (t === 'Concession') {
      return 'cxx'
    } else if (t === 'axm') {
      return 'axm'
    } else if (t === 'PEX') {
      return 'pxm'
    } else {
      return errMsg
    }
  })()

  const titreNom = _.startCase(_.toLower(geojsonFeature.properties.nomtitre))

  const demarcheEtapeDate = _.replace(
    geojsonFeature.properties.date_oct,
    /\//g,
    '-'
  )

  const demarcheEtapeDateFin = _.replace(
    geojsonFeature.properties.dateperemp,
    /\//g,
    '-'
  )

  const duree =
    Number(spliceString(demarcheEtapeDateFin, 4, 9)) -
      Number(spliceString(demarcheEtapeDate, 4, 9)) || 0

  if (demarcheEtapeDate === '') {
    console.log(chalk.red.bold(`Erreur: date manquante ${titreNom}`))
  }

  const dateId = demarcheEtapeDate.slice(0, 4)

  const titreId = slugify(`${domaineId}-${typeId}-${titreNom}-${dateId}`)

  const demarcheId = `${typeId}-oct`

  const titreDemarcheId = slugify(
    `${domaineId}-${demarcheId}-${titreNom}-${dateId}`
  )

  const titreDemarcheEtapeId = `${titreDemarcheId}-dpu`

  const demarchePosition = (() => {
    return 1
  })()

  const entreprises = [
    {
      id: slugify(geojsonFeature.properties['titulaire'].slice(0, 32)),
      nom: _.startCase(_.toLower(geojsonFeature.properties['titulaire']))
    }
  ]

  const substancesCreate = subs =>
    subs.reduce((res, cur) => {
      const sub = substances.find(
        s =>
          (s['symbole'] && s['symbole'] === cur) ||
          (cur.includes('connexes') && 'oooo')
      )
      if (!sub) {
        console.log(chalk.red.bold(`Erreur: substance ${cur} non identifé`))
      }

      return cur && sub
        ? [
            ...res,
            {
              titreDemarcheEtapeId,
              substanceId: sub.id
            }
          ]
        : res
    }, [])

  const substancePrincipales = (() => {
    const substances = geojsonFeature.properties['subst_1']
    const s = substances ? substancesCreate(substances.split(', ')) : []
    return s
  })()

  const substanceConnexes = (() => {
    const substances = geojsonFeature.properties['subst_2']
    return substances ? substancesCreate(substances.split(', ')) : []
  })()

  return {
    titres: {
      id: titreId,
      nom: titreNom,
      typeId,
      domaineId,
      references: geojsonFeature.properties.CODE
        ? {
            métier: geojsonFeature.properties.CODE
          }
        : null
    },
    titresSubstances: geojsonFeature.properties['subst_2']
      ? [...substancePrincipales, ...substanceConnexes]
      : substancePrincipales,
    titresDemarches: {
      id: titreDemarcheId,
      demarcheId,
      titreId,
      ordre: demarchePosition
    },
    titresDemarchesEtapes: {
      id: titreDemarcheEtapeId,
      titreDemarcheId: titreDemarcheId,
      etapeId: 'dpu',
      etapeStatutId: 'ter',
      ordre: 1,
      date: demarcheEtapeDate,
      duree,
      surface: geojsonFeature.properties.surf_sig || 0
    },
    titresEmprises: {
      titreDemarcheEtapeId,
      empriseId: 'ter'
    },
    titresPoints: geojsonFeature.geometry.coordinates.reduce(
      (res, points, contourId) => [
        ...res,
        ...pointsCreate(titreDemarcheEtapeId, points, contourId, 0)
      ],
      []
    ),
    entreprises,
    titresTitulaires: entreprises.map(t => ({
      entrepriseId: t.id,
      titreDemarcheEtapeId
    }))
  }
}

module.exports = jsonFormat
