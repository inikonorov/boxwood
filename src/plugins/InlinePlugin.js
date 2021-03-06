'use strict'

const Plugin = require('./Plugin')
const { parse, walk, generate } = require('css-tree')
const { findAsset, isFileSupported } = require('../utilities/files')
const { getExtension, getBase64Extension } = require('../utilities/string')
const { whitespacestrip } = require('pure-utilities/string')

function getBase64String (asset, options, isFont) {
  const { path, base64 } = asset
  const extension = getExtension(path)
  const dataType = isFont ? 'data:application/font-' : 'data:image/'
  return [
    `${dataType}${getBase64Extension(extension)}`,
    isFont && 'charset=utf-8',
    `base64,${base64}`
  ].filter(Boolean).join(';')
}

function convertElementValueToBase64 ({ element, value, assets, options, isFont }) {
  if (!isFileSupported(value)) return
  const asset = findAsset(value, assets, options)
  if (!asset) return
  element.value = getBase64String(asset, options, isFont)
}

class InlinePlugin extends Plugin {
  constructor () {
    super()
    this.classes = []
  }

  prerun ({ fragment, attrs, keys }) {
    if (fragment.tagName === 'style' && keys.includes('inline')) {
      let { value } = attrs.find(attr => attr.key === 'inline') || {}
      if (!value) { return null }
      value = value.split(',').map(whitespacestrip)
      if (value.includes('classes')) {
        const { content } = fragment.children[0]
        const tree = parse(content)
        walk(tree, {
          visit: 'Rule',
          enter: node => {
            walk(node.prelude, {
              visit: 'ClassSelector',
              enter: leaf => {
                const { name } = leaf
                const block = generate(node.block)
                if (name && block) {
                  const declaration = block
                    .replace(/{|}/g, '')
                    .replace(/"/g, "'")
                  this.classes.push({ className: leaf.name, declaration })
                  node.used = true
                }
              }
            })
          }
        })
        walk(tree, {
          enter: (node, item, list) => {
            if (item && item.data && item.data.used) {
              list.remove(item)
            }
          }
        })
        fragment.children[0].content = generate(tree)
      }
    }
  }

  run ({ fragment, keys, assets, options }) {
    if (fragment.tagName === 'style' && keys.includes('inline')) {
      const { content } = fragment.children[0]
      const tree = parse(content)
      walk(tree, node => {
        if (node.type === 'Url') {
          let { type, value } = node.value
          value = value.replace(/'|"/g, '')
          convertElementValueToBase64({ element: node.value, value, assets, options, isFont: type === 'Raw' })
        }
      })
      fragment.children[0].content = generate(tree)
    }
    if (fragment.tagName === 'font' && keys.includes('inline')) {
      const attribute = fragment.attributes.find(attribute => attribute.key === 'from')
      convertElementValueToBase64({ element: attribute, value: attribute.value, assets, options, isFont: true })
    }
    if (fragment.type === 'element' && fragment.tagName !== 'style' && this.classes.length) {
      const classAttribute = fragment.attributes.find(attribute => attribute.key === 'class')
      if (classAttribute) {
        const classes = classAttribute.value.split(/\s/).filter(Boolean) || []
        fragment.attributes = fragment.attributes
          .map(attribute => {
            if (attribute.key === 'class') {
              this.classes.forEach(({ className }) => {
                attribute.value = attribute.value.replace(className, '')
                attribute.value = attribute.value.replace(/\s+/, '')
                return attribute.value ? attribute : null
              })
            }
            return attribute
          })
          .filter(attribute => attribute.value)
        this.classes
          .filter(({ className }) => classes.includes(className))
          .forEach(({ declaration }) => {
            const styleAttribute = fragment.attributes.find(attribute => attribute.key === 'style')
            if (styleAttribute) {
              if (!styleAttribute.value.includes(declaration)) {
                fragment.attributes = fragment.attributes.map(attribute => {
                  if (attribute.key === 'style') {
                    attribute.value += ';'.concat(declaration)
                  }
                  return attribute
                })
              }
            } else {
              fragment.attributes.push({ key: 'style', value: declaration })
            }
          })
      }
    }
  }
}

module.exports = InlinePlugin
