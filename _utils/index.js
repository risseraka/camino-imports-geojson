const leftPad = require('left-pad')
const slugify = require('@sindresorhus/slugify')

const pointsCreate = (titreDemarcheEtapeId, contour, contourId, groupeId) =>
  contour.reduce(
    (r, set, pointId) => [
      ...r,
      {
        id: slugify(
          `${titreDemarcheEtapeId}-g${leftPad(groupeId + 1, 2, 0)}-c${leftPad(
            contourId + 1,
            2,
            0
          )}-p${leftPad(pointId + 1, 3, 0)}`
        ),
        coordonees: set.join(),
        groupe: groupeId + 1,
        contour: contourId + 1,
        point: pointId + 1,
        titreDemarcheEtapeId,
        nom: String(pointId + 1)
      }
    ],
    []
  )

module.exports = { pointsCreate }
