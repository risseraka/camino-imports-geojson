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

  const phaseDate = _.replace(geojsonFeature.properties.date_oct, /\//g, '-')

  if (phaseDate === '') {
    console.log(chalk.red.bold(`Erreur: date manquante ${titreNom}`))
  }

  const dateId = phaseDate.slice(0, 4)

  const titreId = slugify(`${domaineId}-${typeId}-${titreNom}-${dateId}`)

  const phaseId = `${typeId}-oct`

  const titrePhaseId = slugify(`${domaineId}-${phaseId}-${titreNom}-${dateId}`)

  const phasePosition = (() => {
    return 1
  })()

  const titulaires = [
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
              titreId,
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
      statutId: 'val',
      police: true,
      references: geojsonFeature.properties.CODE
        ? {
            métier: geojsonFeature.properties.CODE
          }
        : null
    },
    'titres-substances-principales': substancePrincipales,
    'titres-substances-connexes': substanceConnexes,
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
