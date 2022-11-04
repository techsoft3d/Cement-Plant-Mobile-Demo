import createViewer from "./create_viewer.js";

const plant_viewer = function (viewerMode, language, plantName, targets, modelDir, userName) {
    this._viewer;
    this._viewerMode = viewerMode;
    this._language = language;
    this._resource = new SetResources(language);
    this._captions = this._resource.getCaptions();
    this._treeCaptions = this._resource.getTreeCaptions();
    this._msgs = this._resource.getMsgs();
    this._plantName = plantName;
    this._targets = targets;
    this._modelDir = modelDir;
    this._userName = userName;
    this._treeData = [];
    this._grIds = {};
    this._walkFunc;
    this._mobileEvent;
    this._jstree;
    this._partProperties = {};
    this._hullProperties = {};
    this._imgData;
    this._inspections = {};
    this._locationId;
    this._flatOverlayId;
    this._highlightedNode = -1;
    this._markupHandle;
    this._orbitCtrlHandle;
    this._sensor = true;
    this._xFrames;
    this._clipFunc;
    this._annotOp;
    this._annotOpHandle;
    this._walkMap = true;
    this._preCamera;

    this._screenConf;
    var ua = navigator.userAgent;
    if (ua.indexOf("iPhone") > 0 || ua.indexOf("iPod") > 0 || ua.indexOf("Android") > 0 && ua.indexOf("Mobile") > 0) {
        this._screenConf = Communicator.ScreenConfiguration.Mobile;
    } else if (ua.indexOf("iPad") > 0 || ua.indexOf("Android") > 0) {
        this._screenConf = Communicator.ScreenConfiguration.Mobile;
    } else {
        this._screenConf = Communicator.ScreenConfiguration.Desktop;
    }
};

