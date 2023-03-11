function merge_time_series(a, b) {
  const compare = (a,b)=>{return a-b;}
  // console.time("concat unique")
  function uniq(a) {
      var seen = {};
      return a.filter(function(item) {
          return seen.hasOwnProperty(item) ? false : (seen[item] = true);
      });
  }
  // first elements are timestamps... construct merged timestamps
  var ts = a[0].concat(b[0])
  ts = uniq(ts)
  //console.timeEnd("concat unique");
  /*
  console.time('new merge');
  var seen = {}
  a[0].forEach(item=>seen[item]=true)
  b[0].forEach(item=>seen[item]=true)
  ts = Object.keys(seen);
  console.timeEnd('new merge')
  console.log(ts)
  */
  //console.time("sort");
  ts.sort(compare);
  //console.timeEnd("sort");
  //console.time('merge')
  function mergewithnull(a, c) {

      let hash={}
      a[0].forEach( (elt,idx) => hash[elt] = a[1][idx])
      // console.log(hash)
      var d = c.map(elt=> hash[elt]!==undefined ? hash[elt] : null)
      // console.log(d)

    return d
  }
  
  a = mergewithnull(a, ts)
  b = mergewithnull(b, ts)
  // console.timeEnd('merge')
  return [ts, a,b]
}

function merge_data(a, b) {
  let number_of_traces = a.length - 1;
  // console.log('merge_data', number_of_traces);
  var data, ts, new_row, last_row;
  if (number_of_traces > 1) {
      for (let idx=1; idx<a.length; idx++) {
        [ts, new_row, last_row] = merge_time_series([a[0], a[idx]], b);
        if (idx==1) {
          data = [ts, new_row];
        } else {
          data.push(new_row)
        }
      }
      data.push(last_row)
  } else {
      data = merge_time_series(a,b);
  }
  return data;
}

exports.merge_data = merge_data
exports.merge_time_series = merge_time_series
