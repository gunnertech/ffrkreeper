(function() {
	var isLoading = false;
	var pageNumber = 0;
	var triggerPoint = 2000; // px from the bottom
	var appendPoint = $('.appendPoint');
	var loadingIcon = $('.loading');
	var stopWatchingScroll = false;
	$(window).on("scroll", _.debounce(watchScroll, 300));

	function fetch() {
		isLoading = true
		loadingIcon.show()

		$.get('/dungeons/' + pageNumber, function(data) {
			loadingIcon.hide();
			appendPoint.append(data);
			if(data==='') stopWatchingScroll = true;
			isLoading = false;
		});
	}

	function watchScroll() {
		if (stopWatchingScroll === true) return;

		if((($(window).scrollTop() + $(window).height()) + triggerPoint >= $(document).height()) && isLoading === false) {
			console.log('loading MOAR');
			pageNumber++;
			fetch();
		}
	}

})();