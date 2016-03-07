'use strict'

const test = require('tape')
const normalizr = require('../src')
const normalize = normalizr.normalize
const Schema = normalizr.Schema
const arrayOf = normalizr.arrayOf
const valuesOf = normalizr.valuesOf

test('fails creating nameless schema', function (t) {
  t.throws(function () {
    new Schema() // eslint-disable-line no-new
  })
  t.end()
})

test('fails creating specless iterable schema', function (t) {
  t.throws(function () {
    arrayOf()
  })
  t.end()
})

test('fails creating entity with non-string name', function (t) {
  t.throws(function () {
    new Schema(42) // eslint-disable-line no-new
  })
  t.end()
})

test('fails normalizing something other than array or object', function (t) {
  t.throws(function () {
    normalize(42, {})
  })

  t.throws(function () {
    normalize(null, {})
  })

  t.throws(function () {
    normalize(undefined, {})
  })

  t.throws(function () {
    normalize('42', {})
  })
  t.end()
})

test('fails normalizing without an object schema', function (t) {
  t.throws(function () {
    normalize({})
  })

  t.throws(function () {
    normalize({}, '42')
  })

  t.throws(function () {
    normalize({}, [])
  })
  t.end()
})

test('can normalize single entity', function (t) {
  const article = new Schema('articles')

  const input = {
    id: 1,
    title: 'Some Article',
    isFavorite: false
  }

  Object.freeze(input)

  t.equal(article.getIdAttribute(), 'id')
  t.equal(article.getKey(), 'articles')

  t.same(normalize(input, article), {
    result: 1,
    entities: {
      articles: {
        1: {
          id: 1,
          title: 'Some Article',
          isFavorite: false
        }
      }
    }
  })

  t.end()
})

test('can normalize single entity with custom id attribute', function (t) {
  const article = new Schema('articles', { idAttribute: 'slug' })

  const input = {
    id: 1,
    slug: 'some-article',
    title: 'Some Article',
    isFavorite: false
  }

  Object.freeze(input)

  t.equal(article.getIdAttribute(), 'slug')
  t.equal(article.getKey(), 'articles')

  t.same(normalize(input, article), {
    result: 'some-article',
    entities: {
      articles: {
        'some-article': {
          id: 1,
          slug: 'some-article',
          title: 'Some Article',
          isFavorite: false
        }
      }
    }
  })
  t.end()
})

test('can normalize single entity with custom id attribute function', function (t) {
  function makeSlug (article) {
    const posted = article.posted
    const title = article.title.toLowerCase().replace(' ', '-')

    return [title, posted.year, posted.month, posted.day].join('-')
  }

  const article = new Schema('articles', { idAttribute: makeSlug })

  const input = {
    id: 1,
    title: 'Some Article',
    isFavorite: false,
    posted: {
      day: 12,
      month: 3,
      year: 1983
    }
  }

  Object.freeze(input)

  t.same(normalize(input, article), {
    result: 'some-article-1983-3-12',
    entities: {
      articles: {
        'some-article-1983-3-12': {
          id: 1,
          title: 'Some Article',
          isFavorite: false,
          posted: {
            day: 12,
            month: 3,
            year: 1983
          }
        }
      }
    }
  })
  t.end()
})

test('can normalize an array', function (t) {
  const article = new Schema('articles')

  const input = [{
    id: 1,
    title: 'Some Article'
  }, {
    id: 2,
    title: 'Other Article'
  }]

  Object.freeze(input)

  t.same(normalize(input, arrayOf(article)), {
    result: [1, 2],
    entities: {
      articles: {
        1: {
          id: 1,
          title: 'Some Article'
        },
        2: {
          id: 2,
          title: 'Other Article'
        }
      }
    }
  })
  t.end()
})

test('can normalize a map', function (t) {
  const article = new Schema('articles')

  const input = {
    one: {
      id: 1,
      title: 'Some Article'
    },
    two: {
      id: 2,
      title: 'Other Article'
    }
  }

  Object.freeze(input)

  t.same(normalize(input, valuesOf(article)), {
    result: {
      one_id: 1,
      two_id: 2
    },
    entities: {
      articles: {
        1: {
          id: 1,
          title: 'Some Article'
        },
        2: {
          id: 2,
          title: 'Other Article'
        }
      }
    }
  })
  t.end()
})

test('can normalize nested entities', function (t) {
  const article = new Schema('articles')
  const user = new Schema('users')

  article.define({
    author: user
  })

  const input = {
    id: 1,
    title: 'Some Article',
    author: {
      id: 3,
      name: 'Mike Persson'
    }
  }

  Object.freeze(input)

  t.same(normalize(input, article), {
    result: 1,
    entities: {
      articles: {
        1: {
          id: 1,
          title: 'Some Article',
          author_id: 3
        }
      },
      users: {
        3: {
          id: 3,
          name: 'Mike Persson'
        }
      }
    }
  })
  t.end()
})

