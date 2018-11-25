const { OBJECT_VARIABLE, ESCAPE_VARIABLE, BOOLEAN_ATTRIBUTES, UNESCAPED_NAMES, GLOBAL_VARIABLES } = require('./enum')
const {
  getLiteral, getIdentifier, getObjectMemberExpression,
  getTemplateAssignmentExpression, getEscapeCallExpression
} = require('./factory')
const { extract, getName } = require('./string')
const { getFilterName, extractFilterName } = require('./filters')
const AbstractSyntaxTree = require('abstract-syntax-tree')
const { array, math, collection, object, json, date } = require('pure-utilities')
const ARRAY_UTILITIES = Object.keys(array)
const MATH_UTILITIES = Object.keys(math)
const COLLECTION_UTILITIES = Object.keys(collection)
const OBJECT_UTILITIES = Object.keys(object)
const JSON_UTILITIES = Object.keys(json)
const DATE_UTILITIES = Object.keys(date)
const { mergeTranslations } = require('./translations')

function isUnescapedFilter (filter) {
  const name = getFilterName(extractFilterName(filter))
  return name.startsWith('unescape') ||
      name.startsWith('unquote') ||
      name.startsWith('unwrap') ||
      name.startsWith('htmlstrip') ||
      ARRAY_UTILITIES.includes(name) ||
      MATH_UTILITIES.includes(name) ||
      COLLECTION_UTILITIES.includes(name) ||
      OBJECT_UTILITIES.includes(name) ||
      JSON_UTILITIES.includes(name) ||
      DATE_UTILITIES.includes(name)
}

function convertToBinaryExpression (nodes) {
  return nodes.reduce((previous, current) => {
    if (!previous.left) {
      previous.left = current
      return previous
    } else if (!previous.right) {
      previous.right = current
      return previous
    }
    return { type: 'BinaryExpression', operator: '+', left: previous, right: current }
  }, {
    type: 'BinaryExpression', operator: '+'
  })
}

function convertToExpression (string) {
  const tree = new AbstractSyntaxTree(string)
  const { expression } = tree.ast.body[0]
  return expression
}

function convertAttribute (name, value, variables, currentFilters, translations, languages, translationsPaths) {
  if (value && value.includes('{') && value.includes('}')) {
    let values = extract(value)
    if (values.length === 1) {
      let property = values[0].value.substring(1, values[0].value.length - 1)
      const expression = convertToExpression(property)
      const filters = values[0].filters || []
      filters.forEach(filter => currentFilters.push(filter))
      let unescape = UNESCAPED_NAMES.includes(name)
      if (!unescape) {
        filters.forEach(filter => {
          if (isUnescapedFilter(filter)) {
            unescape = true
          }
        })
      }
      return modify(getTemplateNode(expression, variables, unescape), filters, translations, languages, translationsPaths)
    } else {
      const nodes = values.map(({ value, filters = [] }, index) => {
        filters.forEach(filter => currentFilters.push(filter))
        if (value.includes('{') && value.includes('}')) {
          let property = value.substring(1, value.length - 1)
          const expression = convertToExpression(property)
          let unescape = UNESCAPED_NAMES.includes(name)
          if (!unescape) {
            filters.forEach(filter => {
              if (isUnescapedFilter(filter)) {
                unescape = true
              }
            })
          }
          return modify(getTemplateNode(expression, variables, unescape), filters, translations, languages, translationsPaths)
        }
        return modify(getLiteral(value), filters, translations, languages, translationsPaths)
      })
      const expression = convertToBinaryExpression(nodes)
      return { type: 'ExpressionStatement', expression }
    }
  } else if (name.endsWith('.bind')) {
    const expression = convertToExpression(value)
    return getTemplateNode(expression, variables, UNESCAPED_NAMES.includes(name.split('.')[0]))
  } else {
    return getLiteral(value)
  }
}

function convertHtmlOrTextAttribute (fragment, variables, currentFilters, translations, languages, translationsPaths) {
  let html = fragment.attributes.find(attr => attr.key === 'html' || attr.key === 'html.bind')
  if (html) {
    return convertAttribute(html.key, html.value, variables, currentFilters, translations, languages, translationsPaths)
  } else {
    let text = fragment.attributes.find(attr => attr.key === 'text' || attr.key === 'text.bind')
    if (text) {
      let argument = convertAttribute(text.key, text.value, variables, currentFilters, translations, languages, translationsPaths)
      return {
        type: 'CallExpression',
        callee: getIdentifier(ESCAPE_VARIABLE),
        arguments: [argument.expression ? argument.expression : argument],
        fragment
      }
    }
  }
  return null
}

