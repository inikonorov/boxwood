import test from '../../helpers/test'
import compile from '../../helpers/compile'
import escape from 'escape-html'

test('attributes: shorthand syntax with one item', async assert => {
  const template = await compile('<div class="[foo]"></div>')
  assert.deepEqual(template({}, escape), '<div class=""></div>')
  assert.deepEqual(template({ foo: 'foo' }, escape), '<div class="foo"></div>')
})

test('attributes: shorthand syntax with two items', async assert => {
  const template = await compile('<div class="[foo, bar]"></div>')
  assert.deepEqual(template({}, escape), '<div class=""></div>')
  assert.deepEqual(template({ foo: 'foo' }, escape), '<div class="foo"></div>')
  assert.deepEqual(template({ foo: 'foo', bar: 'bar' }, escape), '<div class="foo bar"></div>')
})

test('attributes: shorthand syntax with and operator', async assert => {
  const template = await compile(`<div class="[foo && 'bar']"></div>`)
  assert.deepEqual(template({}, escape), '<div class=""></div>')
  assert.deepEqual(template({ foo: true }, escape), '<div class="bar"></div>')
  assert.deepEqual(template({ foo: false }, escape), '<div class=""></div>')
})

test('attributes: shorthand syntax with or operator', async assert => {
  const template = await compile(`<div class="[foo || 'bar']"></div>`)
  assert.deepEqual(template({}, escape), '<div class="bar"></div>')
  assert.deepEqual(template({ foo: 'foo' }, escape), '<div class="foo"></div>')
})

test('attributes: shorthand syntax for multiple or operators', async assert => {
  const template = await compile('<input id="[id || name]">')
  assert.deepEqual(template({}, escape), '<input id="">')
  assert.deepEqual(template({ id: 'foo' }, escape), '<input id="foo">')
  assert.deepEqual(template({ name: 'foo' }, escape), '<input id="foo">')
  assert.deepEqual(template({ id: 'foo', name: 'bar' }, escape), '<input id="foo">')
})

test('attributes: shorthand syntax with ternary operator', async assert => {
  const template = await compile(`<div class="[foo ? 'foo' : 'bar']"></div>`)
  assert.deepEqual(template({}, escape), '<div class="bar"></div>')
  assert.deepEqual(template({ foo: true }, escape), '<div class="foo"></div>')
  assert.deepEqual(template({ foo: false }, escape), '<div class="bar"></div>')
})

test('attributes: shorthand syntax with one string', async assert => {
  const template = await compile(`<div class="['foo', bar]"></div>`)
  assert.deepEqual(template({}, escape), '<div class="foo"></div>')
  assert.deepEqual(template({ bar: 'bar' }, escape), '<div class="foo bar"></div>')
})

test('attributes: shorthand syntax with multiple strings', async assert => {
  const template = await compile(`<div class="['foo', bar, 'baz']"></div>`)
  assert.deepEqual(template({}, escape), '<div class="foo baz"></div>')
  assert.deepEqual(template({ bar: 'bar' }, escape), '<div class="foo bar baz"></div>')
})
