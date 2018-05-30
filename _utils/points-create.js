const leftPad = require('left-pad')
const slugify = require('@sindresorhus/slugify')

const pointsCreate = (titrePhaseId, contour, groupeId, contourId) =>
  contour.reduce(
    (r, set, pointId) => [
      ...r,
      {
        id: slugify(
          `${titrePhaseId}-g${leftPad(groupeId, 2, 0)}-c${leftPad(
            contourId,
            2,
            0
          )}-p${leftPad(pointId, 3, 0)}`
        ),
        coordonees: set.join(),
        groupe: groupeId,
        contour: contourId,
        point: pointId,
        titrePhaseId,
        nom: String(pointId)
      }
    ],
    []
  )

module.exports = pointsCreate
