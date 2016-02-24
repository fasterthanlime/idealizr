# idealizr

[![Build Status](https://travis-ci.org/fasterthanlime/idealizr.svg?branch=master)](https://travis-ci.org/fasterthanlime/idealizr)

normalizr normalizes deeply nested JSON API responses according to a schema for [Flux](https://facebook.github.io/flux) and [Redux](http://rackt.github.io/redux) apps.  
Kudos to Jing Chen for suggesting this approach.

idealizr is a fork of [normalizr](https://github.com/gaearon/normalizr) which uses the `_id` or `_ids` suffix when
normalizing data.

## Installation

```
npm install --save idealizr
```

## Running Tests

```
git clone https://github.com/fasterthanlime/idealizr.git
cd idealizr
npm install
npm test # run tests once
```
