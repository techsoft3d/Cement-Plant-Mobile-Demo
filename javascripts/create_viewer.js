import { startViewer } from "./conversionService.js";

export default function createViewer(containerId) {
    return new Promise(async function (resolve, reject) {
        var uids = ["de1a58a2-2f6e-41ff-a22d-d3b35bb7618a",
                "b4b02c13-19ef-4c99-9700-c3e51ad0f321",
                "20db7173-94cf-4fb6-8c63-3b52f2f6caa0"
                ]
        var result = await startViewer(uids)
        var viewer = result[0]
        var data = result[1]   
            
        g_token = data.token;

        resolve(viewer);
    });
}