plant_viewer.prototype = {
    start: function (reverseProxy) {
        var _this = this;

        _this._initEvents();
        _this._loadPartProperties();
        $.getJSON('jsons/xframes.json', function (data, e) {
            if (data) {
                _this._xFrames = data;
            }
        });

        _this._createViewer();
    },

    _initEvents: function () {
        var _this = this;

        var resizeTimer;
        var interval = Math.floor(1000 / 60 * 10);
        $(window).resize(function () {
            if (resizeTimer !== false) {
                clearTimeout(resizeTimer);
            }
            resizeTimer = setTimeout(function () {
                layoutPage()
                _this._viewer.resizeCanvas();
            }, interval);
        });

        layoutPage();
        function layoutPage() {
            var imgWidth, imgHeight;
            if (window.orientation == 0 || window.orientation == 180) {
                imgWidth = 225;
                imgHeight = 300;
            } else {
                imgWidth = 300;
                imgHeight = 225;
            }

            const winH = $(window).height();
            const winW = $(window).height();
            $(".panel").css("max-height", winH - 100);

            $("#resultsPanel").css("height", winH - 100);
            $("#resultsTblPanel").css("height", winH - 100 - 300 - 75);
        }

        if (_this._screenConf == Communicator.ScreenConfiguration.Mobile) {
            $("#file_image").change(function (e) {
                $("#mask_file_01").val($("#file_image").val());

                var file = e.target.files;
                var reader = new FileReader();
                reader.readAsDataURL(file[0]);
                reader.onload = function () {
                    var img = readImg(reader);
                    img.onload = function () {
                        _this._drawImg(img);
                        _this._imgData = img.src.split(',')[1];
                    }
                }
            });

            $("#photoImage").show();
            $("#mask_file_01").click(function () {
                $("#file_image").click();
            });

            $(".file_delete").click(function () {
                var canvas = document.getElementById('imgCanvas');
                var ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, 1024, 1024);
                $('#imgCanvas').hide();
                _this._imgData = undefined;
            });
        }

        // Get inspections
        var fileName = _this._plantName + "/inspections.json?" + (new Date).getTime();
        $.get(fileName).done(function (data, textStatus, jqXHR) {
            $.getJSON(fileName, function (data) {
                if (data != undefined) {
                    _this._inspections = data;
                    for (var id in _this._inspections) {
                        var result = _this._inspections[id];
                        _this._addResultTable(id, result);
                    }
                }
            });
        }).fail(function () { });

        $('.toolbarBtn').on({
            "click": function () {
                function resetCommand(command) {
                    $('.toolbarBtn[data-command="' + command + '"]').data("on", false).css("background-color", "white");
                    var OM = _this._viewer.operatorManager;
                    var id = OM.indexOf(_this._annotOpHandle);
                    if (-1 != id) {
                        OM.set(Communicator.OperatorId.Select, id);
                        // OM.push(_this._orbitCtrlHandle);
                        $('.resultBtn[data-command="annotation"]').data("on", false).css("background-color", "white");
                    }
                    if (command == 'inspection') {
                        _this._resetInspection();
                    } else if (command == 'results') {
                        _this._annotOp.deleteAll();
                        $('#commentRes').val('');
                        $('#imageRes').removeAttr('src');
                        var table = document.getElementById("resultsTbl");
                        for (var i = 1; i < table.rows.length; i++) {
                            var row = table.rows[i];
                            row.style.color = "";
                            row.style.backgroundColor = "";
                        }
                        $('.lowerRightPanel[data-command="expandResults"]').hide();
                        $('#resultsPanelContents').show();
                        var h = $(window).height();
                        $("#resultsPanel").css("height", h - 100);
                    }
                }

                var command = $(this).data("command");

                if ($('.toolbarBtn[data-command="tree"]').data("on")) {
                    $('#treePanel').hide();
                    resetCommand('tree');
                    _this._viewer.model.resetModelHighlight();
                    _this._highlightedNode = -1;
                    if (command == 'tree')
                        return;
                } else if ($('.toolbarBtn[data-command="property"]').data("on")) {
                    $('#propertyPanel').hide();
                    resetCommand('property');
                    if (command == 'property')
                        return;
                } else if ($('.toolbarBtn[data-command="inspection"]').data("on")) {
                    $('#inspectionPanel').hide();
                    resetCommand('inspection');
                    if (command == 'inspection')
                        return;
                } else if ($('.toolbarBtn[data-command="results"]').data("on")) {
                    $('#resultsPanel').hide();
                    resetCommand('results');
                    if (command == 'results')
                        return;
                } else if ($('.toolbarBtn[data-command="settings"]').data("on")) {
                    $('#settingsPanel').hide();
                    resetCommand('settings');
                    if (command == 'settings')
                        return;
                }

                switch (command) {
                    case 'tree':
                        var status = $('.toolbarBtn[data-command="tree"]').data("on");
                        if (status == undefined) {
                            _this.treeData = [{ "id": "-2", "text": "Plant1", "icon": "jstree-folder", "state": { "opened": true }, "children": [{ "id": "-64", "text": "Hull", "icon": "jstree-folder", "state": { "opened": true }, "children": [] }, { "id": "-65", "text": "Fit", "icon": "jstree-folder", "state": { "opened": true }, "children": [] }] }];
                            _this._jstree.createTreeFromJson(_this._treeData);
                        }

                        $('#treePanel').show();
                        $(this).data("on", true).css("background-color", "lightblue");
                        break;
                    case 'property':
                        $('#propertyPanel').show();
                        $(this).data("on", true).css("background-color", "lightblue");
                        break;
                    case 'inspection':
                        _this._resetInspection();
                        $('#inspectionPanel').show();
                        $(this).data("on", true).css("background-color", "lightblue");
                        break;
                    case 'results':
                        $('#resultsPanel').show();
                        $(this).data("on", true).css("background-color", "lightblue");
                        break;
                    case 'settings':
                        $('#settingsPanel').show();
                        $(this).data("on", true).css("background-color", "lightblue");
                        break;
                }
            }
        });

        $('#tree1').on({
            'loaded.jstree': function () {
                var root = _this._viewer.model.getRootNode();
                $('#tree1').jstree().check_node(root);
            },
            'hover_node.jstree': function (event, obj) {
                var id = Number(obj.node.id);
                if (id != _this._highlightedNode) {
                    _this._viewer.model.resetModelHighlight();
                    _this._viewer.model.setNodesHighlighted([id], true);
                    _this._highlightedNode = id;
                }
            },
            'check_node.jstree': function (event, obj) {
                var id = Number(obj.node.id);
                _this._viewer.model.setNodesVisibility([Number(obj.node.id)], true);
            },
            'uncheck_node.jstree': function (event, obj) {
                var id = Number(obj.node.id);
                _this._viewer.model.setNodesVisibility([id], false);
            }
        });

        $('.inspectionBtn').on({
            "click": function () {
                var command = $(this).data("command");

                switch (command) {
                    case 'save':
                        var isOK = $('.resultBtn[data-command="OK"]').data("on");
                        if (isOK == undefined) {
                            alert(_this._msgs.noResult);
                            break;
                        }

                        var today = new Date();
                        var year = '' + today.getFullYear();
                        var month = '' + (today.getMonth() + 1);
                        if (month < 10) { month = '0' + month; }
                        var day = '' + today.getDate();
                        if (day < 10) { day = '0' + day; }
                        var hour = '' + today.getHours();
                        if (hour < 10) { hour = '0' + hour; }
                        var min = '' + today.getMinutes();
                        if (min < 10) { min = '0' + min; }
                        var sec = '' + today.getSeconds();
                        if (sec < 10) { sec = '0' + sec; }
                        today = year + month + day + hour + min + sec;

                        var isWalk = false;
                        var OM = _this._viewer.operatorManager;
                        if (OM.indexOf(Communicator.OperatorId.Walk) != -1)
                            isWalk = true;

                        var result = {
                            user: _this._userName,
                            OK: isOK,
                            camera: _this._viewer.getView().getCamera().forJson(),
                            walk: isWalk,
                        };

                        var markups = _this._annotOp.serialize();
                        if (markups != undefined) {
                            result.markups = markups;
                        }

                        var comment = htmlspecialchars($('#comment').val());
                        if (comment != '')
                            result.comment = comment;
                        if (_this._imgData != undefined)
                            result.image = today + '.jpg';

                        _this._addResultTable(today, result);

                        if (_this._imgData != undefined) {
                            var rad = $("#imgCanvas").data("rad");
                            result.imageRotation = rad;
                            // $.ajax({
                            //     url: "/demos/cement-plant-viewer/php/saveImg.php",
                            //     type: "post",
                            //     dataType: 'json',
                            //     data: {
                            //         path: '../inspections/' + _this._plantName + '/' + today,
                            //         image: _this._imgData,
                            //     },
                            // }).done(function (response) {
                            // }).fail(function (response) {
                            //     alert( "error" );
                            // });
                        }

                        _this._inspections[today] = result;

                        $.post("/api/export_json",
                            {
                                data: JSON.stringify(_this._inspections),
                                filePath: 'Plant1/' + _this._plantName + '/inspections.json'
                            }
                        );

                        _this._resetInspection();

                        alert(_this._msgs.saved);
                        break;
                }
            },
            "touchstart mousedown": function () {
                $(this).css("background-color", "lightblue");
            },
            "touchend mouseup": function () {
                $(this).css("background-color", "white");
            }
        });

        $('.resultBtn').on({
            "click": function () {
                var command = $(this).data("command");
                var OM = _this._viewer.operatorManager;

                if ($('.resultBtn[data-command="annotation"]').data("on")) {
                    $('.resultBtn[data-command="annotation"]').data("on", false).css("background-color", "white");
                    if (command == 'annotation') {
                        OM.set(Communicator.OperatorId.Select, 1);
                        // OM.push(_this._orbitCtrlHandle);
                        if (_this._mobileEvent != undefined && $("#sensorOff").data("on") && OM.indexOf(Communicator.OperatorId.Walk) != -1)
                            _this._mobileEvent.sensorOn();
                        return;
                    }
                }

                switch (command) {
                    case 'OK':
                        $('.resultBtn[data-command="NG"]').data("on", false).css("background-color", "white");
                        $(this).data("on", true).css("background-color", "lime");
                        break;
                    case 'NG':
                        $('.resultBtn[data-command="OK"]').data("on", false).css("background-color", "white");
                        $(this).data("on", true).css("background-color", "red");
                        break;
                    case 'annotation':
                        $(this).data("on", true).css("background-color", "lightblue");
                        var id = OM.indexOf(Communicator.OperatorId.Select);
                        OM.set(_this._annotOpHandle, id);
                        if (_this._mobileEvent != undefined && $("#sensorOff").data("on") && OM.indexOf(Communicator.OperatorId.Walk) != -1)
                            _this._mobileEvent.sensorOff();
                        break;
                };
            }
        });

        $('.lowerRightPanel').on({
            "click": function () {
                var command = $(this).data("command");

                switch (command) {
                    case 'collapseInspection':
                        $('#inspectionPanel').height(42);
                        $('#inspectionPanelContents').hide();
                        $('.lowerRightPanel[data-command="expandInspection"]').show();
                        break;
                    case 'expandInspection':
                        $('.lowerRightPanel[data-command="expandInspection"]').hide();
                        $('#inspectionPanelContents').show();
                        $("#inspectionPanel").css('height', '');
                        break;
                    case 'collapseResults':
                        $('#resultsPanel').height(42);
                        $('#resultsPanelContents').hide();
                        $('.lowerRightPanel[data-command="expandResults"]').show();
                        break;
                    case 'expandResults':
                        $('.lowerRightPanel[data-command="expandResults"]').hide();
                        $('#resultsPanelContents').show();
                        winH = $(window).height();
                        $("#resultsPanel").css("height", winH - 100);
                        break;
                };
            }
        });

        // Walk
        $('#operator-camera-walk').on({
            'click': function (e) {
                var OM = _this._viewer.operatorManager;
                if (OM.indexOf(Communicator.OperatorId.Walk == -1)) {
                    _this._walkModeOnOff(true);

                    _this._viewer.model.getModelBounding().then(function (box) {
                        var camera = _this._viewer.getView().getCamera();
                        _this._preCamera = camera.copy();
                        var position = camera.getPosition();
                        var target = camera.getTarget();
                        var vector1 = Communicator.Point3.subtract(target, position);
                        var vector2 = new Communicator.Point3(0, 0, 1);
                        var angle = Communicator.MeasureUtils.ComputeAngleBetweenVector(vector1, vector2);
                        angle -= 90;
                        var cross = Communicator.Point3.cross(vector1, vector2);
                        cross = cross.normalize();
                        var matrixR = new Communicator.Matrix.createFromOffAxisRotation(cross, angle);
                        var target2 = new Communicator.Point3(0, 0, 0);
                        matrixR.transform(vector1, target2);

                        if (box.min.x <= position.x && position.x <= box.max.x &&
                            box.min.y <= position.y && position.y <= box.max.y &&
                            box.min.z <= position.z && position.z <= box.max.z) {
                            target2.x += position.x;
                            target2.y += position.y;
                            target2.z += position.z;

                            camera.setTarget(target2);
                            camera.setUp(new Communicator.Point3(0, 0, 1));
                            camera.setProjection(Communicator.Projection.Perspective);
                            _this._viewer.getView().setCamera(camera, 0);
                        } else {
                            var v, a;
                            var maxAngle = 0;
                            var plane = new Communicator.Plane();
                            // X+
                            v = new Communicator.Point3(1, 0, 0);
                            a = Communicator.MeasureUtils.ComputeAngleBetweenVector(vector1, v);
                            if (maxAngle < a) {
                                plane.normal.set(-1, 0, 0);
                                plane.d = box.max.x;
                                maxAngle = a;
                            }
                            // X-
                            v = new Communicator.Point3(-1, 0, 0);
                            a = Communicator.MeasureUtils.ComputeAngleBetweenVector(vector1, v);
                            if (maxAngle < a) {
                                plane.normal.set(-1, 0, 0);
                                plane.d = box.min.x;
                                maxAngle = a;
                            }
                            // Y+
                            v = new Communicator.Point3(0, 1, 0);
                            a = Communicator.MeasureUtils.ComputeAngleBetweenVector(vector1, v);
                            if (maxAngle < a) {
                                plane.normal.set(0, -1, 0);
                                plane.d = box.max.y;
                                maxAngle = a;
                            }
                            // Y-
                            v = new Communicator.Point3(0, -1, 0);
                            a = Communicator.MeasureUtils.ComputeAngleBetweenVector(vector1, v);
                            if (maxAngle < a) {
                                plane.normal.set(0, -1, 0);
                                plane.d = box.min.y;
                                maxAngle = a;
                            }
                            // Z+
                            v = new Communicator.Point3(0, 0, 1);
                            a = Communicator.MeasureUtils.ComputeAngleBetweenVector(vector1, v);
                            if (maxAngle < a) {
                                plane.normal.set(0, 0, -1);
                                plane.d = box.max.z;
                                maxAngle = a;
                            }
                            // Z-
                            v = new Communicator.Point3(0, 0, -1);
                            a = Communicator.MeasureUtils.ComputeAngleBetweenVector(vector1, v);
                            if (maxAngle < a) {
                                plane.normal.set(0, 0, -1);
                                plane.d = box.min.z;
                                maxAngle = a;
                            }

                            var p = new Communicator.Point3(0, 0, 0);
                            var b = Communicator.MeasureUtils.IntersectionPlaneLine2(position, target, plane, p);
                            if (p.x != undefined) {
                                position.x = p.x;
                                position.y = p.y;
                                position.z = p.z;
                                target2.x += position.x;
                                target2.y += position.y;
                                target2.z += position.z;
                                camera.setPosition(position);
                                camera.setTarget(target2);
                                camera.setUp(new Communicator.Point3(0, 0, 1));
                                camera.setProjection(Communicator.Projection.Perspective);
                                _this._viewer.getView().setCamera(camera, 0);
                            }
                        }
                        setTimeout(function () {
                            OM.push(Communicator.OperatorId.Walk, id);
                            var id = OM.indexOf(Communicator.OperatorId.Walk)
                            OM.set(Communicator.OperatorId.Navigate, id);
                            OM.set(Communicator.OperatorId.Walk, id);
                        }, 100);
                    });
                }
                e.preventDefault();
            }
        });

        $('#operator-camera-orbit,#operator-camera-turntable').on({
            'click': function () {
                var OM = _this._viewer.operatorManager;
                if (OM.indexOf(Communicator.OperatorId.Walk != -1)) {
                    if (_this._preCamera != undefined) {
                        _this._viewer.getView().setCamera(_this._preCamera);
                        _this._preCamera = undefined;
                    }
                    _this._walkModeOnOff(false);
                }
            }
        });

        // Walk buttons
        var touched = false;
        var touch_time = 0;
        var x;

        function doWork(dir, x) {
            if (x > 100.0)
                x = 100.0;
            if (dir == "forward")
                _this._walkFunc.walkFoward(1000 * x);
            else if (dir == "backward")
                _this._walkFunc.walkFoward(-1000 * x);
            else if (dir == "left")
                _this._walkFunc.walkCrab(1000 * x);
            else if (dir == "right")
                _this._walkFunc.walkCrab(-1000 * x);
            else if (dir == "turnLeft")
                _this._walkFunc.horizontalRotation(30, true);
            else if (dir == "turnRight")
                _this._walkFunc.horizontalRotation(-30, true);
            else if (dir == "up")
                _this._walkFunc.gotoUpstair(1000 * x);
            else if (dir == "down")
                _this._walkFunc.gotoUpstair(-1000 * x);
        }

        $(".arrowBtn").bind({
            "touchstart mousedown": function (e) {
                var dir = $(this).data("dir");
                x = 1.0;
                touched = true;
                touch_time = 0;
                document.interval = setInterval(function () {
                    touch_time += 100;
                    if (touch_time >= 300) {
                        doWork(dir, x);
                        x += 10.0
                        touch_time = 0;
                    }
                }, 100)
                e.preventDefault();
            },
            "touchend mouseup mouseout": function (e) {
                var dir = $(this).data("dir");
                if (touched) {
                    if (touch_time < 300) {
                        doWork(dir, 1);
                    }
                }
                touched = false;
                clearInterval(document.interval);
                e.preventDefault();
            }
        });

        $("#sensorOff").on("click", function () {
            if ($(this).data("on")) {
                _this._mobileEvent.sensorOff();
                $(this).data("on", false).css("background-color", "white");
            } else {
                _this._mobileEvent.sensorOn();
                $(this).data("on", true).css("background-color", "lightblue");
            }
        });

        // walk
        $("#operator-camera-walk").on("click", function () {
            _this._walkModeOnOff(true);
        });

        // custom turntable
        $("#operator-camera-turntable").on("click", function () {
            if (_this._preCamera != undefined) {
                _this._viewer.getView().setCamera(_this._preCamera);
                _this._preCamera = undefined;
            }
            _this._walkModeOnOff(false);
        });

        // Clip
        $("#cuttingplane-button2").on("click", function () {

            function updatePlanePos() {
                var table = document.getElementById('clipTbl');
                for (var i = 0; i < 6; i++) {
                    var CS = _this._viewer.getCuttingManager().getCuttingSection(i);
                    {
                        var plane = CS.getPlane(0);
                        var d = plane.d;
                        if (i % 2 == 1)
                            d = -plane.d;
                        table.rows[i].cells[1].innerText = Math.round(d);

                        if (i > 1)
                            continue;
                        for (var j = 0; j < _this._xFrames.length; j++) {
                            var frame = _this._xFrames[j];
                            if (d <= frame.val) {
                                var fName = frame.name;
                                var diff = d - frame.val
                                if (j > 0) {
                                    var preFrame = _this._xFrames[j - 1]
                                    var preDiff = d - preFrame.val;
                                    if (Math.abs(preDiff) < Math.abs(diff)) {
                                        fName = preFrame.name;
                                        diff = preDiff;
                                    }
                                }
                                if (diff > 0)
                                    diff = "+" + String(Math.round(diff));
                                else
                                    diff = String(Math.round(diff));

                                table.rows[i].cells[2].innerText = fName;
                                table.rows[i].cells[3].innerText = diff;
                                break;
                            }
                        }
                    }
                }
            }

            if ($(this).data("on") == undefined || $(this).data("on") == false) {
                $("#clipInfo").show();
                _this._clipFunc.on();
                $(this).data("on", true).css("background-color", "lightblue");
                $("#cuttingPlane").data("on", true).css("background-color", "lightblue");
                _this._viewer.setCallbacks({
                    frameDrawn: updatePlanePos
                });
            } else {
                $("#clipInfo").hide();
                _this._clipFunc.off();
                $(this).data("on", false).css("background-color", "white");
                _this._viewer.unsetCallbacks({
                    frameDrawn: updatePlanePos
                });
            }
        });

        $("#resetCutPlane").on({
            "click": function () {
                _this._clipFunc.reset();
            }
        });

        $("#cuttingPlane").on("click", function () {
            if ($(this).data("on")) {
                _this._clipFunc.hideCuttingPlane();
                $(this).data("on", false).css("background-color", "white");
            } else {
                _this._clipFunc.on();
                $(this).data("on", true).css("background-color", "lightblue");
            }
        });

        // Option settings
        $('.settingChk').on("change", function () {
            var command = $(this).data("command");
            var check = $(this).is(':checked');

            switch (command) {
                case 'background':
                    if (check) {
                        var colorTop = new Communicator.Color(12, 12, 160);
                        var colorBottom = new Communicator.Color(230, 230, 243);
                        _this._viewer.getView().setBackgroundColor(colorTop, colorBottom);
                    } else {
                        _this._viewer.getView().setBackgroundColor(null, null);
                    }
                    break;
                case 'walkMap':
                    _this._walkMap = check;
                    if (_this._viewer.operatorManager.indexOf(Communicator.OperatorId.Walk) != -1) {
                        if (_this._walkMap) {
                            if (_this._flatOverlayId == undefined) {
                                _this._createWalkMap();
                            } else {
                                _this._viewer.getOverlayManager().setVisibility(_this._flatOverlayId, true);
                                var camera = _this._viewer.getView().getCamera();
                                _this._updateMapLocation(camera);
                            }

                        } else {
                            if (_this._flatOverlayId != undefined)
                                _this._viewer.getOverlayManager().setVisibility(_this._flatOverlayId, false);
                        }
                    }
                    break;
            }
        });

        $("#testBtn1").on("click", function () {
            _this._viewer.redraw();
        });

    },

    _createViewer: function () {
        var _this = this;
        var modelName = "_empty";
        if (_this._viewerMode == "SCS")
            modelName = "model_data_plant/" + _this._plantName + "/" + _this._plantName + ".scs";
        createViewer().then(function (hwv) {
            _this._viewer = hwv;

            _this._viewer.setCallbacks({
                sceneReady: function () {
                    // Set view axis
                    _this._viewer.model.setViewAxes(new Communicator.Point3(-1, 0, 0), new Communicator.Point3(0, 0, 1));

                    // Set background color
                    //var color = new Communicator.Color(255, 255, 255);
                    var colorTop = new Communicator.Color(12, 12, 160);
                    var colorBottom = new Communicator.Color(230, 230, 243);
                    _this._viewer.getView().setBackgroundColor(colorTop, colorBottom);

                    // Show Triad
                    var axisTriad = _this._viewer.getView().getAxisTriad();
                    axisTriad.enable();

                    // Show NavCube
                    var navCube = _this._viewer.getView().getNavCube();
                    navCube.enable();

                    // Set back face visible
                    _this._viewer.getView().setBackfacesVisible(true);

                    // Show toolbar
                    var cuttingPlaneCtr = new Communicator.Ui.CuttingPlaneController(_this._viewer);
                    var toolbar = new Communicator.Ui.Toolbar(_this._viewer, cuttingPlaneCtr, axisTriad, Communicator.ScreenConfiguration.Desktop);
                    toolbar.init();

                    // Mobile
                    _this._mobileEvent = new MobileEventListener(_this._viewer, _this._walkFunc);

                    // Selection
                    _this._viewer.getSelectionManager().setHighlightLineElementSelection(false);
                    _this._viewer.getSelectionManager().setHighlightFaceElementSelection(false);
                },

                modelStructureReady: function () {
                    var model = _this._viewer.model;

                    var root = model.getRootNode();
                    var obj = {
                        id: String(root),
                        text: _this._plantName,
                        icon: 'jstree-folder',
                        state: {
                            opened: true,
                        },
                        children: []
                    };

                    _this._treeData.push(obj);

                    obj = {
                        id: "hull",
                        text: _this._captions.hull,
                        icon: 'jstree-folder',
                        state: {
                            opened: true
                        },
                        children: []
                    };
                    _this._treeData[0].children.push(obj);

                    obj = {
                        id: "fit",
                        text: _this._captions.fit,
                        icon: 'jstree-folder',
                        state: {
                            opened: true
                        },
                        children: []
                    };
                    _this._treeData[0].children.push(obj);


                    if (_this._viewerMode == 'CSR' || _this._viewerMode == 'SSR') {
                        _this._grIds.hull = model.createNode(root, 'hull');
                        _this._grIds.fit = model.createNode(root, 'fit');
                        _this._treeData[0].children[0].id = String(_this._grIds.hull);
                        _this._treeData[0].children[1].id = String(_this._grIds.fit);

                        function loadModel(node, modelName) {
                            return new Promise(function (resolve, reject) {
                                _this._viewer.model.loadSubtreeFromModel(node, modelName).then(function (data) {
                                    current++;
                                    if (_this._targets.length <= current) {
                                        resolve();
                                    } else {
                                        var path = _this._plantName + '/' + _this._targets[current].group + '/' + _this._targets[current].block;
                                        loadModel(_this._grIds[_this._targets[current].group], _this._targets[current].block).then(function () {
                                            resolve();
                                        });
                                    }
                                });
                            });
                        }

                        var current = 0;
                        if (_this._viewerMode == 'CSR') {
                            $('#loadingImage').show();
                            _this._viewer.pauseRendering().then(function () {
                                var path = _this._plantName + '/' + _this._targets[current].group + '/' + _this._targets[current].block;
                                loadModel(_this._grIds[_this._targets[current].group], _this._targets[current].block).then(function () {
                                    _this._viewer.getView().setViewOrientation(Communicator.ViewOrientation.Iso, 0);
                                    $('#loadingImage').hide();
                                    _this._viewer.resumeRendering();
                                });
                            });
                        } else if (_this._viewerMode == 'SSR') {
                            var path = _this._plantName + '/' + _this._targets[current].group + '/' + _this._targets[current].block;
                            loadModel(_this._grIds[_this._targets[current].group], path).then(function () {
                                _this._viewer.getView().setViewOrientation(Communicator.ViewOrientation.Iso, 0);
                            });
                        }
                    }
                },

                subtreeLoaded: function (nodeIdArray) {
                    // Reorder and localize elements
                    function get_obj_by_key_value(dataAry, key, value) {
                        var result = $.grep(dataAry, function (e) {
                            return e[key] == value;
                        });
                        return result;
                    }

                    function reorderFitChildren(children) {
                        var newChildren = [];
                        var elements = ['PIPE', 'PART', 'SUPP', 'DUCT', 'CWAY', 'RIGG', 'MACH', 'MSPA', 'RAREA', 'MODL', 'FAREA']
                        for (var i = 0; i < elements.length; i++) {
                            var obj = get_obj_by_key_value(children, 'text', elements[i]);
                            if (obj.length > 0) {
                                obj[0].text = _this._treeCaptions[obj[0].text];
                                newChildren.push(obj[0]);
                            }
                        }

                        if (newChildren.length > 0)
                            return newChildren;
                        else
                            return children;
                    }

                    var parent = _this._viewer.model.getNodeParent(nodeIdArray[0]);
                    var group;
                    if (parent == _this._grIds.hull)
                        group = 0;
                    else if (parent == _this._grIds.fit)
                        group = 1;
                    else
                        return;

                    var nodeData = [];
                    var children = _this._viewer.model.getNodeChildren(nodeIdArray[0]);
                    children = _this._viewer.model.getNodeChildren(children[0]);

                    _this._treeData[0].children[group].children.push(nodeData[0]);
                },

                selection: function (event) {
                    if (_this._mobileEvent != undefined) {
                        _this._mobileEvent.walkStop();
                        setTimeout(function () {
                            _this._mobileEvent.walkStart();
                        }, 500);
                    }

                    $('#propatyTbl').find("tr:gt(0)").remove();
                    _this._viewer.markupManager.unregisterMarkup(_this._markupHandle);

                    var type = event.getType();
                    if (type != Communicator.SelectionType.None && type != Communicator.SelectionType.Part) {
                        var selItem = event.getSelection();
                        var nodeId = selItem.getNodeId();

                        var parent = _this._viewer.model.getNodeParent(nodeId);
                        parent = _this._viewer.model.getNodeParent(parent);
                        var partName = _this._viewer.model.getNodeName(parent);

                        // Show text markup
                        var selPosition = selItem.getPosition();
                        var markupItem = new textMarkup(_this._viewer, selPosition, partName);
                        _this._markupHandle = _this._viewer.markupManager.registerMarkup(markupItem);

                    } else {
                        _this._viewer.model.resetModelHighlight();
                    }
                },
            });

            var op = new OrbitCtrlOperator(_this._viewer);
            _this._orbitCtrlHandle = _this._viewer.registerCustomOperator(op);

            _this._annotOp = new AnnotationOperator(_this._viewer, _this._msgs);
            _this._annotOpHandle = _this._viewer.registerCustomOperator(_this._annotOp);

            // _this._viewer.start();

            _this._viewer.getOperatorManager().push(_this._orbitCtrlHandle);

            _this._walkFunc = new WalkFunc(_this._viewer);
            _this._walkFunc.setDuration(300);
            _this._clipFunc = new ClipFunc(_this._viewer);
        });
    },

    _loadPartProperties: function () {
        var _this = this;
        if (_this._viewerMode == 'CSR' || _this._viewerMode == 'SSR') {
            for (var i = 0; i < _this._targets.length; i++) {
                var group = _this._targets[i].group;
                var block = _this._targets[i].block;
                if (group == 'hull') {
                    $.getJSON(_this._plantName + '/' + group + '/' + block + ".json", function (data, e) {
                        if (data != undefined) {
                            for (var key in data) {
                                _this._hullProperties[key] = data[key];
                            }
                        }
                    });
                } else {
                    $.getJSON(_this._plantName + '/' + group + '/' + block + ".json", function (data, e) {
                        if (data != undefined) {
                            for (var key in data) {
                                _this._partProperties[key] = data[key];
                            }
                        }
                    });
                }
            }
        } else if (_this._viewerMode == 'SCS') {
            $.getJSON(_this._plantName + '/' + _this._plantName + ".json", function (data, e) {
                if (data.hull) {
                    _this._hullProperties = data.hull;
                }

                if (data.fit) {
                    _this._partProperties = data.fit;
                }
            });
        }
    },

    _updateMapLocation: function (camera) {
        var _this = this;

        var vector1 = new Communicator.Point3(1, 0, 0);
        var position = camera.getPosition();
        var target = camera.getTarget();
        var vector2 = Communicator.Point3.subtract(target, position);
        var angle = Communicator.MeasureUtils.ComputeAngleBetweenVector(vector1, vector2);
        var cross = Communicator.Point3.cross(vector1, vector2);

        var matrixT = new Communicator.Matrix();
        matrixT.setTranslationComponent(position.x, position.y, 10000);
        var matrixR = new Communicator.Matrix.createFromOffAxisRotation(cross, angle);
        _this._viewer.model.setNodeMatrix(_this._locationId, Communicator.Matrix.multiply(matrixR, matrixT));
    },

    _createWalkMap: function () {
        var _this = this;

        var model = _this._viewer.model;
        var overlayMgr = _this._viewer.getOverlayManager();
        _this._flatOverlayId = overlayMgr.maxIndex();
        var size = 300;
        if (_this._screenConf == Communicator.ScreenConfiguration.Mobile)
            size = 200;
        overlayMgr.setViewport(
            _this._flatOverlayId, Communicator.OverlayAnchor.LowerRightCorner,
            5, Communicator.OverlayUnit.Pixels, 10, Communicator.OverlayUnit.Pixels,
            size, Communicator.OverlayUnit.Pixels, size, Communicator.OverlayUnit.Pixels
        );

        _this._viewer.model.getModelBounding().then(function (box) {
            // Camera
            var centerX = box.min.x + (box.max.x - box.min.x) / 2;
            var centerY = box.min.y + (box.max.y - box.min.y) / 2;
            var camera = new Communicator.Camera();
            var margin = 10000;
            camera.setPosition(new Communicator.Point3(centerX, centerY, 10010));
            camera.setTarget(new Communicator.Point3(centerX, centerY, 0));
            camera.setUp(new Communicator.Point3(1, 0, 0));
            var w = box.max.x - box.min.x;
            var h = box.max.y - box.min.y;
            camera.setWidth(w + margin * 2);
            camera.setHeight(h + margin * 2);
            camera.setProjection(Communicator.Projection.Orthographic);
            overlayMgr.setCamera(_this._flatOverlayId, camera);
            overlayMgr.setVisibility(_this._flatOverlayId, true);

            // Base Mesh
            var meshData1 = new Communicator.MeshData();
            meshData1.setFaceWinding(Communicator.FaceWinding.Clockwise);
            var centerY = box.min.y + (box.max.y - box.min.y) / 2;
            var bodyX = box.min.x + (box.max.x - box.min.x) * 0.8;
            var vertices1 = [
                box.min.x, box.min.y, box.min.z,
                box.min.x, box.max.y, box.min.z,
                bodyX, box.max.y, box.min.z,
                box.min.x, box.min.y, box.min.z,
                bodyX, box.max.y, box.min.z,
                bodyX, box.min.y, box.min.z,
                bodyX, box.min.y, box.min.z,
                bodyX, box.max.y, box.min.z,
                box.max.x, centerY, box.min.z
            ];
            var normals1 = [
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1
            ];
            meshData1.addFaces(vertices1, normals1);
            model.createMesh(meshData1).then(function (meshId) {
                var faceColor = new Communicator.Color(100, 100, 100);
                var meshInstanceData = new Communicator.MeshInstanceData(meshId, undefined, "ground_plane", faceColor);
                meshInstanceData.setTransparency(0.5);
                model.createMeshInstance(meshInstanceData).then(function (instanceId) {
                    overlayMgr.addNodes(_this._flatOverlayId, [instanceId]);
                });
            });

            // Location mesh
            var meshData2 = new Communicator.MeshData();
            meshData2.setFaceWinding(Communicator.FaceWinding.Clockwise);
            meshData2.setBackfacesEnabled(true);
            var locSize;
            var x = box.max.x - box.min.x;
            var y = box.max.y - box.min.y;
            if (x >= y) {
                locSize = x / 15;
            } else {
                locSize = y / 15;
            }

            var vertices2 = [
                0, - locSize / 3, 0,
                0, locSize / 3, 0,
                locSize, 0, 0
            ]
            var normals2 = [
                0, 0, 1,
                0, 0, 1,
                0, 0, 1
            ]
            meshData2.addFaces(vertices2, normals2);
            model.createMesh(meshData2).then(function (meshId) {
                var faceColor = new Communicator.Color(255, 0, 0);
                meshInstanceData = new Communicator.MeshInstanceData(meshId, undefined, "location", faceColor);
                model.createMeshInstance(meshInstanceData).then(function (instanceId) {
                    overlayMgr.addNodes(_this._flatOverlayId, [instanceId]);
                    _this._locationId = instanceId;

                    _this._updateMapLocation(_this._viewer.getView().getCamera());
                });
            });
        });
    },

    _walkModeOnOff: function (on) {
        var _this = this;

        function updateLocation(camera) {
            var position = camera.getPosition();
            $("#cameraX").html('X(F) = ' + Math.round(position.x));
            $("#cameraY").html('Y(P) = ' + Math.round(position.y));
            $("#cameraZ").html('Z(U) = ' + Math.round(position.z));

            if (_this._walkMap)
                _this._updateMapLocation(camera);
        }

        var OM = _this._viewer.operatorManager;
        if (on) {
            $(".walkNavi").show();
            $("#cameraPosition").show();
            OM.clear();
            OM.push(Communicator.OperatorId.Walk);
            OM.push(Communicator.OperatorId.Select);

            if (_this._mobileEvent != undefined) {
                _this._mobileEvent.ResetPrevious();
                $(".walkNaviSensor").show();
            }

            if (_this._walkMap) {
                if (_this._flatOverlayId == undefined) {
                    _this._createWalkMap();
                } else {
                    _this._viewer.getOverlayManager().setVisibility(_this._flatOverlayId, true);
                    var camera = _this._viewer.getView().getCamera();
                    _this._updateMapLocation(camera);
                }
            }
            _this._viewer.setCallbacks({
                camera: updateLocation
            });

        } else {
            $(".walkNavi").hide();
            $("#cameraPosition").hide();
            _this._viewer.getView().setProjectionMode(Communicator.Projection.Orthographic);
            OM.clear();
            OM.push(Communicator.OperatorId.Pan);
            OM.push(Communicator.OperatorId.Zoom);
            OM.push(_this._customTurnHandle);
            OM.push(Communicator.OperatorId.Select);

            if (_this._mobileEvent != undefined) {
                $(".walkNaviSensor").hide();
            }

            if (_this._flatOverlayId != undefined)
                _this._viewer.getOverlayManager().setVisibility(_this._flatOverlayId, false);

            _this._viewer.unsetCallbacks({
                camera: updateLocation
            });
        }

    },

    _drawImg: function (img) {
        var _this = this;
        var canvas = document.getElementById('imgCanvas');
        var rad = 0;
        $('#imgCanvas').css({ 'width': '300px', 'height': '225px' });
        switch (window.orientation) {
            case 0:
                rad = 90;
                $('#imgCanvas').css({ 'width': '225px', 'height': '300px' });
                break;
            case 180:
                rad = -90;
                $('#imgCanvas').css({ 'width': '225px', 'height': '300px' });
                break;
            case -90:
                rad = 180;
                break;
        }
        readDrawImg(img, canvas, 0, 0, rad);
        $("#imgCanvas")
            .data("rad", rad)
            .show();
    },

    _resetInspection: function () {
        var _this = this;

        $('.lowerRightPanel[data-command="expandInspection"]').hide();
        $('#inspectionPanelContents').show();
        $("#inspectionPanel").css('height', '');

        $('.resultBtn[data-command="OK"]').data("on", undefined).css("background-color", "white");
        $('.resultBtn[data-command="NG"]').data("on", undefined).css("background-color", "white");

        var date = new Date();
        var year = '' + date.getFullYear();
        var month = '' + (date.getMonth() + 1);
        var day = '' + date.getDate();
        var hour = '' + date.getHours();
        var min = '' + date.getMinutes();
        date = year + '/' + month + '/' + day + ' ' + hour + ':' + min;

        _this._annotOp.deleteAll();
        var OM = _this._viewer.operatorManager;
        if (OM.indexOf(_this._annotOpHandle) != -1) {
            var id = OM.indexOf(Communicator.OperatorId.Select);
            OM.set(Communicator.OperatorId.Select, id);
            // if (OM.indexOf(Communicator.OperatorId.Navigate) != -1)
            //     OM.push(_this._orbitCtrlHandle);
            if (_this._mobileEvent != undefined && $("#sensorOff").data("on") && OM.indexOf(Communicator.OperatorId.Walk) != -1)
                _this._mobileEvent.sensorOn();
            $('.resultBtn[data-command="annotation"]').data("on", false).css("background-color", "white");
        }

        $('#comment').val(date + '\n' + _this._userName + '\n');
        $('#comment').focus();

        var canvas = document.getElementById('imgCanvas');
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 1024, 1024);
        $('#imgCanvas').hide();

        _this._imgData = undefined;
    },

    _addResultTable: function (id, result) {
        var _this = this;

        function selectCell() {
            var cell = this;
            var tr = cell.parentNode;
            var key = tr.cells[0].innerHTML;
            plantViewer.updateResults(key);

            var table = document.getElementById("resultsTbl");
            for (var i = 1; i < table.rows.length; i++) {
                var row = table.rows[i];
                row.style.color = "";
                row.style.backgroundColor = "";
            }

            tr.style.color = "#000000";
            tr.style.backgroundColor = "#ff8080";
        }

        var table = document.getElementById('resultsTbl');
        var row = table.insertRow(-1);

        var cell = row.insertCell(-1);
        cell.innerHTML = id;
        cell.onclick = selectCell;

        var cell = row.insertCell(-1);
        cell.innerHTML = result.user;
        cell.onclick = selectCell;

        var cell = row.insertCell(-1);
        if (result.OK)
            cell.innerHTML = 'OK';
        else
            cell.innerHTML = 'NG';
        cell.align = "center";
        cell.onclick = selectCell;

        var cell = row.insertCell(-1);
        cell.innerHTML = '<input class="tableBtn" type="image" title="Delete" src="images/delete.png" onclick="deleteRow(this)" />';
        cell.align = "center";
    },

    updateResults: function (key) {
        var _this = this;
        var result = _this._inspections[key];

        // Set comment
        var comment = result.comment;
        if (comment != undefined) {
            $('#commentRes').val(comment);
        } else {
            $('#commentRes').val('');
        }

        // Set photo
        var image = result.image;
        if (image != undefined) {
            $('#imageRes').attr('src', 'Plant1/' + _this._plantName + '/' + image);

            var rad = result.imageRotation;
            var ua = navigator.userAgent;
            if (ua.indexOf("iPhone") > 0 || ua.indexOf("iPod") > 0 || ua.indexOf("iPad") > 0) {
                switch (rad) {
                    case 0:
                    case 180:
                        $('#imageRes').css({ 'width': '300px', 'height': '225px' });
                        break
                    case 90:
                    case -90:
                        $('#imageRes').css({ 'width': '225px', 'height': '300px' });
                        break;
                }
            } else {
                $('#imageRes').css({ 'width': '300px', 'height': '225px' });
                switch (rad) {
                    case 0:
                        $('#imageRes').css('transform', 'rotate(0deg) translate(0px,0px)');
                        break
                    case 90:
                        $('#imageRes').css('transform', 'rotate(90deg) translate(40px,40px)');
                        break;
                    case -90:
                        $('#imageRes').css('transform', 'rotate(-90deg) translate(-40px,-40px)');
                        break;
                    case 180:
                        $('#imageRes').css('transform', 'rotate(180deg) translate(0px,0px)');
                        break;
                }
            }
        } else {
            d = new Date();
            $('#imageRes').attr('src', d.getTime());
        }

        // Set camera
        var camera = result.camera;
        if (camera != undefined) {
            camera = Communicator.Camera.construct(camera);
            _this._viewer.getView().setCamera(camera, 500);

            setTimeout(function () {
                var OM = _this._viewer.operatorManager;
                if (result.walk) {
                    if (OM.indexOf(_this._customTurnHandle) != -1) {
                        _this._walkModeOnOff(true);
                    } else {
                        _this._mobileEvent.ResetPrevious();
                    }
                } else {
                    if (OM.indexOf(Communicator.OperatorId.Walk) != -1) {
                        _this._walkModeOnOff(false);
                    }
                }
            }, 600);
        }

        // Set markups
        _this._annotOp.deleteAll();
        var markups = result.markups;
        if (markups != undefined) {
            for (var i = 0; i < markups.length; i++) {
                var markup = markups[i];
                var p1 = Communicator.Point3.construct(markup.leaderAnchor);
                var p2 = Communicator.Point3.construct(markup.textBoxAnchor);
                _this._annotOp.createMarkup(markup.label, p1, p2);
            }
        }
    },

    deleteResults: function (key) {
        var _this = this;
        delete _this._inspections[key];

        ajax_data = JSON.stringify(_this._inspections)

        $.ajax({
            url: "/api/export_json",
            type: "post",
            dataType: 'json',
            data: {
                data: ajax_data,
                filePath: 'Plant1/' + _this._plantName + '/inspections.json'
            },
            error: function (err) {
                console.log(err);
            }
        });


        $.ajax({
            url: "/api/delete_file",
            type: "post",
            dataType: 'json',
            data: {
                filePath: 'Plant1/' + _this._plantName + '/' + key + '.jpg'
            },
        });

        _this._annotOp.deleteAll();
        $('#commentRes').val('');
        $('#imageRes').attr('src', '');
    }
};

function deleteRow(obj) {
    var tr = obj.parentNode.parentNode;

    var key = tr.cells[0].innerHTML;
    plantViewer.deleteResults(key);

    var id = tr.sectionRowIndex;
    var table = document.getElementById("resultsTbl");
    for (var i = 1; i < table.rows.length; i++) {
        var row = table.rows[i];
        row.style.color = "";
        row.style.backgroundColor = "";
    }
    table.deleteRow(id);
}

export default plant_viewer;