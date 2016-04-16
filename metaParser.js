var request = require("request"),
	cheerio = require("cheerio"),
    fs = require('fs')

searchquery = encodeURIComponent(process.argv[2].replace('_', ' '))
pagesCount = process.argv[3] || 600
outfile = process.argv[4] || 'result.txt'
timefrom =  process.argv[5] || 1420063200
timeto =  process.argv[6] || 1449007199

function getSearchUrl(pagecount) {
	var url = 'http://news.meta.ua/search/' + pagecount + '/?q=' + searchquery + '&period=' + timefrom + '-' + timeto + '&url=&regs=0&res=0'
	return url
}

totalResults = 0,
resultsDownloaded = 0;

function callback (text) {
   fs.appendFile('./corpus/' + outfile +'.txt' , text, function(err) {
          if(err) {
                console.log(err);
          }
   });
}

alllinks = [];
loadedpages = 0;

for (var i=0; i< pagesCount; i++) {
	var url = getSearchUrl(i)
	request(url, function (error, response, body) {
		if (error) {
			console.log('Couldn’t get page because of error: ' + error);
			loadedpages++
			return;
		}
		var $ = cheerio.load(body),
			currlinks = $(".search_block a");
		for (var i=0; i< currlinks.length; i++) {
			alllinks.push(currlinks[i])
		}

		loadedpages++
		console.log('loaded links from ' + loadedpages + ' pages ')
		if (loadedpages == pagesCount) {
			runScrapper(alllinks)
		}
	})
}

function runScrapper(links) {
	links.forEach(function (link, i) {
		// get the href attribute of each link
		var url = link.attribs.href;

		// strip out unnecessary junk
		url = url.replace("/url?q=", "").split("&")[0];

		if (url.charAt(0) === "/") {
			return;
		}

		// this link counts as a result, so increment results
		totalResults++;

		// download that page
		request(url, function (error, response, body) {
			if (error) {
				console.log('Couldn’t get page because of error: ' + error);
				return;
			}

			// load the page into cheerio
			var $page = cheerio.load(body),
				text = ''
			$page("p").each(function (p) {
				text += ' ' + $page(this).text()
			});

			text = text.replace(/\s+/g, " ")
				.replace(/[^\u0400-\u04FF]/g, " ")
				.toLowerCase()

			console.log('parsed link ' + i + ' of ' + links.length)

			callback(text);
		});
	});
}