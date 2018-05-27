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
      date: _.replace(f.properties.DATE_JO_RF, /\//g, '-'),
      duree:
        (f.properties.DATE2
          ? Number(spliceString(f.properties.DATE2, 4, 6))
          : Number(spliceString(f.properties.DATE1, 4, 6))) -
        Number(spliceString(f.properties.DATE_JO_RF, 4, 6)),
      surface: f.properties.SUPERFICIE,
      position: phasePosition
    },
    'titres-phases-emprises': {
      titrePhaseId,
      empriseId: 'ter'
    }
  }
}

const jsonCreate = (tmpJson, type, table) => {
  const json = tmpJson.map(n => n[table])
  const fileContent = JSON.stringify(json, null, 2)
  const fileName = `_exports/back/${type}-${table}.json`

  fileCreate(fileName, fileContent)
}

module.exports = (sourceJson, type) => {
  const tmpJson = sourceJson.features.map(f => transform(f))
  jsonCreate(tmpJson, type, 'titres')
  jsonCreate(tmpJson, type, 'titres-substances-principales')
  jsonCreate(tmpJson, type, 'titres-phases')
  jsonCreate(tmpJson, type, 'titres-phases-emprises')
}
