/**
 * SaniJS is an awesome lightweight & powerful text sanitizing library 
 * for javascript.
 */

 /*
annual_salary: sani.CURRENCY,
hours: sani.NUM,
salary_emotion: sani.APPROX_MATCHES('under', 'over', 'right'),
company_size: sani.NUM_RANGE, // numeric range
located: {
  before: (item) => {
    return item.country - item.city
  },
  after: (item) => {
    return "# item"
  }
},
some: {
  chained: [sani.MATCH, sani.NUM]
}
*/

const CURRENCY = {type: "curr"};
const NUM = {type: "num"};
const RANGE = {type: "range"};
const MATCH = {type: "match"}; // does a regex match and replaces with match
const NORMALIZE = {type: "norm"} // EXPERIMENTAL : normalize the string values by similar strings

const APPROX_MATCHES = (...fields) => {
  return {
    type: "match",
    args: fields
  }
}

const REPLACE_MATCH = (...fields) => {
  return {
    type: "replace",
    args: fields
  }
}



/**
 * Cleans a string into a valid number (int or float) and returns
 * it in string format. Returns a value whose number values will return
 * valid number with parseInt and parseFloat.
 * 
 * @param {String} value string value to clean
 * @returns {String} The cleaned string
 */
const cleanNum = (value) => value.replace(/[^0-9.-]/g, '')


/**
 * Code adapted from https://gist.github.com/andrei-m/982927
 * 
 * @param {*} a 
 * @param {*} b 
 */
const levenshteinRatio = (a, b) => {
  if(!a || (a && a.length === 0)) return b.length; 
  if(!b || (b && b.length === 0)) return a.length; 

  var matrix = [];

  // increment along the first column of each row
  var i;
  for(i = 0; i <= b.length; i++){
    matrix[i] = [i];
  }

  // increment each column in the first row
  var j;
  for(j = 0; j <= a.length; j++){
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for(i = 1; i <= b.length; i++){
    for(j = 1; j <= a.length; j++){
      if(b.charAt(i-1) === a.charAt(j-1)){
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                                Math.min(matrix[i][j-1] + 1, // insertion
                                         matrix[i-1][j] + 1)); // deletion
      }
    }
  }

  return ((a.length+b.length) - matrix[b.length][a.length]) / (a.length+b.length)
};


const helpers = {
  curr: (value) => {

  },
  num: (value, isFloat=false) => {
    let clean = value;
    if (value && typeof value !== "number")
      clean = cleanNum(clean)

    return isFloat ? parseFloat(clean) : parseInt(clean)
  },
  range: (value) => {
    // matches any float or integer ranges
    return cleanNum(value+"").match(/(\d+\.?\d*?)-(\d+\.?\d*?)$/)
  },
  match: (value, matches) => {
    const ratios = matches.map(m => [m, levenshteinRatio(value, m)])

    return ratios.sort((a, b) => b[1] - a[1])[0][0]
  },
  replace: (value, matches) => {
    let matched = matches.filter(m => value.indexOf(m) > -1)
    return matched[0] ? matched[0] : value
  },
  email: (value) => {

  }
}


const clean = (data, schema, config) => {
  // config.allowUnknown
  
  if (!data instanceof Array)
    throw new Error("Expected data to be an array.")

  if (schema instanceof Array)
    throw new Error("Expected schema to be an object.")
  else if (!schema instanceof Object)
    throw new Error("Expected schema to be an object.")

  return data.map(item => {
    // we only return the values defined in the schema.
    Object.keys(schema).map(key => {
      const field = schema[key]

      let val = item[key];
      if (field.before && typeof field.before === "function")
        val = field.before(item)

      val = helpers[field.type](val, field.args)

      if (field.after && typeof field.after === "function")
        val = field.after(val)

      item[key] = val
    })

    return item
  })
}


/**
 * Normalize a set of strings to reduce approximate duplicates. This can
 * be quite slow for large datasets.
 *  sani.normalize(dataset, 'job_title')
 * @param {*} dataset 
 * @param {*} field 
 */
const normalize = (dataset, field) => {

}

export default {
  // constants
  NUM,
  RANGE,
  APPROX_MATCHES,
  REPLACE_MATCH,

  // functions
  clean
}