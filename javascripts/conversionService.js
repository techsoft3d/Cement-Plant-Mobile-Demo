

export async function startViewer(uid) {
        var viewer;
        let sessioninfo = await caasClient.getStreamingSession();
        await caasClient.enableStreamAccess(sessioninfo.sessionid, uid);
        viewer = new Communicator.WebViewer({
                containerId: "container",
                endpointUri: sessioninfo.endpointUri,
                model: "_empty",
                enginePath: "https://cdn.jsdelivr.net/gh/techsoft3d/hoops-web-viewer",
                rendererType: 0
        });

        viewer.start();

        return viewer

}
