const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const babel = require('@babel/core')

// Load the production ES modules with the same @/ alias as the Vue app.
const cache = new Map()
function load(relativePath) {
  const filename = path.resolve(__dirname, '..', relativePath)
  if (cache.has(filename)) return cache.get(filename).exports
  const module = { exports: {} }
  cache.set(filename, module)
  const { code } = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    configFile: false,
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  })
  new Function('require', 'module', 'exports', code)(
    name => load(name.replace('@/', 'src/') + '.js'), module, module.exports
  )
  return module.exports
}

const { HANDRAW_LIBRARY_INDEX: library } = load('src/data/handrawLibraryIndex.js')
const {
  HANDRAW_STYLE_CATEGORY_NUMBERS: groups,
  ILLUSTRATION_STYLE_CATEGORY_IDS: categoryIds,
  illustrationStyleCategory: categoryOf,
} = load('src/data/illustrationStyleClassification.js')
const { stylesForIllustrationTab: filter, visibleIllustrationCategoryIds } = load('src/utils/illustrationStyleTabs.js')
const numbers = Object.values(groups).flat()
assert.equal(numbers.length, 279)
assert.equal(new Set(numbers).size, 279, 'Each library style must have exactly one category')
assert.deepEqual([...numbers].sort((a, b) => a - b), Array.from({ length: 279 }, (_, i) => i + 1))
for (const style of library) {
  assert.equal(categoryIds.filter(category => filter('all', [style], { category }).length).length, 1)
}
for (const [number, category] of [[50, 'collage'], [88, 'paint'], [136, 'chinese'], [217, 'toon'], [249, 'collage'], [259, 'paint'], [268, 'chinese'], [272, 'collage'], [273, 'collage'], [275, 'sketch'], [278, 'collage']]) {
  const row = library.find(style => Number(style.handrawNo) === number)
  assert.equal(categoryOf(row), category, `Style #${number}`)
  // Curated aliases and translated labels must use the same visual category.
  assert.equal(categoryOf({ id: 38, key: row.key, handrawNo: row.handrawNo, category: 'other', artStyle: 'Translated name' }), category)
}
const featured = { id: 1, category: 'sketch' }
const styles = [featured, ...library]
assert.deepEqual(filter('curated', styles, { category: 'sketch' }), [featured])
assert.equal(filter('curated', styles, { category: 'collage' }).length, 0)
assert.equal(filter('all', styles).length, styles.length)
assert.deepEqual(visibleIllustrationCategoryIds(library), ['curated', 'sketch', 'paint', 'toon', 'collage', 'chinese', 'other'])
assert.equal(filter('collage', library).length, 9, 'A visual category includes non-featured styles directly')
assert.equal(categoryOf({ id: 5000, category: 'unknown' }), 'other')
assert.equal(categoryOf({ id: 31, category: 'skill' }), 'skill')
assert.equal(categoryOf({ key: 'keithHaringDoodle', category: 'marker' }), 'sketch')
assert.equal(categoryOf({ key: 'handraw241MagazineSpot', handrawNo: '241', category: 'collage' }), 'toon')
console.log('PASS: 279 styles covered exactly once; visual examples, translated aliases, scope/category intersections and fallbacks verified.')
