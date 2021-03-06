"use strict";
var github_token = "";

load(); //init

function load() {
    if (github_token.length !== 0) {
        return start();
    }
    chrome.storage.sync.get('github_token', function (result) {
        if (result.github_token && result.github_token != "null") github_token = result.github_token;
        start();
    })
}

function start() {
    let repo = $('.entry-title.public [itemprop="name"] a').attr('href');
    let repoMeta = $('.repository-meta-content');

    if (document.location.pathname === '/search') {
        insertSlocWhenSearch();
    }
    else if (repo && repoMeta) {
        insertSlocForOne(repo, repoMeta);
    }
}

function insertSlocWhenSearch() {
    "use strict";

    let tasks = [];

    $('.repo-list-name a').each(function () {
        let self = this;
        let repoListMeta = $(self).parent().siblings(".repo-list-meta");
        let task = getSloc($(self).text(), 5)
            .then(lines => repoListMeta.append(". Total sloc is " + lines))
            .catch(e=>console.error(e));
        return tasks.push(task);
    });

    return Promise.all(tasks);

}

function insertSlocForOne(repo, repoMeta) {
    "use strict";

    return getSloc(repo.substring(1), 5)
        .then(lines => repoMeta.prepend("Total sloc is " + lines + ". "))
        .catch(e=>console.error(e));
}

function getSloc(repo, tries) {
    "use strict";

    if (repo.length === 0) {
        return Promise.reject("No repo provided");
    }

    //Github's API returns an empty object the first time it is accessed
    //We try five times then stop
    if (tries === 0) {
        return Promise.reject("Too many tries");
    }

    let url = "https://api.github.com/repos/" + repo + "/stats/code_frequency";

    if (github_token.length !== 0) {
        url += "?access_token=" + github_token;
    }

    return fetch(url)
        .then(x=>x.json())
        .then(x=>x.reduce((total, changes)=>total + changes[1] + changes[2], 0))
        .catch(err => getSloc(repo, tries - 1));
}



