const _ = require('lodash')
const spliceString = require('splice-string')
const substances = require('../../_sources/substances.json')

const substancesPrincipales = geoJson =>
  geoJson.features
    .map(
      geojsonFeature =>
        _.replace(geojsonFeature.properties['SUBST_PRIN'], /,/g, '').split(' ')
      // connexes: [geojsonFeature.properties.SUBST_AUTR]
    )
    .reduce(
      (res, cur) => [
        ...res,
        ...cur.filter(c => !res.find(e => e === c) && c !== '')
      ],
      []
    )
    .reduce((res, cur) => {
      const sub = substances.find(
        s =>
          s['symbole'] === cur || s['alias'].find(a => a === cur.toLowerCase())
      )
      if (!sub) {
        console.log(`Erreur: substance ${cur} non identifé`)
      }
      return sub ? [...res, sub.id] : res
    }, [])

const substancesConnexes = geoJson =>
  geoJson.features.map(geojsonFeature => geojsonFeature.properties.SUBST_AUTR)

module.exports = geoJson => {
  // return substancesPrincipales(geoJson)
  return substancesConnexes(geoJson)
}
