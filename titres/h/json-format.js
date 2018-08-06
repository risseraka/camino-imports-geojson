const _ = require('lodash')
const chalk = require('chalk')
const slugify = require('@sindresorhus/slugify')
const spliceString = require('splice-string')
const { pointsCreate } = require('../../_utils')
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

  const demarcheEtapeDate =
    _.replace(geojsonFeature.properties.DATE_JO_RF, /\//g, '-') || ''

  if (demarcheEtapeDate === '') {
    console.log(chalk.red.bold(`Erreur: date manquante ${titreNom}`))
  }

  const dateId = demarcheEtapeDate.slice(0, 4)

  const titreId = slugify(`${domaineId}-${typeId}-${titreNom}-${dateId}`)

  const demarcheId = (() => {
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

  const titreDemarcheId = slugify(
    `${domaineId}-${demarcheId}-${titreNom}-${dateId}`
  )

  const titreDemarcheEtapeId = `${titreDemarcheId}-dpu`

  const demarchePosition = (() => {
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

  const entreprises = ['1', '2', '3', '4', '5', '6']
    .filter(id => geojsonFeature.properties[`TIT_PET${id}`])
    .map(i => ({
      id: slugify(geojsonFeature.properties[`TIT_PET${i}`].slice(0, 32)),
      nom: _.startCase(_.toLower(geojsonFeature.properties[`TIT_PET${i}`]))
    }))

  return {
    titres: {
      id: titreId,
      nom: titreNom,
      typeId,
      domaineId,
      references: {
        métier: geojsonFeature.properties.NUMERO
      }
    },
    titresSubstances: [
      {
        titreDemarcheEtapeId,
        substanceId: 'hydr'
      }
    ],
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
      duree:
        (geojsonFeature.properties.DATE3
          ? Number(spliceString(geojsonFeature.properties.DATE3, 4, 6))
          : Number(spliceString(geojsonFeature.properties.DATE2, 4, 6))) -
        Number(spliceString(demarcheEtapeDate, 4, 6)),
      surface: geojsonFeature.properties.SUPERFICIE,
      points: true,
      substances: true,
      titulaires: true
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
      entrepriseId: t.id,
      titreDemarcheEtapeId
    }))
  }
}

module.exports = jsonFormat
