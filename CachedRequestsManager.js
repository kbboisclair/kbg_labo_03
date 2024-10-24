import * as utilities from "./utilities.js";
import * as serverVariables from "./serverVariables.js";

let repositoryCachesExpirationTime = serverVariables.get("main.repository.CacheExpirationTime");


global.cachedRequests = [];
global.cachedRequestsCleanerStarted = false;

export default class CachedRequestsManager {
    static add(url, content, ETag= ""){
        if (!cachedRequestsCleanerStarted) {
            cachedRequestsCleanerStarted = true;
            CachedRequestsManager.startCachedRequestsCleaner();
        }
        if (url != "") {
            CachedRequestsManager.clear(url);
            cachedRequests.push({
                url,
                content,
                ETag,
                Expire_Time: utilities.nowInSeconds() + repositoryCachesExpirationTime
            });
            console.log(BgWhite + FgBlue, `[Data of ${url} request has been cached]`);
        }
    }
    static startCachedRequestsCleaner(){
        // periodic cleaning of expired cached request data
        setInterval(CachedRequestsManager.flushExpired, repositoryCachesExpirationTime * 1000);
        console.log(BgWhite + FgBlue, "[Periodic requests data caches cleaning process started...]");
    }
    
    static find(url){
        try {
            if (url != "") {
                for (let cache of cachedRequests) {
                    if (cache.url == url) {
                        // renew cache
                        cache.Expire_Time = utilities.nowInSeconds() + repositoryCachesExpirationTime;
                        console.log(BgWhite + FgBlue, `[${cache.url} data retrieved from cache]`);
                        return cache;
                    }
                }
            }
        } catch (error) {
            console.log(BgWhite + FgRed, "[request cache error!]", error);
        }
        return null;
    }
    static clear(url){
        if (url != "") {
            let indexToDelete = [];
            let index = 0;
            for (let cache of cachedRequests) {
                if (cache.url == url) indexToDelete.push(index);
                index++;
            }
            utilities.deleteByIndex(cachedRequests, indexToDelete);
        }
    }
    static flushExpired(){
        let now = utilities.nowInSeconds();
        for (let cache of cachedRequests) {
            if (cache.Expire_Time <= now) {
                console.log(BgWhite + FgBlue, "Cached request data of " + cache.url + " expired");
            }
        }
        cachedRequests = cachedRequests.filter( cache => cache.Expire_Time > now);
    }
    static get(HttpContext){
        // let cache = CachedRequestsManager.find(HttpContext.req.url);
        // if(cache){
        //     console.log(FgCyan + Bright, "Response header ETag key:", cache.ETag);
        //     HttpContext.response.ETag(cache.ETag);
        //     HttpContext.response.JSON(cache.content, cache.ETag, true);
        //     return true;
        // }
        // return false

        let url = HttpContext.req.url;
        let cached = CachedRequestsManager.find(url);
        if (cached != null) {
            HttpContext.response.JSON(cached.content, cached.ETag, true)
            return true;
        }
        return false;
    }




}