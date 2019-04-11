import test from 'ava'
import Importer from './Importer'
import { join } from 'path'

// TODO: Add fixtures

const fixtures = join(__dirname, '../test/fixtures/Importer')
test('Importer: template has no components', async assert => {
  const source = '<div></div>'
  const importer = new Importer(source)
  const { components } = await importer.import()
  assert.deepEqual(components, [])
})

test('Importer: template has one component', async assert => {
  const source = `<import foo from="./foo.html"><foo/>`
  const importer = new Importer(source, {
    paths: [fixtures]
  })
  const { components } = await importer.import()
  const component = components[0]
  assert.deepEqual(components.length, 1)
  assert.deepEqual(component.name, 'foo')
  assert.deepEqual(component.source, '<div>foo</div>')
  assert.deepEqual(component.path, join(fixtures, 'foo.html'))
  assert.deepEqual(component.files, ['.'])
  assert.deepEqual(component.warnings, [])
})

test('Importer: template has multiple components', async assert => {
  const source = `<import foo from="./foo.html"><import bar from="./bar.html"><foo/><bar/>`
  const importer = new Importer(source, {
    paths: [fixtures]
  })
  const { components } = await importer.import()
  const component1 = components[0]
  const component2 = components[1]
  assert.deepEqual(components.length, 2)
  assert.deepEqual(component1.name, 'foo')
  assert.deepEqual(component1.source, '<div>foo</div>')
  assert.deepEqual(component1.path, join(fixtures, 'foo.html'))
  assert.deepEqual(component1.files, ['.'])
  assert.deepEqual(component1.warnings, [])

  assert.deepEqual(component2.name, 'bar')
  assert.deepEqual(component2.source, '<div>bar</div>')
  assert.deepEqual(component2.path, join(fixtures, 'bar.html'))
  assert.deepEqual(component2.files, ['.'])
  assert.deepEqual(component2.warnings, [])
})

test('Importer: template has multiple components with shorthand syntax', async assert => {
  const source = `<import foo,bar from="."><foo/><bar/>`
  const importer = new Importer(source, {
    paths: [fixtures]
  })
  const { components } = await importer.import()
  const component1 = components[0]
  const component2 = components[1]
  assert.deepEqual(components.length, 2)
  assert.deepEqual(component1.name, 'foo')
  assert.deepEqual(component1.source, '<div>foo</div>')
  assert.deepEqual(component1.path, join(fixtures, 'foo.html'))
  assert.deepEqual(component1.files, ['.'])
  assert.deepEqual(component1.warnings, [])

  assert.deepEqual(component2.name, 'bar')
  assert.deepEqual(component2.source, '<div>bar</div>')
  assert.deepEqual(component2.path, join(fixtures, 'bar.html'))
  assert.deepEqual(component2.files, ['.'])
  assert.deepEqual(component2.warnings, [])
})

test('Importer: template has multiple components with shorthand syntax and spacing', async assert => {
  const source = `<import {  foo, bar  } from="."><foo/><bar/>`
  const importer = new Importer(source, {
    paths: [fixtures]
  })
  const { components } = await importer.import()
  const component1 = components[0]
  const component2 = components[1]
  assert.deepEqual(components.length, 2)
  assert.deepEqual(component1.name, 'foo')
  assert.deepEqual(component1.source, '<div>foo</div>')
  assert.deepEqual(component1.path, join(fixtures, 'foo.html'))
  assert.deepEqual(component1.files, ['.'])
  assert.deepEqual(component1.warnings, [])

  assert.deepEqual(component2.name, 'bar')
  assert.deepEqual(component2.source, '<div>bar</div>')
  assert.deepEqual(component2.path, join(fixtures, 'bar.html'))
  assert.deepEqual(component2.files, ['.'])
  assert.deepEqual(component2.warnings, [])
})

test('Importer: template can have one level of imports', async assert => {
  const source = `<import baz from="./baz.html"><baz/>`
  const importer = new Importer(source, {
    paths: [fixtures]
  })
  const { components } = await importer.import()
  const component1 = components[0]
  const component2 = components[1]
  assert.deepEqual(components.length, 2)
  assert.deepEqual(component1.name, 'baz')
  assert.deepEqual(component1.source, '<import qux from="./qux.html"><qux/>')
  assert.deepEqual(component1.path, join(fixtures, 'baz.html'))
  assert.deepEqual(component1.files, ['.'])
  assert.deepEqual(component1.warnings, [])

  assert.deepEqual(component2.name, 'qux')
  assert.deepEqual(component2.source, '<div>qux</div>')
  assert.deepEqual(component2.path, join(fixtures, 'qux.html'))
  assert.deepEqual(component2.files, [join(fixtures, 'baz.html')])
  assert.deepEqual(component2.warnings, [])
})

