

export async function startViewer(uid) {
        const conversionServiceURI = "https://csapi.techsoft3d.com";

        var viewer;

        let res = await fetch(conversionServiceURI + '/api/streamingSession');
        var data = await res.json();

        await fetch(conversionServiceURI + '/api/enableStreamAccess/' + data.sessionid, { method: 'put', headers: { 'items': JSON.stringify(uid) } });

        viewer = new Communicator.WebViewer({
                containerId: "container",
                endpointUri: 'wss://' + data.serverurl + ":" + data.port + '?token=' + data.sessionid,
                model: "_empty",
                enginePath: "https://cdn.jsdelivr.net/gh/techsoft3d/hoops-web-viewer@latest",
                rendererType: 0
        });

        viewer.start();

        return [viewer, data];

}