function convertIdentifier (node, variables) {
  if (variables.includes(node.name)) {
    return node
  } else {
    return getObjectMemberExpression(node.name)
  }
}

function getTemplateNode (expression, variables, unescape) {
  if (expression.type === 'Identifier') {
    const node = convertIdentifier(expression, variables)
    if (unescape) return node
    return getEscapeCallExpression(node)
  }
  if (expression.type === 'Literal') {
    return expression
  } else if (expression.type === 'BinaryExpression') {
    AbstractSyntaxTree.replace(expression, (node, parent) => {
      if (node.type === 'MemberExpression' && node.property.type === 'Identifier') {
        node.property.omit = true
      } else if (node.type === 'Identifier' && !node.omit) {
        node.omit = true
        if (!variables.includes(node.name)) {
          const object = getIdentifier(OBJECT_VARIABLE)
          object.omit = true
          node = {
            type: 'MemberExpression',
            object,
            property: node
          }
        }
      }
      return node
    })
    if (!unescape) {
      expression = getEscapeCallExpression(expression)
    }
    return expression
  } else if (expression.type === 'MemberExpression') {
    if (expression.object.type === 'Identifier') {
      if (variables.includes(expression.object.name)) {
        if (unescape) return expression
        return getEscapeCallExpression(expression)
      }
      if (expression.computed && expression.property.type === 'Identifier') {
        expression.property = convertIdentifier(expression.property, variables)
      }
      let leaf = {
        type: 'MemberExpression',
        object: getObjectMemberExpression(expression.object.name),
        property: expression.property,
        computed: expression.computed || expression.property.type === 'Literal'
      }
      if (unescape) return leaf
      return getEscapeCallExpression(leaf)
    } else if (expression.object.type === 'MemberExpression') {
      if (expression.computed && expression.property.type === 'Identifier') {
        expression.property = convertIdentifier(expression.property, variables)
      }
      let leaf = expression.object
      if (leaf.computed && leaf.property.type === 'Identifier') {
        leaf.property = convertIdentifier(leaf.property, variables)
      }
      while (leaf.object.type === 'MemberExpression') {
        leaf = leaf.object
        if (leaf.computed && leaf.property.type === 'Identifier') {
          leaf.property = convertIdentifier(leaf.property, variables)
        }
      }
      if (!variables.includes(leaf.object.name)) {
        leaf.object = getObjectMemberExpression(leaf.object.name)
      }
      if (unescape) return expression
      return getEscapeCallExpression(expression)
    }
  } else if (expression.type === 'CallExpression') {
    expression.arguments = expression.arguments.map(node => getTemplateNode(node, variables, true))
    if (expression.callee.type === 'Identifier') {
      expression.callee = convertIdentifier(expression.callee, variables)
      if (unescape) return expression
      return getEscapeCallExpression(expression)
    } else if (expression.callee.type === 'MemberExpression') {
      let node = expression.callee.object
      if (expression.callee.object.type === 'Identifier') {
        expression.callee.object = convertIdentifier(expression.callee.object, variables)
        if (unescape) return expression
        return getEscapeCallExpression(expression)
      } else {
        while (node.object && node.object.type === 'MemberExpression') {
          node = node.object
        }
        if (node.type === 'CallExpression') {
          node.callee = convertIdentifier(node.callee, variables)
        } else {
          node.object = convertIdentifier(node.object, variables)
        }
        if (unescape) return expression
        return getEscapeCallExpression(expression)
      }
    }
  } else if (['ArrayExpression', 'NewExpression', 'ConditionalExpression', 'ObjectExpression'].includes(expression.type)) {
    AbstractSyntaxTree.replace(expression, (node, parent) => {
      if (node.type === 'Property' && node.key === node.value) {
        if (!variables.includes(node.key.name)) {
          const object = getIdentifier(OBJECT_VARIABLE)
          object.omit = true
          node.value = {
            type: 'MemberExpression',
            object,
            property: node.value
          }
          node.shorthand = false
          node.value.omit = true
          node.value.property.omit = true
        }
      } else if (parent.type === 'Property' && node.type === 'Identifier' && parent.key === node) {
        node.omit = true
      } else if (node.type === 'MemberExpression' && node.property.type === 'Identifier') {
        node.property.omit = true
      } else if (node.type === 'Identifier' && !node.omit && !GLOBAL_VARIABLES.includes(node.name)) {
        node.omit = true
        if (!variables.includes(node.name)) {
          const object = getIdentifier(OBJECT_VARIABLE)
          object.omit = true
          node = {
            type: 'MemberExpression',
            object,
            property: node
          }
        }
      }
      return node
    })
    if (!unescape) {
      return getEscapeCallExpression(expression)
    }
    return expression
  } else if (expression.type === 'LogicalExpression') {
    if (expression.left.type === 'Identifier' && !variables.includes(expression.left.name)) {
      expression.left = getObjectMemberExpression(expression.left.name)
    }
    if (expression.right.type === 'Identifier' && !variables.includes(expression.right.name)) {
      expression.right = getObjectMemberExpression(expression.right.name)
    }
    if (!unescape) {
      return getEscapeCallExpression(expression)
    }
    return expression
  } else {
    throw new Error(`Expression type: ${expression.type} isn't supported yet.`)
  }
}

