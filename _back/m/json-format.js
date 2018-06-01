const _ = require('lodash')
const chalk = require('chalk')
const slugify = require('@sindresorhus/slugify')
const leftPad = require('left-pad')
const spliceString = require('splice-string')
const { pointsCreate } = require('../../_utils')

const substances = require('../../sources/substances.json')
const errMsg = '--------------------------------> ERROR'

const jsonFormat = geojsonFeature => {
  const domaineId = 'm'
  const t = _.capitalize(_.toLower(geojsonFeature.properties.NATURE))
  const typeId = (() => {
    if (t === 'Permis exclusif de recherches') {
      return 'prx'
    } else if (t === 'Concession') {
      return 'cxx'
    } else {
      return errMsg
    }
  })()

  const titreNom = _.startCase(_.toLower(geojsonFeature.properties.NOM_TITRE))

  const phaseDate =
    _.replace(geojsonFeature.properties.DATE_DEB, /\//g, '-')
      .split('-')
      .reverse()
      .join('-') || '2000-01-01'

  if (phaseDate === '') {
    console.log(chalk.red.bold(`Erreur: date manquante ${titreNom}`))
  }

  const dateId = phaseDate.slice(0, 4)

  const titreId = slugify(`${domaineId}-${typeId}-${titreNom}-${dateId}`)

  const phaseId = (() => {
    if (t === 'Permis exclusif de recherches') {
      return 'prx-oct'
    } else if (t === 'Concession') {
      return 'cxx-oct'
    } else {
      return errMsg
    }
  })()

  const titrePhaseId = slugify(`${domaineId}-${phaseId}-${titreNom}-${dateId}`)

  const phasePosition = (() => {
    return 1
  })()

  const titulaires = [
    {
      id: slugify(geojsonFeature.properties['TITULAIRE'].slice(0, 32)),
      nom: _.startCase(_.toLower(geojsonFeature.properties['TITULAIRE']))
    }
  ]

  const substancePrincipales = (() =>
    _.replace(geojsonFeature.properties['SUBST_PRIN'], /,/g, '')
      .split(' ')
      .reduce((res, cur) => {
        const sub = substances.find(
          s =>
            (s['symbole'] && s['symbole'] === cur) ||
            (s['alias'] && s['alias'].find(a => a === cur.toLowerCase()))
        )
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
      }, []))()

  return {
    titres: {
      id: titreId,
      nom: titreNom,
      typeId,
      domaineId,
      statutId: 'val',
      police: true,
      references: geojsonFeature.properties.CODE
        ? {
            métier: geojsonFeature.properties.CODE
          }
        : null
    },
    'titres-substances-principales': substancePrincipales,
    'titres-substances-connexes': geojsonFeature.properties.SUBST_AUTR
      ? [{ titreId, substanceId: 'oooo' }]
      : [],
    'titres-phases': {
      id: titrePhaseId,
      phaseId,
      titreId,
      date: phaseDate,
      duree:
        Number(spliceString(geojsonFeature.properties.DATE_FIN, 1, 6)) -
          Number(spliceString(geojsonFeature.properties.DATE_DEB, 1, 6)) || 0,
      surface: geojsonFeature.properties.AREA,
      position: phasePosition
    },
    'titres-phases-emprises': {
      titrePhaseId,
      empriseId: 'ter'
    },
    'titres-geo-points': geojsonFeature.geometry.coordinates.reduce(
      (res, contour, i) => [
        ...res,
        ...pointsCreate(titrePhaseId, contour, 0, i)
      ],
      []
    ),
    titulaires,
    'titres-titulaires': titulaires.map(t => ({ titulaireId: t.id, titreId }))
  }
}

module.exports = jsonFormat
