let https

function getData(url) {
  try {
    https = require('node:https')
    https
      .get(url, (resp) => {
        let data = ''

        resp.on('data', (chunk) => (data += chunk))

        resp.on('end', () => {
          let characters = JSON.parse(data)

          // Order characters keys
          orderKeys(characters, 0, characters)

          // Remove duplicates in arrays
          characters.forEach((character) => {
            for (let value of Object.values(character)) {
              removeDuplicates(value)
            }
          })

          // Remove null, empty, undefined values
          characters.forEach((character) => removeNullLikeValues(character))

          console.log(JSON.stringify(characters))
        })
      })
      .on('error', (err) => {
        console.error('Error: ' + err.message)
      })
  } catch (err) {
    console.error('https support is disabled!', err)
  }
}

function isObjectLike(node) {
  return Object.prototype.toString.call(node) === '[object Object]'
}

function isEqual(node1, node2) {
  // Get key lists for both nodes
  let node1Keys = Object.keys(node1)
  let node2Keys = Object.keys(node2)

  // First compare array lengths
  let sameLength = node1Keys.length === node2Keys.length
  // If sameLength, compare every value at same index
  if (sameLength) {
    let sameKeys = node1Keys.every(
      (element, index) => element === node2Keys[index]
    )

    if (sameKeys) {
      let node1Values = Object.values(node1)
      let node2Values = Object.values(node2)

      let sameValues = node1Values.every((element, index) => {
        if (Array.isArray(element) && Array.isArray(node2Values[index])) {
          return (
            element.length === node2Values[index].length &&
            element.every((value, i) => isEqual(value, node2Values[index][i]))
          )
        } else if (isObjectLike(element) && isObjectLike(node2Values[index])) {
          return isEqual(element, node2Values[index])
        } else {
          return element === node2Values[index]
        }
      })

      return sameValues
    }
  }
  return false
}

function orderKeys(node, index = 0, parent = null) {
  // If it is an array of primitives
  if (Array.isArray(node) && node.every((element) => !isObjectLike(element))) {
    node.sort()
  }
  // If it is an array of objects
  else if (
    Array.isArray(node) &&
    node.every((element) => isObjectLike(element))
  ) {
    node.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    )
    node.forEach((element, index) => orderKeys(element, index, node))
  }
  // If it is an object
  else if (isObjectLike(node)) {
    let orderedObj = Object.keys(node)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
      .reduce((myobj, key) => {
        myobj[key] = node[key]
        return myobj
      }, {})
    parent[index] = orderedObj

    // Loop over each value, if array or object, call orderKeys
    for (let [key, value] of Object.entries(parent[index])) {
      orderKeys(value, key, parent[index])
    }
  }
}

function removeDuplicates(node) {
  // If array of primitives
  if (Array.isArray(node) && node.every((element) => !isObjectLike(element))) {
    let currentValue = null
    node.forEach((element, index) => {
      if (currentValue === element) {
        node.splice(index, 1)
      } else {
        currentValue = element
      }
    })
  }
  // If array of objects
  else if (
    Array.isArray(node) &&
    node.every((element) => isObjectLike(element))
  ) {
    let currentObj = {}
    node.forEach((element, index) => {
      if (isEqual(currentObj, element)) {
        node.splice(index, 1)
      } else {
        currentObj = element
      }
    })
  }
}

function removeNullLikeValues(character) {
  for (let [key, value] of Object.entries(character)) {
    // If empy array or object, delete
    if (Array.isArray(value) && value.length === 0) {
      delete character[key]
    }

    if (isObjectLike(value) && Object.keys(value).length === 0) {
      delete character[key]
    }

    if (isObjectLike(value)) {
      removeNullLikeValues(value)
      if (Object.keys(value).length === 0) {
        delete character[key]
      }
    }

    // If array of primitives
    if (
      Array.isArray(value) &&
      value.every((element) => !isObjectLike(element))
    ) {
      character[key] = value.filter(
        (element) => element !== null && element !== undefined && element !== ''
      )
      if (character[key].length === 0) {
        delete character[key]
      }
    }
    // If array of objects
    else if (
      Array.isArray(value) &&
      value.every((element) => isObjectLike(element))
    ) {
      value.forEach((element) => {
        removeNullLikeValues(element)
      })
    } else {
      if (value === null || value === undefined || value === '') {
        delete character[key]
      }
    }
  }
}

getData('https://coderbyte.com/api/challenges/json/wizard-list')
