const _ = require('lodash')
const chalk = require('chalk')
const slugify = require('@sindresorhus/slugify')
const spliceString = require('splice-string')
const { pointsCreate } = require('../../_utils')

const substances = require('../../sources/substances-rntm-camino.json')
const errMsg = '--------------------------------> ERROR'

const domaineGet = subs => {
  subs
}

const jsonFormat = geojsonFeature => {
  const domaineId = ''

  const props = geojsonFeature.properties

  const t = props.type

  const typeId = (() => {
    switch (t) {
      case 'PER':
        return 'prx'
      case 'Concession':
        return 'cxx'
      case 'axm':
        return 'axm'
      case 'PEX':
        return 'pxm'
      default:
        return errMsg
    }
  })(props.type)

  // console.log(props)

  const titreNom = _.startCase(_.toLower(props.nomtitre))

  const demarcheEtapeDate = _.replace(props.date_oct, /\//g, '-')

  const demarcheEtapeDateFin = _.replace(props.dateperemp, /\//g, '-')

  const duree =
    Number(spliceString(demarcheEtapeDateFin, 4, 9)) -
      Number(spliceString(demarcheEtapeDate, 4, 9)) || 0

  if (demarcheEtapeDate === '') {
    console.log(
      chalk.red.bold(`Erreur: date manquante ${titreNom}`),
      geojsonFeature
    )
  }

  const dateId = demarcheEtapeDate.slice(0, 4)

  const titreId = slugify(`${domaineId}-${typeId}-${titreNom}-${dateId}`)

  const demarcheId = `oct`

  const titreDemarcheId = `${titreId}-${demarcheId}01`

  // L'étape des AEX est DEX (décision expresse)
  // L'étape des autres types est DPU (JORF)
  const etapeId = typeId === 'axm' ? 'dex' : 'dpu'

  const titreEtapeId = `${titreDemarcheId}-${etapeId}01`

  const demarchePosition = (() => {
    return 1
  })()

  const titulaire = props.titulaire
  const entreprises = [
    {
      id: props.entreprise_id,
      nom: _.startCase(_.toLower(titulaire))
    }
  ]

  const substancesCreate = subs =>
    subs.reduce((res, cur) => {
      cur = cur.toLowerCase()
      console.log({ cur })

      const sub = substances.find(
        s =>
          (s['nom'] && s['nom'] === cur) ||
          (s['symbole'] && s['symbole'] === cur) ||
          (s['alias'] && s['alias'].find(a => a === cur)) ||
          (cur.includes('connexes') && 'oooo')
      )

      if (!sub) {
        console.log(chalk.red.bold(`Erreur: substance ${cur} non identifée`))

        throw new Error('substance')
      }

      return cur && sub
        ? [
            ...res,
            {
              titreEtapeId,
              substanceId: sub.id
            }
          ]
        : res
    }, [])

  const substancePrincipales = (() => {
    const substances = props.subst_1
    const s = substances
      ? substancesCreate(substances.replace(/, /g, ',').split(','))
      : []
    return s
  })()

  const substanceConnexes = (() => {
    const substances = props.subst_2
    return substances
      ? substancesCreate(substances.replace(/, /g, ',').split(','))
      : []
  })()

  return {
    titres: {
      id: titreId,
      nom: titreNom,
      typeId,
      domaineId,
      statutId: 'ind',
      references: props.idtm
        ? {
            métier: props.idtm
          }
        : null
    },
    titresSubstances: [...substancePrincipales, ...substanceConnexes],
    titresDemarches: [
      {
        id: titreDemarcheId,
        typeId: demarcheId,
        titreId,
        statutId: 'ind',
        ordre: demarchePosition
      }
    ],
    titresEtapes: [
      {
        id: titreEtapeId,
        titreDemarcheId: titreDemarcheId,
        typeId: etapeId,
        statutId: 'acc',
        ordre: 1,
        date: demarcheEtapeDate,
        duree,
        dateFin: demarcheEtapeDateFin,
        surface: props.surf_off || 0
      }
    ],
    titresEmprises: {
      titreEtapeId,
      empriseId: 'ter'
    },
    titresPoints: geojsonFeature.geometry.coordinates.reduce(
      (res, points, contourId) => [
        ...res,
        ...pointsCreate(titreEtapeId, points, contourId, 0)
      ],
      []
    ),
    entreprises,
    titresTitulaires: entreprises.map(t => ({
      entrepriseId: t.id,
      titreEtapeId
    }))
  }
}

module.exports = jsonFormat
