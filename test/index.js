'use strict'

const test = require('tape')
const normalizr = require('../src')
const normalize = normalizr.normalize
const Schema = normalizr.Schema
const arrayOf = normalizr.arrayOf
const valuesOf = normalizr.valuesOf
const unionOf = normalizr.unionOf
const isEqual = require('../src/nodash').isEqual
const isObject = require('../src/nodash').isObject
const assign = require('deep-assign')

test('fails creating nameless schema', function (t) {
  t.throws(function () {
    new Schema() // eslint-disable-line no-new
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

test('can normalize nested entity and delete an existing key using custom function', function (t) {
  const article = new Schema('articles')
  const type = new Schema('types')

  article.define({
    type: type
  })

  const input = {
    id: 1,
    title: 'Some Article',
    isFavorite: false,
    typeId: 1,
    type: {
      id: 1
    }
  }

  Object.freeze(input)

  const options = {
    assignEntity: function (obj, key, val) {
      obj[key] = val
      delete obj[key + 'Id']
    }
  }

  t.same(normalize(input, article, options), {
    result: 1,
    entities: {
      articles: {
        1: {
          id: 1,
          title: 'Some Article',
          isFavorite: false,
          type: 1
        }
      },
      types: {
        1: {
          id: 1
        }
      }
    }
  })
  t.end()
})

test('can merge into entity using custom function', function (t) {
  const author = new Schema('authors')

  const input = {
    author: {
      id: 1,
      name: 'Ada Lovelace',
      contact: {
        phone: '555-0100'
      }
    },
    reviewer: {
      id: 1,
      name: 'Ada Lovelace',
      contact: {
        email: 'ada@lovelace.com'
      }
    }
  }

  Object.freeze(input)

  const options = {
    mergeIntoEntity: function (entityA, entityB, entityKey) {
      var key

      for (key in entityB) {
        if (!entityB.hasOwnProperty(key)) {
          continue
        }

        if (!entityA.hasOwnProperty(key) || isEqual(entityA[key], entityB[key])) {
          entityA[key] = entityB[key]
          continue
        }

        if (isObject(entityA[key]) && isObject(entityB[key])) {
          assign(entityA[key], entityB[key])
          continue
        }

        console.warn('Unequal data!')
      }
    }
  }

  t.same(normalize(input, valuesOf(author), options), {
    result: {
      author: 1,
      reviewer: 1
    },
    entities: {
      authors: {
        1: {
          id: 1,
          name: 'Ada Lovelace',
          contact: {
            phone: '555-0100',
            email: 'ada@lovelace.com'
          }
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

test('can normalize a polymorphic array with schema attribute', function (t) {
  const article = new Schema('articles')
  const tutorial = new Schema('tutorials')
  const articleOrTutorial = { articles: article, tutorials: tutorial }

  const input = [{
    id: 1,
    type: 'articles',
    title: 'Some Article'
  }, {
    id: 1,
    type: 'tutorials',
    title: 'Some Tutorial'
  }]

  Object.freeze(input)

  t.same(normalize(input, arrayOf(articleOrTutorial, { schemaAttribute: 'type' })), {
    result: [
      {id: 1, schema: 'articles'},
      {id: 1, schema: 'tutorials'}
    ],
    entities: {
      articles: {
        1: {
          id: 1,
          type: 'articles',
          title: 'Some Article'
        }
      },
      tutorials: {
        1: {
          id: 1,
          type: 'tutorials',
          title: 'Some Tutorial'
        }
      }
    }
  })
  t.end()
})

test('can normalize a polymorphic array with schema attribute function', function (t) {
  function guessSchema (item) {
    return item.type + 's'
  }

  const article = new Schema('articles')
  const tutorial = new Schema('tutorials')
  const articleOrTutorial = { articles: article, tutorials: tutorial }

  const input = [{
    id: 1,
    type: 'article',
    title: 'Some Article'
  }, {
    id: 1,
    type: 'tutorial',
    title: 'Some Tutorial'
  }]

  Object.freeze(input)

  t.same(normalize(input, arrayOf(articleOrTutorial, { schemaAttribute: guessSchema })), {
    result: [
      { id: 1, schema: 'articles' },
      { id: 1, schema: 'tutorials' }
    ],
    entities: {
      articles: {
        1: {
          id: 1,
          type: 'article',
          title: 'Some Article'
        }
      },
      tutorials: {
        1: {
          id: 1,
          type: 'tutorial',
          title: 'Some Tutorial'
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
      one: 1,
      two: 2
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

test('can normalize a polymorphic map with schema attribute', function (t) {
  const article = new Schema('articles')
  const tutorial = new Schema('tutorials')
  const articleOrTutorial = { articles: article, tutorials: tutorial }

  const input = {
    one: {
      id: 1,
      type: 'articles',
      title: 'Some Article'
    },
    two: {
      id: 2,
      type: 'articles',
      title: 'Another Article'
    },
    three: {
      id: 1,
      type: 'tutorials',
      title: 'Some Tutorial'
    }
  }

  Object.freeze(input)

  t.same(normalize(input, valuesOf(articleOrTutorial, { schemaAttribute: 'type' })), {
    result: {
      one: {id: 1, schema: 'articles'},
      two: {id: 2, schema: 'articles'},
      three: {id: 1, schema: 'tutorials'}
    },
    entities: {
      articles: {
        1: {
          id: 1,
          type: 'articles',
          title: 'Some Article'
        },
        2: {
          id: 2,
          type: 'articles',
          title: 'Another Article'
        }
      },
      tutorials: {
        1: {
          id: 1,
          type: 'tutorials',
          title: 'Some Tutorial'
        }
      }
    }
  })
  t.end()
})

test('can normalize a polymorphic map with schema attribute function', function (t) {
  const guessSchema = function (item) {
    return item.type + 's'
  }

  const article = new Schema('articles')
  const tutorial = new Schema('tutorials')
  const articleOrTutorial = { articles: article, tutorials: tutorial }

  const input = {
    one: {
      id: 1,
      type: 'article',
      title: 'Some Article'
    },
    two: {
      id: 2,
      type: 'article',
      title: 'Another Article'
    },
    three: {
      id: 1,
      type: 'tutorial',
      title: 'Some Tutorial'
    }
  }

  Object.freeze(input)

  t.same(normalize(input, valuesOf(articleOrTutorial, { schemaAttribute: guessSchema })), {
    result: {
      one: {id: 1, schema: 'articles'},
      two: {id: 2, schema: 'articles'},
      three: {id: 1, schema: 'tutorials'}
    },
    entities: {
      articles: {
        1: {
          id: 1,
          type: 'article',
          title: 'Some Article'
        },
        2: {
          id: 2,
          type: 'article',
          title: 'Another Article'
        }
      },
      tutorials: {
        1: {
          id: 1,
          type: 'tutorial',
          title: 'Some Tutorial'
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
          author: 3
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
      feed: [1, 2]
    },
    entities: {
      articles: {
        1: {
          id: 1,
          title: 'Some Article',
          author: 3,
          collections: [1, 7]
        },
        2: {
          id: 2,
          title: 'Other Article',
          author: 2,
          collections: [2]
        }
      },
      collections: {
        1: {
          id: 1,
          title: 'Awesome Writing',
          curator: 4
        },
        2: {
          id: 2,
          title: 'Neverhood',
          curator: 120
        },
        7: {
          id: 7,
          title: 'Even Awesomer',
          curator: 100
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

test('can normalize deeply nested entities with polymorphic arrays', function (t) {
  const article = new Schema('articles')
  const tutorial = new Schema('tutorials')
  const articleOrTutorial = { articles: article, tutorials: tutorial }
  const user = new Schema('users')
  const collection = new Schema('collections')

  article.define({
    author: user,
    collections: arrayOf(collection)
  })

  tutorial.define({
    author: user,
    collections: arrayOf(collection)
  })

  collection.define({
    curator: user
  })

  const feedSchema = {
    feed: arrayOf(articleOrTutorial, { schemaAttribute: 'type' })
  }

  const input = {
    feed: [{
      id: 1,
      type: 'articles',
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
      id: 1,
      type: 'tutorials',
      title: 'Some Tutorial',
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
      feed: [
        { id: 1, schema: 'articles' },
        { id: 1, schema: 'tutorials' }
      ]
    },
    entities: {
      articles: {
        1: {
          id: 1,
          type: 'articles',
          title: 'Some Article',
          author: 3,
          collections: [1, 7]
        }
      },
      tutorials: {
        1: {
          id: 1,
          type: 'tutorials',
          title: 'Some Tutorial',
          author: 2,
          collections: [2]
        }
      },
      collections: {
        1: {
          id: 1,
          title: 'Awesome Writing',
          curator: 4
        },
        2: {
          id: 2,
          title: 'Neverhood',
          curator: 120
        },
        7: {
          id: 7,
          title: 'Even Awesomer',
          curator: 100
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
      feed: [1, 2, 3],
      suggestions: {
        1: [2, 3]
      }
    },
    entities: {
      articles: {
        1: {
          id: 1,
          title: 'Some Article',
          collaborators: {
            authors: [3],
            reviewers: [2]
          }
        },
        2: {
          id: 2,
          title: 'Other Article',
          collaborators: {
            authors: [2]
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

test('can normalize deeply nested entities with polymorphic maps', function (t) {
  const article = new Schema('articles')
  const user = new Schema('users')
  const group = new Schema('groups')
  const userOrGroup = { users: user, groups: group }

  article.define({
    collaborators: valuesOf(userOrGroup, { schemaAttribute: 'type' })
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
        author: {
          id: 3,
          type: 'users',
          name: 'Mike Persson'
        },
        reviewer: {
          id: 2,
          type: 'groups',
          name: 'Reviewer Group'
        }
      }
    }, {
      id: 2,
      title: 'Other Article',
      collaborators: {
        author: {
          id: 2,
          type: 'users',
          name: 'Pete Hunt'
        }
      }
    }, {
      id: 3,
      title: 'Last Article'
    }],
    suggestions: {
      1: [{
        id: 2,
        title: 'Other Article'
      }, {
        id: 3,
        title: 'Last Article'
      }]
    }
  }

  Object.freeze(input)

  t.same(normalize(input, feedSchema), {
    result: {
      feed: [1, 2, 3],
      suggestions: {
        1: [2, 3]
      }
    },
    entities: {
      articles: {
        1: {
          id: 1,
          title: 'Some Article',
          collaborators: {
            author: { id: 3, schema: 'users' },
            reviewer: { id: 2, schema: 'groups' }
          }
        },
        2: {
          id: 2,
          title: 'Other Article',
          collaborators: {
            author: { id: 2, schema: 'users' }
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
          type: 'users',
          name: 'Pete Hunt'
        },
        3: {
          id: 3,
          type: 'users',
          name: 'Mike Persson'
        }
      },
      groups: {
        2: {
          id: 2,
          type: 'groups',
          name: 'Reviewer Group'
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
      feed: [1]
    },
    entities: {
      articles: {
        1: {
          id: 1,
          title: 'Some Article',
          collections: [1, 7]
        }
      },
      collections: {
        1: {
          id: 1,
          title: 'Awesome Writing',
          subscribers: [4, 100]
        },
        7: {
          id: 7,
          title: 'Even Awesomer',
          subscribers: [100]
        }
      },
      users: {
        4: {
          id: 4,
          name: 'Andy Warhol',
          articles: [1]
        },
        100: {
          id: 100,
          name: 'T.S. Eliot',
          articles: [1]
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
          parent: 7
        },
        7: {
          id: 7,
          name: 'Tom Dale',
          parent: 4
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
          books: [1],
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
        1: {
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
          books: [1]
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

test('can normalize a polymorphic union field and array and map', function (t) {
  const user = new Schema('users')
  const group = new Schema('groups')
  const member = unionOf({
    users: user,
    groups: group
  }, { schemaAttribute: 'type' })

  group.define({
    members: arrayOf(member),
    owner: member,
    relations: valuesOf(member)
  })

  const input = {
    group: {
      id: 1,
      name: 'facebook',
      members: [{
        id: 2,
        type: 'groups',
        name: 'react'
      }, {
        id: 3,
        type: 'users',
        name: 'Huey'
      }],
      owner: {
        id: 4,
        type: 'users',
        name: 'Jason'
      },
      relations: {
        friend: {
          id: 5,
          type: 'users',
          name: 'Nate'
        }
      }
    }
  }

  Object.freeze(input)

  t.same(normalize(input, { group: group }), {
    result: {
      group: 1
    },
    entities: {
      groups: {
        1: {
          id: 1,
          name: 'facebook',
          members: [{
            id: 2,
            schema: 'groups'
          }, {
            id: 3,
            schema: 'users'
          }],
          owner: {
            id: 4,
            schema: 'users'
          },
          relations: {
            friend: {
              id: 5,
              schema: 'users'
            }
          }
        },
        2: {
          id: 2,
          type: 'groups',
          name: 'react'
        }
      },
      users: {
        3: {
          id: 3,
          type: 'users',
          name: 'Huey'
        },
        4: {
          id: 4,
          type: 'users',
          name: 'Jason'
        },
        5: {
          id: 5,
          type: 'users',
          name: 'Nate'
        }
      }
    }
  })
  t.end()
})

test('fails creating union schema without schemaAttribute', function (t) {
  t.throws(function () {
    const user = new Schema('users')
    const group = new Schema('groups')
    unionOf({
      users: user,
      groups: group
    })
  })
  t.end()
})
