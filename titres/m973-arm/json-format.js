const _ = require('lodash')
const chalk = require('chalk')
const slugify = require('@sindresorhus/slugify')
const spliceString = require('splice-string')
// const gdal = require('gdal')
const { pointsCreate } = require('../../_utils')

const substances = require('../../sources/substances.json')
const errMsg = '--------------------------------> ERROR'

const capitalize = str =>
  str
    ? str
        .trim()
        .toLowerCase()
        .replace(/(^| )(\w)/g, s => s.toUpperCase())
    : ''

const toWGS = (system, [coord1, coord2]) => {
  // console.log({ coord1, coord2 })

  const point = new gdal.Point(coord1, coord2)
  const transformation = new gdal.CoordinateTransformation(
    gdal.SpatialReference.fromEPSG(system),
    gdal.SpatialReference.fromEPSG(4326)
  )
  point.transform(transformation)

  return [point.x, point.y]
}

const ptmgClean = (ptmg, onf) => {
  if (!ptmg) return ''

  let formatted = ptmg.trim()
  if (!formatted) return ''

  if (formatted.match(/^(PTMG-\d{4}-\d{3}|YN\d{2}|K\d{5})$/)) return formatted

  formatted = formatted.replace(/[^0-9]+/g, ' ').trim()

  if (formatted.match(/^\d{5}$/)) return `K${formatted}`

  formatted = formatted.match(/^\d{2,3}$/)
    ? `${onf.slice(2, 6)} ${formatted}`
    : formatted

  formatted = formatted.match(/^\d{2} \d{2,3}$/)
    ? `20${formatted.slice(0, 2)} ${formatted.slice(3)}`
    : formatted

  formatted = formatted.replace(/ /, '')
  formatted = (formatted.match(/(\d{6,7})$/) || [formatted]).shift()

  const annee = formatted.slice(0, 4)
  const num = formatted.slice(4)

  formatted = `PTMG-${annee}-${num.padStart(3, 0)}`

  const match = formatted.match(/^(PTMG-2\d{3}-\d{3}|YN\d{2}|K\d{5})$/)
  if (!match) {
    // console.warn(`Mauvais format de numéro PTMG : ${formatted} | ${ptmg}`)
    return ptmg
  }

  return formatted
}

const emptyObj = keys => keys.reduce((r, k) => ({ ...r, [k]: '' }), {})

const titreCreate = titre => ({
  id: '',
  nom: '',
  typeId: '',
  domaineId: '',
  statutId: 'ind',
  references: {},
  ...titre
})

const demarcheCreate = demarche => ({
  id: '',
  typeId: '',
  titreId: '',
  statutId: 'ind',
  ordre: 1,
  annulationTitreDemarcheId: '',
  ...demarche
})

const etapeCreate = etape => ({
  id: '',
  titreDemarcheId: '',
  typeId: '',
  statutId: '',
  ordre: '',
  date: '',
  dateDebut: '',
  duree: '',
  dateFin: '',
  surface: '',
  engagement: '',
  engagementDeviseId: '',
  contenu: '',
  ...etape
})

const titresNomsIndex = {}

const typeIdCorrespondance = {
  AEX: 'axm',
  ARM: 'arm',
  COM: 'cxx',
  PER: 'prx',
  PEX: 'pxm'
}

const avisCorrespondance = {
  AJOURNEE: 'ajo',
  FAVORABLE: 'fav',
  DEFAVORABLE: 'def',
  '': 'nfa',
  'NON RENSEIGNEE': 'nul'
}

