import { test } from 'uvu'
import * as assert from 'uvu/assert'
import unifiedConditional from './index.js'
import { remark } from 'remark'
import { VFile } from 'vfile'

async function process(path, options) {
  return String(
    await remark()
      .use(unifiedConditional, options)
      .process(new VFile({ path, value: '' }))
  ).trim()
}

function pluginIf() {
  return (tree) =>
    tree.children.unshift({ type: 'heading', children: [{ type: 'text', value: 'IF' }] })
}

function pluginElse() {
  return (tree) =>
    tree.children.unshift({ type: 'heading', children: [{ type: 'text', value: 'ELSE' }] })
}

function pluginWithOptions(value) {
  return (tree) => tree.children.unshift({ type: 'heading', children: [{ type: 'text', value }] })
}

test('string', async () => {
  assert.equal(await process('~/a.txt', ['~/a.txt', [pluginIf]]), '# IF')
  assert.equal(await process('~/a.txt', ['~/b.txt', [pluginIf]]), '')
  assert.equal(await process('~/a.txt', ['~/b.txt', [pluginIf], [pluginElse]]), '# ELSE')
})

test('regex', async () => {
  assert.equal(await process('~/a.txt', [/a/, [pluginIf]]), '# IF')
  assert.equal(await process('~/a.txt', [/b/, [pluginIf]]), '')
  assert.equal(await process('~/a.txt', [/b/, [pluginIf], [pluginElse]]), '# ELSE')
})

test('function', async () => {
  assert.equal(
    await process('~/a.txt', [(_, file) => /a/.test(file.history[0]), [pluginIf]]),
    '# IF'
  )
  assert.equal(await process('~/a.txt', [(_, file) => /b/.test(file.history[0]), [pluginIf]]), '')
  assert.equal(
    await process('~/a.txt', [(_, file) => /b/.test(file.history[0]), [pluginIf], [pluginElse]]),
    '# ELSE'
  )
})

test('with options', async () => {
  assert.equal(
    await process('~/a.txt', [
      '~/a.txt',
      [[pluginWithOptions, 'Foo']],
      [[pluginWithOptions, 'Bar']],
    ]),
    '# Foo'
  )
  assert.equal(
    await process('~/b.txt', [
      '~/a.txt',
      [[pluginWithOptions, 'Foo']],
      [[pluginWithOptions, 'Bar']],
    ]),
    '# Bar'
  )
})

test.run()
