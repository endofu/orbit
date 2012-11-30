exports.Propagator = function(type, from, total) {
	var order = [];
	for (var i=0; i<total; i++)
		order.push((i + from) % total);
	return order;
}