test('can normalize deeply nested entities with arrays', function (t) {
  const article = new Schema('articles')
  const user = new Schema('users')
  const collection = new Schema('collections')

  article.define({
    author: user,
    collections: arrayOf(collection)
  })

  collection.define({
    curator: user
  })

  const feedSchema = {
    feed: arrayOf(article)
  }

  const input = {
    feed: [{
      id: 1,
      title: 'Some Article',
      author: {
        id: 3,
        name: 'Mike Persson'
      },
      collections: [{
        id: 1,
        title: 'Awesome Writing',
        curator: {
          id: 4,
          name: 'Andy Warhol'
        }
      }, {
        id: 7,
        title: 'Even Awesomer',
        curator: {
          id: 100,
          name: 'T.S. Eliot'
        }
      }]
    }, {
      id: 2,
      title: 'Other Article',
      collections: [{
        id: 2,
        title: 'Neverhood',
        curator: {
          id: 120,
          name: 'Ada Lovelace'
        }
      }],
      author: {
        id: 2,
        name: 'Pete Hunt'
      }
    }]
  }

  Object.freeze(input)

  t.same(normalize(input, feedSchema), {
    result: {
      feed_ids: [1, 2]
    },
    entities: {
      articles: {
        1: {
          id: 1,
          title: 'Some Article',
          author_id: 3,
          collection_ids: [1, 7]
        },
        2: {
          id: 2,
          title: 'Other Article',
          author_id: 2,
          collection_ids: [2]
        }
      },
      collections: {
        1: {
          id: 1,
          title: 'Awesome Writing',
          curator_id: 4
        },
        2: {
          id: 2,
          title: 'Neverhood',
          curator_id: 120
        },
        7: {
          id: 7,
          title: 'Even Awesomer',
          curator_id: 100
        }
      },
      users: {
        2: {
          id: 2,
          name: 'Pete Hunt'
        },
        3: {
          id: 3,
          name: 'Mike Persson'
        },
        4: {
          id: 4,
          name: 'Andy Warhol'
        },
        100: {
          id: 100,
          name: 'T.S. Eliot'
        },
        120: {
          id: 120,
          name: 'Ada Lovelace'
        }
      }
    }
  })
  t.end()
})

test('can normalize deeply nested entities with maps', function (t) {
  const article = new Schema('articles')
  const user = new Schema('users')

  article.define({
    collaborators: valuesOf(arrayOf(user))
  })

  const feedSchema = {
    feed: arrayOf(article),
    suggestions: valuesOf(arrayOf(article))
  }

  const input = {
    feed: [{
      id: 1,
      title: 'Some Article',
      collaborators: {
        authors: [{
          id: 3,
          name: 'Mike Persson'
        }],
        reviewers: [{
          id: 2,
          name: 'Pete Hunt'
        }]
      }
    }, {
      id: 2,
      title: 'Other Article',
      collaborators: {
        authors: [{
          id: 2,
          name: 'Pete Hunt'
        }]
      }
    }, {
      id: 3,
      title: 'Last Article'
    }],
    suggestions: {
      1: [{
        id: 2,
        title: 'Other Article',
        collaborators: {
          authors: [{
            id: 2,
            name: 'Pete Hunt'
          }]
        }
      }, {
        id: 3,
        title: 'Last Article'
      }]
    }
  }

  Object.freeze(input)

  t.same(normalize(input, feedSchema), {
    result: {
      feed_ids: [1, 2, 3],
      suggestions: {
        '1_ids': [2, 3]
      }
    },
    entities: {
      articles: {
        1: {
          id: 1,
          title: 'Some Article',
          collaborators: {
            author_ids: [3],
            reviewer_ids: [2]
          }
        },
        2: {
          id: 2,
          title: 'Other Article',
          collaborators: {
            author_ids: [2]
          }
        },
        3: {
          id: 3,
          title: 'Last Article'
        }
      },
      users: {
        2: {
          id: 2,
          name: 'Pete Hunt'
        },
        3: {
          id: 3,
          name: 'Mike Persson'
        }
      }
    }
  })
  t.end()
})

