var ClipFunc = function(viewer) {
    this._viewer = viewer;
    this._cuttingSection;
    this._box;
    this._current = 0;
};

ClipFunc.prototype = {
    on: function() {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this._viewer.getModel().getModelBounding(true, false).then(function(box) {
                _this._box = box;
                var CM = _this._viewer.cuttingManager;
                CM.setCappingFaceColor(new Communicator.Color(0, 255, 255));

                var refGeom = [];

                // x
                refGeom.length = 0;
                refGeom.push(new Communicator.Point3(0, box.min.y, box.min.z));
                refGeom.push(new Communicator.Point3(0, box.min.y, box.max.z));
                refGeom.push(new Communicator.Point3(0, box.max.y, box.max.z));
                refGeom.push(new Communicator.Point3(0, box.max.y, box.min.z));
                // -x
                {
                    var section = CM.getCuttingSection(0);
                    section.setColor(new Communicator.Color(255, 0, 0));
                    var plane = section.getPlane(0);
                    if(plane == null) {
                        plane = new Communicator.Plane();
                        plane.normal.set(-1, 0, 0);
                        plane.d = box.min.x;
                        section.addPlane(plane, refGeom);
                    } else {
                        section.clear();
                        section.addPlane(plane, refGeom);
                    }
                    section.activate();
                }
                // +x
                {
                    var section = CM.getCuttingSection(1);
                    var plane = section.getPlane(0);
                    if(plane == null) {
                        plane = new Communicator.Plane();
                        plane.normal.set(1, 0, 0);
                        plane.d = - box.max.x;
                        section.addPlane(plane, refGeom);
                    } else {
                        section.clear();
                        section.addPlane(plane, refGeom);
                    }
                    section.activate();
                }
                
                // y
                refGeom.length = 0;
                refGeom.push(new Communicator.Point3(box.min.x, 0, box.min.z));
                refGeom.push(new Communicator.Point3(box.min.x, 0, box.max.z));
                refGeom.push(new Communicator.Point3(box.max.x, 0, box.max.z));
                refGeom.push(new Communicator.Point3(box.max.x, 0, box.min.z));
                // -y
                {
                    var section = CM.getCuttingSection(2);
                    var plane = section.getPlane(0);
                    if(plane == null) {
                        plane = new Communicator.Plane();
                        plane.normal.set(0, -1, 0);
                        plane.d = box.min.y;
                        section.addPlane(plane, refGeom);
                    } else {
                        section.clear();
                        section.addPlane(plane, refGeom);
                    }
                    section.activate();
                }
                // +y
                {
                    var section = CM.getCuttingSection(3);
                    var plane = section.getPlane(0);
                    if(plane == null) {
                        plane = new Communicator.Plane();
                        plane.normal.set(0, 1, 0);
                        plane.d = - box.max.y;
                        section.addPlane(plane, refGeom);
                    } else {
                        section.clear();
                        section.addPlane(plane, refGeom);
                    }
                    section.activate();
                }
                
                // z
                refGeom.length = 0;
                refGeom.push(new Communicator.Point3(box.min.x, box.min.y, 0));
                refGeom.push(new Communicator.Point3(box.min.x, box.max.y, 0));
                refGeom.push(new Communicator.Point3(box.max.x, box.max.y, 0));
                refGeom.push(new Communicator.Point3(box.max.x, box.min.y, 0));
                // -z
                {
                    var section = CM.getCuttingSection(4);
                    var plane = section.getPlane(0);
                    if(plane == null) {
                        plane = new Communicator.Plane();
                        plane.normal.set(0, 0, -1);
                        plane.d = box.min.z;
                        section.addPlane(plane, refGeom);
                    } else {
                        section.clear();
                        section.addPlane(plane, refGeom);
                    }
                    section.activate();
                }
                // +z
                {
                    var section = CM.getCuttingSection(5);
                    var plane = section.getPlane(0);
                    if(plane == null) {
                        plane = new Communicator.Plane();
                        plane.normal.set(0, 0, 1);
                        plane.d = - box.max.z;
                        section.addPlane(plane, refGeom);
                    } else {
                        section.clear();
                        section.addPlane(plane, refGeom);
                    }
                    section.activate();
                }
                
                resolve();
            });
        });
    },
    
    off: function() {
        var _this = this;
        
        var CM = _this._viewer.cuttingManager;
        for(var i = 0; i < 6; i++) {
            var section = CM.getCuttingSection(i);
            section.deactivate();
        }
    },
    
    _hideOnePlane: function() {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var CM = _this._viewer.cuttingManager;
            var section = CM.getCuttingSection(_this._current);
            var plane = section.getPlane(0);
            section.clear().then(function (){
                section.addPlane(plane, null);
                section.activate().then(function(data) {
                    _this._current++;
                    if (6 <= _this._current) {
                        resolve()
                    } else {
                        _this._hideOnePlane()
                        resolve();
                    }
                });
            });
        });
    },
    
    hideCuttingPlane: function() {
        var _this = this;
        _this._current = 0;
        _this._hideOnePlane();
    },
    
    reset: function() {
        var _this = this;
        
        var CM = _this._viewer.cuttingManager;
        for(var i = 0; i < 6; i++) {
            var section = CM.getCuttingSection(i);
            section.clear();
        }
        
        _this.on();
    }

    
};