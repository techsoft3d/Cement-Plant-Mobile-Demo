import { startViewer } from "./conversionService.js";

export default function createViewer(containerId) {
    return new Promise(async function (resolve, reject) {
        var uids = ["a9901eb0-ded6-47c9-80e9-0cf7ecb88b46", //esp-filters
                "6794f4c5-55c5-482f-a4b9-59c4e44dcd78", //raw-mill-ducting
                "f0a80bb7-6def-4287-8400-7116578537a6" //control-feed-silo
                ]
        var result = await startViewer(uids)
        var viewer = result

        resolve(viewer);
    });
}
