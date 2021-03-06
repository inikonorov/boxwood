const test = require('ava')
const path = require('path')
const compile = require('../../../helpers/compile')
const { escape } = require('../../../..')

test('img: inline for jpg', async assert => {
  const { template, warnings, errors } = await compile(`
    <div class="foo"></div>
    <style inline>
      .foo { background: url('./placeholder.jpg') }
    </style>
  `, { paths: [path.join(__dirname, '../../../fixtures/images')] })
  assert.deepEqual(template({}, escape), `<div class="foo"></div><style>.foo{background:url(data:image/jpg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD//gA+Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2NjIpLCBkZWZhdWx0IHF1YWxpdHkK/9sAQwAIBgYHBgUIBwcHCQkICgwUDQwLCwwZEhMPFB0aHx4dGhwcICQuJyAiLCMcHCg3KSwwMTQ0NB8nOT04MjwuMzQy/9sAQwEJCQkMCwwYDQ0YMiEcITIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy/8AAEQgA+gD6AwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A9MooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACoJ722tmCyyhWPbrU9VIrZYXuZp9h8xidx7L2BzQBOZoxAZt48sDduHPFV01Wyd1RZssxwBtPX8qohtuiXRGREZGEef7pI/+vVqG9tTIkZhePdwjPHgN9KALc9zDbKGmkCA9PenQzRzxiSJwynuKpogm1iZnG7yUVVB7Z5ogUQavNGgwskYkwOmc4oAv0VWvjOlsZLdsOh3EYzuHcVBFePeXUYt2xCq7pTgHk9FoA0Krf2haCbyvPXfnGPf61NKrNE6ocMVIB9DWfcQQWujmKQJu2YGB1f2/GgC/NNHbxGSVtqDqcZqGLUrSeVY45dzt0G0j+lVr1/L0618/OS8e/wBfU/yqa3vLeWcR+S8Uh5USJtJ+lAE1xeW9qQJpQpPQdT+lSo6yIHRgynoRVGzRZru7ncBmEhjGewFLYKIrm7t14RHDKPTIzQBfooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigArJmmhuryRLmdUgibaIycbz3JrWqFrS2ZizW8RJOSSg5oAhmuoUszJEiTRIQCF6Af/Wqvf3MF1AkEDiSWR12he3PX2rRSKOJSscaop5IUYFIkEUbFo4kQnqVUCgCk0q2eqyNKdsc6DDHpkdqW1cXOozXKcxKgjVvXnJq88aSLtkRWX0YZFKqqihVUKo6ADAoAgvbgWtq0mMt0UepNUdPV7C5+yy4/fKHU/wC13FajxpIVLorFTkZGcGho0cqXRWKnKkjOD7UAEjiONnbooJNZVtLbSuLq7uI2lPKoW4j/AA9a1mUMpVgCCMEHvUP2O1/59of+/YoAZdXUcKQysgeJmHz/AN30NV7ieK6u7SOBg7rJvYrzhR15rQ2Js2bV2Yxtxxikjhjiz5caJnrtUCgChDPHZ3lzFOwQO/mIx6HPWpNOJlkubrBCyuNue4HGatyRRygCSNXA6bhmngAAADAFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAH//2Q==)}</style>`)
  assert.deepEqual(warnings, [])
  assert.deepEqual(errors, [])
})

test('img: inline for svg', async assert => {
  const { template, warnings, errors } = await compile(`
    <div class="foo"></div>
    <style inline>
      .foo { background: url('./placeholder.svg') }
    </style>
  `, { paths: [path.join(__dirname, '../../../fixtures/images')] })
  assert.deepEqual(template({}, escape), `<div class="foo"></div><style>.foo{background:url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjEwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIxMDAiIHN0eWxlPSJmaWxsOnJnYigwLDAsMjU1KTtzdHJva2Utd2lkdGg6MTA7c3Ryb2tlOnJnYigwLDAsMCkiIC8+PC9zdmc+Cg==)}</style>`)
  assert.deepEqual(warnings, [])
  assert.deepEqual(errors, [])
})
