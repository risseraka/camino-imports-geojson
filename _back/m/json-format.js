const _ = require('lodash')
const slugify = require('@sindresorhus/slugify')
const spliceString = require('splice-string')

const substances = require('../../_sources/substances.json')
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
  const titreId = slugify(`${domaineId}-${typeId}-${titreNom}`)

  const phaseId = (() => {
    if (t === 'Permis exclusif de recherches') {
      return 'prx-oct'
    } else if (t === 'Concession') {
      return 'cxx-oct'
    } else {
      return errMsg
    }
  })()

  const titrePhaseId = slugify(`${domaineId}-${phaseId}-${titreNom}`)

  const phasePosition = (() => {
    return 1
  })()

  let phaseDate = _.replace(geojsonFeature.properties.DATE_DEB, /\//g, '-')
    .split('-')
    .reverse()
    .join('-')

  if (phaseDate === '') {
    phaseDate = '1900-01-01'
  }

  const titulaires = [
    {
      id: slugify(geojsonFeature.properties['TITULAIRE'].slice(0, 24)),
      nom: _.startCase(_.toLower(geojsonFeature.properties['TITULAIRE']))
    }
  ]

  const substancePrincipales = (() =>
    _.replace(geojsonFeature.properties['SUBST_PRIN'], /,/g, '')
      .split(' ')
      .reduce((res, cur) => {
        const sub = substances.find(
          s =>
            s['symbole'] === cur ||
            s['alias'].find(a => a === cur.toLowerCase())
        )
        if (!sub) {
          console.log(`Erreur: substance ${cur} non identifé`)
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

  const pointCreate = (polygon, i) =>
    polygon.reduce(
      (points, set, n) => [
        ...points,
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
            metier: geojsonFeature.properties.CODE
          }
        : null
    },
    'titres-substances-principales': substancePrincipales,
    'titres-substances-secondaires': geojsonFeature.properties.SUBST_AUTR
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
      (res, shape, i) => [...res, ...pointCreate(shape, i)],
      []
    ),
    titulaires,
    'titres-titulaires': titulaires.map(t => ({ titulaireId: t.id, titreId }))
  }
}

module.exports = jsonFormat