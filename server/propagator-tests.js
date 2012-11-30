var p = require('./propagator').Propagator;

	console.log(p);

exports['one directional linear ripple test'] = function(test) {
	test.deepEqual([[0],[1],[2]], p.Linear(0, 3));
	test.deepEqual([[1],[2],[0]], p.Linear(1, 3));
	test.deepEqual([[2],[0],[1]], p.Linear(2, 3));
	test.done();
}

exports['linear ripple'] = function(test) {
	test.deepEqual([[2],[1,3],[0,4]], p.LinearRipple(2, 5));
	test.deepEqual([[1],[0,2],[3], [4]], p.LinearRipple(1, 5));
	test.deepEqual([[4],[3],[2],[1],[0]], p.LinearRipple(4, 5));
	test.done();
}

exports['circular ripple'] = function(test) {
	// test.deepEqual([[2],[1,3],[0,4]], p.LinearRipple(2, 5));
	test.deepEqual([[1],[0,2],[4,3]], p.CircularRipple(1, 5));
	// test.deepEqual([[4],[3],[2],[1],[0]], p.LinearRipple(4, 5));
	test.done();
}