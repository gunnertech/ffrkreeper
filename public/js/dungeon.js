(function() {
	var isLoading = false;
	var pageNumber = 0;
	var triggerPoint = 2000; // px from the bottom
	var appendPoint = $('.appendPoint')
	$(window).on("scroll", _.debounce(watchScroll, 300));

	function fetch() {
		isLoading = true

		$.get('/dungeons/' + pageNumber, function(data) {
			appendPoint.append(data);
			isLoading = false;
		});
	}

	function watchScroll () {
		if((($(window).scrollTop() + $(window).height()) + triggerPoint >= $(document).height()) && isLoading === false) {
			console.log('loading MOAR');
			pageNumber++;
			fetch();
		}
	}

})();