test('Importer: template can have two levels of imports', async assert => {
  const source = `<import bam from="./bam.html"><bam/>`
  const importer = new Importer(source, { paths: [fixtures] })
  const { components } = await importer.import()
  const component1 = components[0]
  const component2 = components[1]
  const component3 = components[2]
  // assert.deepEqual(components.length, 3)
  assert.deepEqual(component1.name, 'bam')
  assert.deepEqual(component1.source, '<import baz from="./baz.html"><baz/>')
  assert.deepEqual(component1.path, join(fixtures, 'bam.html'))
  assert.deepEqual(component1.files, ['.'])
  assert.deepEqual(component1.warnings, [])

  assert.deepEqual(component2.name, 'baz')
  assert.deepEqual(component2.source, '<import qux from="./qux.html"><qux/>')
  assert.deepEqual(component2.path, join(fixtures, 'baz.html'))
  assert.deepEqual(component2.files, [join(fixtures, 'bam.html')])
  assert.deepEqual(component2.warnings, [])

  assert.deepEqual(component3.name, 'qux')
  assert.deepEqual(component3.source, '<div>qux</div>')
  assert.deepEqual(component3.path, join(fixtures, 'qux.html'))
  assert.deepEqual(component3.files, [join(fixtures, 'baz.html')])
  assert.deepEqual(component3.warnings, [])
})

test('Importer: template has unknown component', async assert => {
  const source = `<import unknown from="./unknown.html"><unknown/>`
  const importer = new Importer(source, { paths: [fixtures] })
  const { warnings } = await importer.import()
  assert.deepEqual(warnings.length, 1)
  assert.deepEqual(warnings[0].message, 'Component not found: unknown')
  assert.deepEqual(warnings[0].type, 'COMPONENT_NOT_FOUND')
})

test('Importer: templates reuse same components', async assert => {
  const source = `<import pages1 from="./pages1.html"><pages1/>`
  const importer = new Importer(source, { paths: [fixtures] })
  const { components } = await importer.import()
  assert.deepEqual(components.length, 4)
  assert.deepEqual(components[0].path, join(fixtures, 'pages1.html'))
  assert.deepEqual(components[1].path, join(fixtures, 'page1.html'))
  assert.deepEqual(components[2].path, join(fixtures, 'page2.html'))
  assert.deepEqual(components[3].path, join(fixtures, 'button.html'))
  assert.deepEqual(components[3].files, [join(fixtures, 'page1.html'), join(fixtures, 'page2.html')])
})

test('Importer: template has nested components with the same name', async assert => {
  const source = `<import pages2 from="./pages2.html"><pages2/>`
  const importer = new Importer(source, { paths: [fixtures] })
  const { components } = await importer.import()
  assert.deepEqual(components.length, 5)
  assert.deepEqual(components[0].path, join(fixtures, 'pages2.html'))
  assert.deepEqual(components[1].path, join(fixtures, 'page3/index.html'))
  assert.deepEqual(components[2].path, join(fixtures, 'page4/index.html'))
  assert.deepEqual(components[3].path, join(fixtures, 'page3/button.html'))
  assert.deepEqual(components[4].path, join(fixtures, 'page4/button.html'))
})

test('Importer: template has duplicate components', async assert => {
  const source = `<import duplicate1 from="./duplicate1.html"><duplicate1/>`
  const importer = new Importer(source, { paths: [fixtures] })
  const { components, warnings } = await importer.import()
  assert.deepEqual(components.length, 2)
  assert.deepEqual(components[0].path, join(fixtures, 'duplicate1.html'))
  assert.deepEqual(components[1].path, join(fixtures, 'foo.html'))
  assert.deepEqual(warnings.length, 2)
  assert.deepEqual(warnings[0].message, 'Component name duplicate: foo')
  assert.deepEqual(warnings[0].type, 'COMPONENT_NAME_DUPLICATE')
  assert.deepEqual(warnings[1].message, 'Component path duplicate: ./foo.html')
  assert.deepEqual(warnings[1].type, 'COMPONENT_PATH_DUPLICATE')
})

test('Importer: template has duplicate components with shorthand syntax', async assert => {
  const source = `<import duplicate2 from="./duplicate2.html"><duplicate2/>`
  const importer = new Importer(source, { paths: [fixtures] })
  const { components, warnings } = await importer.import()
  assert.deepEqual(components.length, 2)
  assert.deepEqual(components[0].path, join(fixtures, 'duplicate2.html'))
  assert.deepEqual(components[1].path, join(fixtures, 'foo.html'))
  assert.deepEqual(warnings.length, 1)
  assert.deepEqual(warnings[0].message, 'Component name duplicate: foo')
  assert.deepEqual(warnings[0].type, 'COMPONENT_NAME_DUPLICATE')
})

