
function median(values) {
  values.sort(function(a,b){
    return a-b;
  });

  if(values.length ===0) return 0

  var half = Math.floor(values.length / 2);

  if (values.length % 2)
    return values[half];
  else
    return (values[half - 1] + values[half]) / 2.0;
}

function avg(values) {
  var sum = values.reduce((a, b) => a+b);
  return sum / values.length;
}


exports.median = median
exports.avg = avg