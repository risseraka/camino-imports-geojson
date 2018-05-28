const _ = require('lodash')
const slugify = require('@sindresorhus/slugify')
const spliceString = require('splice-string')
const fileCreate = require('../../_file-create')
const errMsg = '--------------------------------> ERROR'

// const substances = () => {}

const transform = f => {
  const t = _.capitalize(_.toLower(f.properties.TYPE_FR))
  const typeId = (() => {
    if (
      t === 'Demande de permis de recherches' ||
      t === 'Permis de recherches 1ere periode' ||
      t === 'Permis de recherches 2e periode'
    ) {
      return 'prx'
    } else if (t === "Titres d'exploitation - concession") {
      return 'cxx'
    } else {
      return errMsg
    }
  })()

  const titreNom = _.startCase(_.toLower(f.properties.NOM))
  const titreId = slugify(`${typeId}-${titreNom}`)

  const phaseId = (() => {
    if (t === 'Demande de permis de recherches') {
      return 'prx-oct'
    } else if (t === 'Permis de recherches 1ere periode') {
      return 'prx-pr1'
    } else if (t === 'Permis de recherches 2e periode') {
      return 'prx-pr2'
    } else if (t === "Titres d'exploitation - concession") {
      return 'cxx-oct'
    } else {
      return errMsg
    }
  })()

  const titrePhaseId = slugify(`${phaseId}-${titreNom}`)

  const phasePosition = (() => {
    if (t === 'Demande de permis de recherches') {
      return 1
    } else if (t === 'Permis de recherches 1ere periode') {
      return 2
    } else if (t === 'Permis de recherches 2e periode') {
      return 3
    } else if (t === "Titres d'exploitation - concession") {
      return 1
    } else {
      return errMsg
    }
  })()

  let phaseDate = _.replace(f.properties.DATE_JO_RF, /\//g, '-')

  if (phaseDate === '') {
    phaseDate = '1900-01-01'
  }

  const titulaires = ['1', '2', '3']
    .filter(id => f.properties[`TIT_PET${id}`])
    .map(i => ({
      id: slugify(f.properties[`TIT_PET${i}`]),
      nom: _.startCase(_.toLower(f.properties[`TIT_PET${i}`]))
    }))

  return {
    titres: {
      id: titreId,
      nom: titreNom,
      typeId,
      domaineId: 'g',
      statutId: 'val',
      police: true,
      references: {
        metier: f.properties.NUMERO
      }
    },
    'titres-substances-principales': {
      titreId,
      substanceId: 'htmp'
    },
    'titres-phases': {
      id: titrePhaseId,
      phaseId,
      titreId,
      date: phaseDate,
      duree:
        (f.properties.DATE2
          ? Number(spliceString(f.properties.DATE2, 4, 6))
          : Number(spliceString(f.properties.DATE1, 4, 6))) -
        Number(spliceString(phaseDate, 4, 6)),
      surface: f.properties.SUPERFICIE,
      position: phasePosition
    },
    'titres-phases-emprises': {
      titrePhaseId,
      empriseId: 'ter'
    },
    'titres-geo-points': f.geometry.coordinates.reduce(
      (res, shape, i) => [
        ...res,
        ...shape.reduce(
          (r, set, n) => [
            ...r,
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
      ],
      []
    ),
    titulaires,
    'titres-titulaires': titulaires.map(t => ({ titulaireId: t.id, titreId }))
  }
}

const objectCreate = (tmpJson, type, table) => {
  const json = tmpJson.map(n => n[table])
  const fileContent = JSON.stringify(json, null, 2)
  const fileName = `_exports/back/${type}-${table}.json`

  fileCreate(fileName, fileContent)
}

const arrayCreate = (tmpJson, type, table) => {
  let json = tmpJson
    .map(n => n[table])
    .reduce(
      (res, arr) => [
        ...res,
        ...arr.filter(eNew => !res.find(e => eNew.id && eNew.id === e.id))
      ],
      []
    )
  const fileContent = JSON.stringify(json, null, 2)
  const fileName = `_exports/back/${type}-${table}.json`

  fileCreate(fileName, fileContent)
}

module.exports = (sourceJson, type) => {
  const tmpJson = sourceJson.features.map(f => transform(f))
  objectCreate(tmpJson, type, 'titres')
  objectCreate(tmpJson, type, 'titres-substances-principales')
  objectCreate(tmpJson, type, 'titres-phases')
  objectCreate(tmpJson, type, 'titres-phases-emprises')
  arrayCreate(tmpJson, type, 'titres-geo-points')
  arrayCreate(tmpJson, type, 'titulaires')
  arrayCreate(tmpJson, type, 'titres-titulaires')
}
