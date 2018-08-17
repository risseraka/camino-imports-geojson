const _ = require('lodash')
const chalk = require('chalk')
const slugify = require('@sindresorhus/slugify')
const { pointsCreate } = require('../../_utils')

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

  const demarcheEtapeDate = geojsonFeature.properties.date || '2000-01-01'

  if (demarcheEtapeDate === '') {
    console.log(chalk.red.bold(`Erreur: date manquante ${titreNom}`))
  }

  const dateId = demarcheEtapeDate.slice(0, 4)

  const titreId = slugify(`${domaineId}-${typeId}-${titreNom}-${dateId}`)

  const demarcheId = (() => {
    if (t === 'concession') {
      return 'cxx-oct'
    } else if (t === 'permis exclusif de recherches') {
      return 'prx-oct'
    } else {
      return errMsg
    }
  })()

  const titreDemarcheId = slugify(
    `${domaineId}-${demarcheId}-${titreNom}-${dateId}`
  )

  const titreDemarcheEtapeId = `${titreDemarcheId}-dpu`

  const demarcheOrdre = 1

  const duree =
    geojsonFeature.properties['DUREE_A,C,10'] ||
    geojsonFeature.properties['DUREE_D,C,10']

  const entreprises = geojsonFeature.properties['titulaires']
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
          titreDemarcheEtapeId,
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
      references: {
        deb: geojsonFeature.properties['references:deb'],
        ifremer: geojsonFeature.properties['references:ifremer']
      }
    },
    titresSubstances: substancePrincipales,
    titresDemarches: {
      id: titreDemarcheId,
      demarcheId,
      titreId,
      position: demarcheOrdre
    },
    titresDemarchesEtapes: {
      id: titreDemarcheEtapeId,
      titreDemarcheId,
      etapeId: 'dpu',
      etapeStatutId: 'ter',
      date: demarcheEtapeDate,
      duree,
      surface: geojsonFeature.properties['SURFACE,C,15']
    },
    titresEmprises: {
      titreDemarcheEtapeId,
      empriseId: 'mer'
    },
    titresPoints: geojsonFeature.geometry.coordinates.reduce(
      (res, contoursOrPoints, contourIdOrGroupId) =>
        geojsonFeature.geometry.type === 'MultiPolygon'
          ? [
              ...res,
              ...contoursOrPoints.reduce(
                (ps, points, contourId) => [
                  ...ps,
                  ...pointsCreate(
                    titreDemarcheEtapeId,
                    points,
                    contourId,
                    // groupId
                    contourIdOrGroupId
                  )
                ],
                []
              )
            ]
          : [
              ...res,
              ...pointsCreate(
                titreDemarcheEtapeId,
                contoursOrPoints,
                contourIdOrGroupId,
                0
              )
            ],
      []
    ),
    entreprises,
    titresTitulaires: entreprises.map(t => ({ titulaireId: t.id, titreId }))
  }
}

module.exports = jsonFormat
