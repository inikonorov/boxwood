'use strict'

const test = require('ava')
const curlyTagReduction = require('./curlyTagReduction')

test('curlyTagReduction: simplifies expressions in curly tags', assert => {
  assert.deepEqual(curlyTagReduction('{foo}', []), '')
  assert.deepEqual(curlyTagReduction('{foo || ""}', []), '')
  assert.deepEqual(curlyTagReduction('{foo || "bar"}', []), 'bar')

  assert.deepEqual(curlyTagReduction('{foo}', [{ key: 'foo', value: 'bar' }]), 'bar')
  assert.deepEqual(curlyTagReduction('{foo || ""}', [{ key: 'foo', value: 'bar' }]), 'bar')
  assert.deepEqual(curlyTagReduction('{foo || "bar"}', [{ key: 'foo', value: 'bar' }]), 'bar')

  assert.deepEqual(curlyTagReduction('{foo || bar}', []), '')
  assert.deepEqual(curlyTagReduction('{foo || bar}', [{ key: 'foo', value: 'foo' }]), 'foo')
  assert.deepEqual(curlyTagReduction('{foo || bar}', [{ key: 'bar', value: 'bar' }]), 'bar')
  assert.deepEqual(curlyTagReduction('{foo || bar}', [{ key: 'foo', value: 'foo' }, { key: 'bar', value: 'bar' }]), 'foo')

  assert.deepEqual(curlyTagReduction('{foo}', [{ key: 'foo', value: '{foo}' }]), '{foo}')
  assert.deepEqual(curlyTagReduction('{foo || ""}', [{ key: 'foo', value: '{foo}' }]), '{foo || ""}')
  assert.deepEqual(curlyTagReduction('{foo || "bar"}', [{ key: 'foo', value: '{foo}' }]), '{foo || "bar"}')

  assert.deepEqual(curlyTagReduction('{foo}', [{ key: 'foo', value: '{foo.bar}' }]), '{foo.bar}')
  assert.deepEqual(curlyTagReduction('{foo || ""}', [{ key: 'foo', value: '{foo.bar}' }]), '{foo.bar || ""}')
  assert.deepEqual(curlyTagReduction('{foo || "bar"}', [{ key: 'foo', value: '{foo.bar}' }]), '{foo.bar || "bar"}')

  assert.deepEqual(curlyTagReduction('{foo}', [{ key: 'foo', value: '{foo[bar]}' }]), '{foo[bar]}')
  assert.deepEqual(curlyTagReduction('{foo || ""}', [{ key: 'foo', value: '{foo[bar]}' }]), '{foo[bar] || ""}')
  assert.deepEqual(curlyTagReduction('{foo || "bar"}', [{ key: 'foo', value: '{foo[bar]}' }]), '{foo[bar] || "bar"}')

  // TODO: Ensure that is needed
  assert.deepEqual(curlyTagReduction('{foo}', [{ key: 'foo', value: '{true}' }]), '{true}')
  assert.deepEqual(curlyTagReduction('{foo || ""}', [{ key: 'foo', value: '{true}' }]), '{true}')
  assert.deepEqual(curlyTagReduction('{foo || "bar"}', [{ key: 'foo', value: '{true}' }]), '{true}')

  assert.deepEqual(curlyTagReduction('{foo}', [{ key: 'foo', value: '{false}' }]), '{false}')
  assert.deepEqual(curlyTagReduction('{foo || ""}', [{ key: 'foo', value: '{false}' }]), '')
  assert.deepEqual(curlyTagReduction('{foo || "bar"}', [{ key: 'foo', value: '{false}' }]), 'bar')

  assert.deepEqual(curlyTagReduction('{foo}{bar}', []), '')
  assert.deepEqual(curlyTagReduction('{foo} {bar}', []), '')

  assert.deepEqual(curlyTagReduction('<div class="{foo}"></div>', []), '<div></div>')
  assert.deepEqual(curlyTagReduction('<div class="{foo}"></div>', [{ key: 'foo', value: '' }]), '<div></div>')
  assert.deepEqual(curlyTagReduction('<div class="{foo}"></div>', [{ key: 'foo', value: '  ' }]), '<div></div>')
  assert.deepEqual(curlyTagReduction('<div class="{foo}"></div>', [{ key: 'foo', value: undefined }]), '<div class=\'{undefined}\'></div>')
  assert.deepEqual(curlyTagReduction('<div class="{foo}"></div>', [{ key: 'foo', value: null }]), '<div class=\'{null}\'></div>')
  assert.deepEqual(curlyTagReduction('<div padding="{{bottom:30}}"></div>', []), '<div padding=\'{({\n  bottom: 30\n})}\'></div>')

  assert.deepEqual(curlyTagReduction('<style>.foo { color: red }</style>', []), '<style>.foo { color: red }</style>')
})