const jsonFormat = geojsonFeature => {
  const domaineId = 'm'

  const props = geojsonFeature.properties

  // console.log(props)

  let {
    type_dossier: type,
    winref_onf: onf,
    num_titre: ptmg,
    demandeur,
    secteur,
    nomsecteur,
    nomdemande,
    foret_nom: foret,
    date_arrivee_onf: dateMdp,
    date_deci_onf_rec: dateMcr,
    agent_rec: agentRecevabilite,
    date_avis_expert_onf: dateEof,
    agent_expert_onf: agentExpertise,
    date_decision_onf: dateAof,
    date_commission: dateAca,
    date_cotam: dateSco,
    date_prolongation_arm: datePro,
    finconvent: finConv,
    date_fin_conv: dateFinConv,
    date_retrait: dateRetrait
  } = props

  const typeId = typeIdCorrespondance[type]

  ptmg = ptmgClean(ptmg, onf)

  let dateFin = finConv || dateFinConv
  dateFin = _.replace(dateFin, /\//g, '-')

  const octroiDate = _.replace(dateSco || dateMdp || dateFin, /\//g, '-')

  let titreNom = _.startCase(
    _.toLower(`${secteur || nomsecteur || demandeur || nomdemande}`)
  )

  if (octroiDate === '') {
    console.log(
      chalk.red.bold(`Erreur: date d'octroi manquante ${titreNom}`),
      geojsonFeature
    )
  }

  const dateId = octroiDate.slice(0, 4)

  const nomKey = `${titreNom}${dateId}`
  if (titresNomsIndex[nomKey]) {
    const titreNomOld = titreNom

    const ordre = titresNomsIndex[nomKey].length + 1

    titreNom = `${titreNom} (${ordre})`

    titresNomsIndex[nomKey].push(titreNom)
  } else {
    titresNomsIndex[nomKey] = [titreNom]
  }

  const titreId = slugify(`${domaineId}-${typeId}-${titreNom}-${dateId}`)

  const references = {}

  if (onf) {
    references.ONF = onf
  }

  if (ptmg) {
    references.PTMG = ptmg
  }

  const titre = titreCreate({
    id: titreId,
    nom: titreNom,
    typeId,
    domaineId,
    references: Object.keys(references).length ? references : {}
  })

  const demarcheId = `oct`

  const titreDemarcheId = `${titreId}-${demarcheId}01`

  const titresDemarches = [
    demarcheCreate({
      id: titreDemarcheId,
      typeId: demarcheId,
      titreId
    })
  ]

  const { surface_demandee, surfacedem } = props

  const surf = surface_demandee || surfacedem || 0

  const surface = surf > 3 ? Math.round(surf / 100) : surf

  const titresEtapes = []
  const titresEtapesPoints = []

  let ordre = 0

  if (dateMdp) {
    const typeId = 'mdp'

    const id = `${titreDemarcheId}-${typeId}01`

    const date = _.replace(dateMdp, /\//g, '-')

    let contenu
    if (foret) {
      contenu = { onf: { foret } }
    }

    titresEtapes.push(
      etapeCreate({
        id,
        titreDemarcheId,
        typeId,
        statutId: 'acc',
        ordre: (ordre += 1),
        date,
        surface,
        contenu
      })
    )

    titresEtapesPoints.push(id)
  }

  if (dateMcr) {
    const typeId = 'mcr'

    const id = `${titreDemarcheId}-${typeId}01`

    const date = _.replace(dateMcr, /\//g, '-')

    let contenu
    if (agentRecevabilite) {
      contenu = { onf: { agent: agentRecevabilite } }
    }

    const avis = props.avis_onf_rec || ''

    titresEtapes.push(
      etapeCreate({
        id,
        titreDemarcheId,
        typeId,
        statutId: avisCorrespondance[avis],
        ordre: (ordre += 1),
        date,
        contenu
      })
    )
  }

  if (dateEof) {
    const typeId = 'eof'

    const id = `${titreDemarcheId}-${typeId}01`

    const date = _.replace(dateEof, /\//g, '-')

    const avis = props.avis_expert_onf || ''

    let contenu
    if (agentExpertise) {
      contenu = { onf: { expert: agentExpertise } }
    }

    titresEtapes.push(
      etapeCreate({
        id,
        titreDemarcheId,
        typeId,
        statutId: avisCorrespondance[avis],
        ordre: (ordre += 1),
        date,
        contenu
      })
    )
  }

  if (dateAof) {
    const typeId = 'aof'

    const id = `${titreDemarcheId}-${typeId}01`

    const date = _.replace(dateAof, /\//g, '-')

    const avis = props.avis_expertise || ''

    titresEtapes.push(
      etapeCreate({
        id,
        titreDemarcheId,
        typeId,
        statutId: avisCorrespondance[avis],
        ordre: (ordre += 1),
        date
      })
    )
  }

  if (dateAca) {
    const typeId = 'aca'

    const id = `${titreDemarcheId}-${typeId}01`

    const date = _.replace(dateAca, /\//g, '-')

    const avis = props.avis_commission || ''

    const statutId = avis ? avisCorrespondance[avis] : 'nfa'

    titresEtapes.push(
      etapeCreate({
        id,
        titreDemarcheId,
        typeId,
        statutId,
        ordre: (ordre += 1),
        date,
        surface
      })
    )
  }

  if (dateRetrait) {
    const typeId = 'ret'

    const id = `${titreDemarcheId}-${typeId}01`

    const date = _.replace(dateRetrait, /\//g, '-')

    const statutId = 'fai'

    titresEtapes.push(
      etapeCreate({
        id,
        titreDemarcheId,
        typeId,
        statutId,
        ordre: (ordre += 1),
        date
      })
    )
  }

  if (dateSco) {
    const typeId = 'sco'

    const id = `${titreDemarcheId}-${typeId}01`

    const date = _.replace(dateSco, /\//g, '-')

    const statutId = 'acc'

    const duree = 4

    titresEtapes.push(
      etapeCreate({
        id,
        titreDemarcheId,
        typeId,
        statutId,
        ordre: (ordre += 1),
        date,
        duree,
        dateFin,
        surface
      })
    )

    titresEtapesPoints.push(id)
  }

  if (datePro) {
    const demarcheId = `prr`

    const titreDemarcheId = `${titreId}-${demarcheId}01`

    titresDemarches.push(
      demarcheCreate({
        id: titreDemarcheId,
        typeId: demarcheId,
        titreId
      })
    )

    const typeId = 'def'

    const id = `${titreDemarcheId}-${typeId}01`

    const date = _.replace(datePro, /\//g, '-')

    const statutId = 'acc'

    const duree = 4

    titresEtapes.push(
      etapeCreate({
        id,
        titreDemarcheId,
        typeId,
        statutId,
        ordre: 1,
        date,
        duree
      })
    )
  }

  const { demandeur_id: entrepriseId, demandeur_nom: demandeurNom } = props
  const entreprises = [
    {
      id: entrepriseId,
      nom: capitalize(demandeurNom)
    }
  ]

  let titresPoints = []
  let titresPointsReferences = []

  const system = 2972

  const transformPoints = (
    titreEtapeId,
    contour,
    contourId,
    groupeId,
    reference
  ) => {
    console.log(contour, reference)

    const points = pointsCreate(titreEtapeId, contour, contourId, groupeId)

    titresPoints = [...titresPoints, ...points]

    const references = points.map((point, i) => {
      const coords = reference[i].join(',')

      return {
        id: `${point.id}-${system}`,
        titrePointId: point.id,
        geoSystemeId: system,
        coordonnees: coords
      }
    })

    titresPointsReferences = [...titresPointsReferences, ...references]
  }

  const polygon = JSON.parse(props.points)
  const polygonReferences = JSON.parse(props.references)

  const pointsBuild = titreEtapeId => {
    const titresPoints = polygon.coordinates.forEach(
      (contoursOrPoints, contourIdOrGroupId) =>
        polygon.type === 'MultiPolygon'
          ? contoursOrPoints.forEach((points, contourId) =>
              transformPoints(
                titreEtapeId,
                points,
                contourId,
                contourIdOrGroupId,
                polygonReferences.coordinates[contourIdOrGroupId][contourId]
              )
            )
          : transformPoints(
              titreEtapeId,
              contoursOrPoints,
              contourIdOrGroupId,
              0,
              polygonReferences.coordinates[contourIdOrGroupId]
            )
    )
  }

  const titresSubstances = titresEtapesPoints.map(titreEtapeId => ({
    titreEtapeId,
    substanceId: 'auru'
  }))

  titresEtapesPoints.forEach(pointsBuild)

  const titresTitulaires = titresEtapesPoints.reduce(
    (r, titreEtapeId) =>
      entreprises.reduce((r, { id: entreprise_id }) => {
        if (entreprise_id) {
          r.push({
            titreEtapeId,
            entreprise_id
          })
        }
        return r
      }, r),
    []
  )

  return {
    titres: titre,
    titresDemarches,
    titresDemarchesLiens: emptyObj([
      'parent_titre_demarche_id',
      'enfant_titre_demarche_id'
    ]),
    titresPhases: emptyObj([
      'titre_demarche_id',
      'statut_id',
      'date_debut',
      'date_fin'
    ]),
    titresEtapes,
    titresPoints,
    titresPointsReferences,
    titresDocuments: emptyObj([
      'id',
      'titre_etape_id',
      'type',
      'jorf',
      'nor',
      'url',
      'uri',
      'nom',
      'fichier',
      'public'
    ]),
    titresSubstances,
    titresTitulaires,
    titresAmodiataires: emptyObj(['titre_etape_id', 'entreprise_id']),
    titresAdministrations: emptyObj(['titre_etape_id', 'administration_id']),
    titresUtilisateurs: emptyObj(['titre_etape_id', 'utilisateur_id']),
    titresEmprises: emptyObj(['titre_etape_id', 'emprise_id']),
    titresIncertitudes: emptyObj([
      'titre_etape_id',
      'date',
      'date_debut',
      'date_fin',
      'duree',
      'surface',
      'points',
      'substances',
      'titulaires',
      'amodiataires',
      'administrations'
    ]),
    entreprises
  }
}

module.exports = jsonFormat
