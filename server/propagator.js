var propagator = function() {};

var aget = function(arr, idx) {
	if (idx >= 0 && idx < arr.length)
		return arr[idx];
	return 0;
}

var aput = function(arr, idx, value) {
	if (idx >= 0 && idx < arr.length)
		arr[idx] = value;
}

propagator.Linear = function(from, total) {
	var order = [];
	for (var i=0; i<total; i++)
		order.push([(i + from) % total]);
	return order;
}

propagator.LinearRipple = function(from, total) {
	var out = [];
	out.push([from]);
	for (var r=1; r<total; r++) {
		var idx1 = from - r;
		var idx2 = from + r;
		if (idx1 < 0 || idx1 >= total)
			idx1 = -1;
		if (idx2 < 0 || idx2 >= total)
			idx2 = -1;
		if (idx1 != -1 && idx2 != -1) {
			out.push([ idx1, idx2 ]);
		} else if (idx1 != -1) {
			out.push([ idx1 ]);
		} else if (idx2 != -1) {
			out.push([ idx2 ]);
		}
	}
	return out;
}

propagator.CircularRipple = function(from, total) {
	var out = [];
	var left = total;
	out.push([from]);
	left --;
	for (var r=1; r<total; r++) {
		var idx1 = (from - r + total) % total;
		var idx2 = (from + r + total) % total;
		if (left > 0) {
			if (idx1 != -1 && idx2 != -1) {
				out.push([ idx1, idx2 ]);
				left -= 2;
			} else if (idx1 != -1) {
				out.push([ idx1 ]);
				left -= 1;
			} else if (idx2 != -1) {
				out.push([ idx2 ]);
				left -= 1;
			}
		}
	}
	return out;
}

propagator.RandomRipple = function(from, total) {
	var idx = [];
	for (var i=0; i<total; i++)
		idx.push(0);
	var out = [];
	var left = total - 1;
	out.push([from]);
	for (var r=1; r<total; r++) {
		var idx1 = (from - r + total) % total;
		var idx2 = (from + r + total) % total;
		if (idx1 != -1 && idx2 != -1) {
			out.push([ idx1, idx2 ]);
		} else if (idx1 != -1) {
			out.push([ idx1 ]);
		} else if (idx2 != -1) {
			out.push([ idx2 ]);
		}
	}
	return out;
}

exports.Propagator = propagator;