test('can normalize mutually recursive entities', function (t) {
  const article = new Schema('articles')
  const user = new Schema('users')
  const collection = new Schema('collections')

  user.define({
    articles: arrayOf(article)
  })

  article.define({
    collections: arrayOf(collection)
  })

  collection.define({
    subscribers: arrayOf(user)
  })

  const feedSchema = {
    feed: arrayOf(article)
  }

  const input = {
    feed: [{
      id: 1,
      title: 'Some Article',
      collections: [{
        id: 1,
        title: 'Awesome Writing',
        subscribers: [{
          id: 4,
          name: 'Andy Warhol',
          articles: [{
            id: 1,
            title: 'Some Article'
          }]
        }, {
          id: 100,
          name: 'T.S. Eliot',
          articles: [{
            id: 1,
            title: 'Some Article'
          }]
        }]
      }, {
        id: 7,
        title: 'Even Awesomer',
        subscribers: [{
          id: 100,
          name: 'T.S. Eliot',
          articles: [{
            id: 1,
            title: 'Some Article'
          }]
        }]
      }]
    }]
  }

  Object.freeze(input)

  t.same(normalize(input, feedSchema), {
    result: {
      feed_ids: [1]
    },
    entities: {
      articles: {
        1: {
          id: 1,
          title: 'Some Article',
          collection_ids: [1, 7]
        }
      },
      collections: {
        1: {
          id: 1,
          title: 'Awesome Writing',
          subscriber_ids: [4, 100]
        },
        7: {
          id: 7,
          title: 'Even Awesomer',
          subscriber_ids: [100]
        }
      },
      users: {
        4: {
          id: 4,
          name: 'Andy Warhol',
          article_ids: [1]
        },
        100: {
          id: 100,
          name: 'T.S. Eliot',
          article_ids: [1]
        }
      }
    }
  })
  t.end()
})

test('can normalize self-recursive entities', function (t) {
  const user = new Schema('users')

  user.define({
    parent: user
  })

  const input = {
    id: 1,
    name: 'Andy Warhol',
    parent: {
      id: 7,
      name: 'Tom Dale',
      parent: {
        id: 4,
        name: 'Pete Hunt'
      }
    }
  }

  Object.freeze(input)

  t.same(normalize(input, user), {
    result: 1,
    entities: {
      users: {
        1: {
          id: 1,
          name: 'Andy Warhol',
          parent_id: 7
        },
        7: {
          id: 7,
          name: 'Tom Dale',
          parent_id: 4
        },
        4: {
          id: 4,
          name: 'Pete Hunt'
        }
      }
    }
  })
  t.end()
})

test('can merge entities', function (t) {
  const writer = new Schema('writers')
  const book = new Schema('books')
  const schema = arrayOf(writer)

  writer.define({
    books: arrayOf(book)
  })

  const input = [{
    id: 3,
    name: 'Jo Rowling',
    isBritish: true,
    location: {
      x: 100,
      y: 200,
      nested: ['hello', {
        world: true
      }]
    },
    books: [{
      id: 1,
      soldWell: true,
      name: 'Harry Potter'
    }]
  }, {
    id: 3,
    name: 'Jo Rowling',
    bio: 'writer',
    location: {
      x: 100,
      y: 200,
      nested: ['hello', {
        world: true
      }]
    },
    books: [{
      id: 1,
      isAwesome: true,
      name: 'Harry Potter'
    }]
  }]

  t.same(normalize(input, schema), {
    result: [3, 3],
    entities: {
      writers: {
        3: {
          id: 3,
          isBritish: true,
          name: 'Jo Rowling',
          bio: 'writer',
          book_ids: [1],
          location: {
            x: 100,
            y: 200,
            nested: ['hello', {
              world: true
            }]
          }
        }
      },
      books: {
        '1': {
          id: 1,
          isAwesome: true,
          soldWell: true,
          name: 'Harry Potter'
        }
      }
    }
  })
  t.end()
})

test('warns about inconsistencies when merging entities', function (t) {
  const writer = new Schema('writers')
  const book = new Schema('books')
  const schema = arrayOf(writer)

  writer.define({
    books: arrayOf(book)
  })

  const input = [{
    id: 3,
    name: 'Jo Rowling',
    books: [{
      id: 1,
      soldWell: true,
      name: 'Harry Potter'
    }]
  }, {
    id: 3,
    name: 'Jo Rowling',
    books: [{
      id: 1,
      soldWell: false,
      name: 'Harry Potter'
    }]
  }]

  let warnCalled = false

  function mockWarn () {
    warnCalled = true
  }

  // XXX don't overwrite globals, even when mocking
  const realConsoleWarn = console.warn
  console.warn = mockWarn

  t.same(normalize(input, schema), {
    result: [3, 3],
    entities: {
      writers: {
        3: {
          id: 3,
          name: 'Jo Rowling',
          book_ids: [1]
        }
      },
      books: {
        1: {
          id: 1,
          soldWell: true,
          name: 'Harry Potter'
        }
      }
    }
  })

  t.ok(warnCalled)
  console.warn = realConsoleWarn
  t.end()
})

test('ignores prototype objects and creates new object', function (t) {
  const writer = new Schema('writers')
  const schema = writer
  const input = {
    id: 'constructor',
    name: 'Constructor',
    isAwesome: true
  }

  t.same(normalize(input, schema), {
    result: 'constructor',
    entities: {
      writers: {
        constructor: {
          id: 'constructor',
          name: 'Constructor',
          isAwesome: true
        }
      }
    }
  })
  t.end()
})