function convertText (text, variables, currentFilters, translations, languages, translationsPaths) {
  const nodes = extract(text).map(({ value, filters = [] }, index) => {
    if (value.includes('{') && value.includes('}')) {
      let property = value.substring(1, value.length - 1)
      const expression = convertToExpression(property)
      filters.forEach(filter => currentFilters.push(filter))
      const name = expression.name
      let unescape = name ? UNESCAPED_NAMES.includes(name) : false
      if (!unescape) {
        filters.forEach(filter => {
          if (isUnescapedFilter(filter)) {
            unescape = true
          }
        })
      }
      return modify(getTemplateNode(expression, variables, unescape), filters, translations, languages, translationsPaths)
    }
    return getLiteral(value)
  })
  if (nodes.length > 1) {
    const expression = convertToBinaryExpression(nodes)
    return [{ type: 'ExpressionStatement', expression }]
  }
  return nodes
}

function modify (node, filters, translations, languages, translationsPaths) {
  if (filters) {
    return filters.reduce((leaf, filter) => {
      const tree = new AbstractSyntaxTree(filter)
      const node = tree.body()[0].expression
      if (node.type === 'CallExpression') {
        return {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: getFilterName(node.callee.name)
          },
          arguments: [leaf].concat(node.arguments)
        }
      }
      const args = [leaf]
      if (filter === 'translate') {
        const { type, value } = leaf
        if (!languages) throw new Error('Compiler option is undefined: languages.')
        if (type === 'Literal') {
          translations = mergeTranslations(value, translations, languages, translationsPaths)
        }
        const expression = {
          type: 'MemberExpression',
          object: {
            type: 'Identifier',
            name: OBJECT_VARIABLE
          },
          property: {
            type: 'Identifier',
            name: 'language'
          }
        }
        args.push(expression)
      }
      return {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: getFilterName(node.name)
        },
        arguments: args
      }
    }, node)
  }
  return node
}

function convertTag (fragment, variables, currentFilters, translations, languages, translationsPaths, options) {
  let node = fragment.tagName
  let parts = []
  let tag = fragment.attributes.find(attr => attr.key === 'tag' || attr.key === 'tag.bind')
  if (tag) {
    const property = tag.key === 'tag' ? tag.value.substring(1, tag.value.length - 1) : tag.value
    parts.push(getLiteral('<'))
    parts.push(getObjectMemberExpression(property))
  } else {
    parts.push(getLiteral(`<${node}`))
  }
  let allowed = fragment.attributes.filter(attr => attr.key !== 'html' && attr.key !== 'text' && attr.key !== 'tag' && attr.key !== 'tag.bind')
  if (allowed.length) {
    allowed.forEach(attr => {
      if (BOOLEAN_ATTRIBUTES.includes(getName(attr.key))) {
        const expression = getLiteral(` ${getName(attr.key)}`)
        if (!attr.value) {
          parts.push(expression)
        } else {
          parts.push({
            type: 'IfStatement',
            test: convertAttribute(attr.key, attr.value, variables, currentFilters, translations, languages, translationsPaths),
            consequent: {
              type: 'BlockStatement',
              body: [getTemplateAssignmentExpression(options.variables.template, expression)]
            }
          })
        }
      } else {
        parts.push(getLiteral(` ${getName(attr.key)}="`))
        let { value } = attr
        parts.push(convertAttribute(attr.key, value, variables, currentFilters, translations, languages, translationsPaths))
        parts.push(getLiteral('"'))
      }
    })
  }
  parts.push(getLiteral('>'))
  const leaf = convertHtmlOrTextAttribute(fragment, variables, currentFilters, translations, languages, translationsPaths)
  if (leaf) {
    parts.push(leaf)
  }
  return parts
}

function convertKey (key, variables) {
  const tree = convertToExpression(key)
  return getTemplateNode(tree, variables, true)
}

module.exports = {
  convertHtmlOrTextAttribute,
  convertAttribute,
  convertText,
  convertTag,
  convertToExpression,
  convertToBinaryExpression,
  convertKey
}
