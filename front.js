const frontBuild = require('./_front/build')

console.log('Args:', process.argv)
frontBuild(process.argv[2])