test('Importer: template has duplicate components with require tag', async assert => {
  const source = `<require duplicate3 from="./duplicate3.html"><duplicate3/>`
  const importer = new Importer(source, { paths: [fixtures] })
  const { components, warnings } = await importer.import()
  assert.deepEqual(components.length, 3)
  assert.deepEqual(components[0].path, join(fixtures, 'duplicate3.html'))
  assert.deepEqual(components[1].path, join(fixtures, 'page4/index.html'))
  assert.deepEqual(components[2].path, join(fixtures, 'page4/button.html'))
  assert.deepEqual(warnings.length, 2)
  assert.deepEqual(warnings[0].message, 'Component name duplicate: page4')
  assert.deepEqual(warnings[0].type, 'COMPONENT_NAME_DUPLICATE')
  assert.deepEqual(warnings[1].message, 'Component path duplicate: ./page4/index.html')
  assert.deepEqual(warnings[1].type, 'COMPONENT_PATH_DUPLICATE')
})

test('Importer: template has a flat circular dependency', async assert => {
  const source = `<import circular-flat-1 from="./circular-flat-1.html"><circular-flat-1/>`
  const importer = new Importer(source, { paths: [fixtures] })
  const { warnings } = await importer.import()
  assert.deepEqual(warnings.length, 1)
  assert.deepEqual(warnings[0].type, 'MAXIMUM_IMPORT_DEPTH_EXCEEDED')
  assert.deepEqual(warnings[0].message, 'Maximum import depth exceeded')
})

test('Importer: template has a deep circular dependency', async assert => {
  const source = `<import circular-deep-1 from="./circular-deep-1.html"><circular-deep-1/>`
  const importer = new Importer(source, { paths: [fixtures] })
  const { warnings } = await importer.import()
  assert.deepEqual(warnings.length, 1)
  assert.deepEqual(warnings[0].type, 'MAXIMUM_IMPORT_DEPTH_EXCEEDED')
  assert.deepEqual(warnings[0].message, 'Maximum import depth exceeded')
})

test('Importer: template imports itself', async assert => {
  const source = `<import itself from="./itself.html"><itself/>`
  const importer = new Importer(source, { paths: [fixtures] })
  const { warnings } = await importer.import()
  assert.deepEqual(warnings.length, 1)
  assert.deepEqual(warnings[0].type, 'MAXIMUM_IMPORT_DEPTH_EXCEEDED')
  assert.deepEqual(warnings[0].message, 'Maximum import depth exceeded')
})

test('Importer: template has an unused component', async assert => {
  const source = `<import foo from="./foo.html">`
  const importer = new Importer(source, { paths: [fixtures] })
  const { warnings } = await importer.import()
  assert.deepEqual(warnings.length, 1)
  assert.deepEqual(warnings[0].type, 'UNUSED_COMPONENT')
  assert.deepEqual(warnings[0].message, 'foo component is unused')
})

test('Importer: template has a partial tag', async assert => {
  const source = `<partial from="./foo.html"/>`
  const importer = new Importer(source, { paths: [fixtures] })
  const { components, warnings } = await importer.import()
  assert.deepEqual(warnings.length, 0)
  assert.deepEqual(components.length, 1)
  assert.deepEqual(components[0].type, 'PARTIAL')
})

test('Importer: template has a render tag', async assert => {
  const source = `<render from="./foo.html"/>`
  const importer = new Importer(source, { paths: [fixtures] })
  const { components, warnings } = await importer.import()
  assert.deepEqual(warnings.length, 0)
  assert.deepEqual(components.length, 1)
  assert.deepEqual(components[0].type, 'PARTIAL')
})

test('Importer: template has an include tag', async assert => {
  const source = `<include from="./foo.html"/>`
  const importer = new Importer(source, { paths: [fixtures] })
  const { components, warnings } = await importer.import()
  assert.deepEqual(warnings.length, 0)
  assert.deepEqual(components.length, 1)
  assert.deepEqual(components[0].type, 'PARTIAL')
})

test('Importer: template has a partial attribute', async assert => {
  const source = `<div partial="./foo.html"></div>`
  const importer = new Importer(source, { paths: [fixtures] })
  const { components, warnings } = await importer.import()
  assert.deepEqual(warnings.length, 0)
  assert.deepEqual(components.length, 1)
  assert.deepEqual(components[0].type, 'PARTIAL')
})
